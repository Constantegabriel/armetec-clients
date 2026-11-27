import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {camSmooth} from '../animations/camera';
import {combine, slamIn, riseIn} from '../animations/kinetic';
import {CssWorld, Plane, type CamState} from '../components/CssWorld';
import {COLORS, FONTS} from '../config/theme';
import {useOutlines} from '../three/outlines';
import {ParticleMorph} from '../three/ParticleMorph';
import {Stage} from '../three/Stage';
import {SplitText} from '../typography/SplitText';
import {Title, eyebrow} from '../typography/Title';
import {WORK_SIZE, WorkItem, type WorkKind} from '../interfaces/WorkItems';
import {OrderedTile, TILE, gridSlots} from '../interfaces/OrderedTile';
import {EASE} from '../utils/easing';
import {useLayout} from '../utils/layout';
import {clamp, lerp} from '../utils/math';
import {hash01} from '../utils/random';
import {beat, prog, sec} from '../utils/time';

/**
 * SCENES 03d + 04 — accumulation: every kind of operational fragment flies in
 * from every direction → FREEZE on "AUTOMÁTICOS" → the frozen chaos
 * re-organises into precise modules; PROBLEMAS dissolves into segments that
 * re-form as CRESCIMENTO (clean type, no extrusion).
 */

const D = beat('s03d');
const FREEZE = beat('s03_wAutomaticos');
const S4 = beat('s04');
const PROB = beat('s04_wProblemas');
const REORG = beat('s04_reorganize');
const DISSOLVE = beat('s04_dissolve');
const GROW = beat('s04_wCrescimento');
const END = sec(39.5);

const PROB_Z = -10400;
export const GRID_Z = -10900;
const CAM_END_Z = -8000;

/** Motion clock: stops dead at the freeze, everything holds in space. */
const motionFrame = (f: number) => Math.min(f, FREEZE);

const useCam = (f: number): CamState =>
  camSmooth(
    f,
    [
      // continues the pull-back of the repetition scene, then drives into the accumulation
      {f: D - 20, pos: [120, 80, -5400], target: [0, 0, -7600], lens: 35, roll: -2, aperture: 1},
      {f: FREEZE - 40, pos: [20, -10, -7350], target: [50, 0, -9500], lens: 35, roll: -4, aperture: 1.1},
      // hard stop on AUTOMÁTICOS (rig decelerates to rest)
      {f: FREEZE, pos: [30, -20, -7600], target: [60, 0, -9600], lens: 35, roll: -5, aperture: 1.1, stop: true},
      {f: S4, pos: [30, -20, -7610], target: [60, 0, -9600], lens: 35, roll: -5, aperture: 1.1, stop: true},
      // scene 4: slow move between frozen elements
      {f: REORG, pos: [-140, 60, -7900], target: [0, 0, PROB_Z], lens: 35, roll: -1, focus: 2500, aperture: 0.8},
      {f: END, pos: [0, 0, CAM_END_Z], target: [0, 0, GRID_Z], lens: 35, roll: 0, focus: GRID_Z * -1 + CAM_END_Z, aperture: 0.6, stop: true},
    ],
    2,
  );

/* ---------------------------------- items --------------------------------- */

type Item = {
  kind: WorkKind;
  k: number;
  /** chaos position + velocity (px / frame) */
  p: [number, number, number];
  v: [number, number, number];
  rot: [number, number, number];
  spin: number;
  spawn: number;
  /** grid slot for the re-organisation (scene 4), -1 = notification that disappears */
  slot: number;
};

const KINDS: WorkKind[] = ['doc', 'msg', 'file', 'folder', 'note', 'sheet', 'task'];

const useItems = (vertical: boolean) =>
  useMemo(() => {
    const items: Item[] = [];
    // D — accumulation: everything, from every direction
    let slot = 0;
    for (let i = 0; i < 30; i++) {
      const r = (k: number) => hash01(i, 300 + k);
      const kind = KINDS[(i * 3) % KINDS.length];
      const a = r(1) * Math.PI * 2;
      const rad = 380 + r(2) * 950;
      const dir = r(3) * Math.PI * 2;
      const speed = 2.5 + r(4) * 4.5;
      const isNote = kind === 'note';
      items.push({
        kind,
        k: i + 7,
        p: [Math.cos(a) * rad * (vertical ? 0.8 : 1.5), Math.sin(a) * rad * (vertical ? 1.5 : 0.85), -8300 - r(5) * 2200],
        v: [Math.cos(dir) * speed, Math.sin(dir) * speed, (r(6) - 0.5) * 6],
        rot: [(r(7) - 0.5) * 40, (r(8) - 0.5) * 60, (r(9) - 0.5) * 40],
        spin: (r(10) - 0.5) * 1.2,
        spawn: D - 30 + r(11) * 110,
        slot: isNote ? -1 : slot++,
      });
    }
    return items;
  }, [vertical]);

/** Current transform of an item (chaos → frozen → ordered grid). */
const itemState = (it: Item, f: number, grid: ReturnType<typeof gridSlots>) => {
  const mf = motionFrame(f);
  const age = Math.max(0, mf - it.spawn);
  // items fly in from 600px further out, decelerating
  const arrive = EASE.out(clamp(age / 50));
  const out = (1 - arrive) * 700;
  const len = Math.hypot(it.p[0], it.p[1]) || 1;
  let x = it.p[0] + (it.p[0] / len) * out + it.v[0] * age;
  let y = it.p[1] + (it.p[1] / len) * out + it.v[1] * age;
  let z = it.p[2] + it.v[2] * age;
  let rx = it.rot[0];
  let ry = it.rot[1];
  let rz = it.rot[2] + it.spin * age;
  let morph = 0;
  let opacity = clamp(age / 16);
  if (it.slot >= 0 && grid[it.slot]) {
    const g = grid[it.slot];
    // staggered settle into precise positions
    const k = EASE.dolly(clamp((f - REORG - (it.slot % 7) * 4 - Math.floor(it.slot / 7) * 3) / 120));
    x = lerp(x, g.x, k);
    y = lerp(y, g.y, k);
    z = lerp(z, GRID_Z, k);
    rx = lerp(rx, 0, k);
    ry = lerp(ry, 0, k);
    rz = lerp(rz, 0, k);
    morph = clamp((k - 0.35) / 0.5);
  } else if (it.slot !== -2) {
    // notifications simply disappear
    opacity *= 1 - prog(f, REORG + 10, REORG + 50, EASE.in);
  }
  return {x, y, z, rx, ry, rz, morph, opacity};
};

const WorkField: React.FC<{f: number; items: Item[]; layer: 'all' | 'front' | 'back'; vertical: boolean}> = ({f, items, layer, vertical}) => {
  const grid = gridSlots(vertical);
  return (
    <>
      {items.map((it, i) => {
        if (f < it.spawn) return null;
        // B items are only relevant until the camera has passed them
        if (it.slot === -2 && f > D + 40) return null;
        const s = itemState(it, f, grid);
        if (layer === 'front' && s.z < PROB_Z) return null;
        if (layer === 'back' && s.z >= PROB_Z) return null;
        const [w0, h0] = WORK_SIZE[it.kind];
        const w = lerp(w0, TILE.w, s.morph);
        const h = lerp(h0, TILE.h, s.morph);
        return (
          <Plane key={i} x={s.x} y={s.y} z={s.z} rx={s.rx} ry={s.ry} rz={s.rz} w={w} h={h} opacity={s.opacity * (1 - 0.55 * s.morph * prog(f, GROW - 30, GROW + 20))}>
            {s.morph < 1 ? (
              <div style={{position: 'absolute', inset: 0, opacity: 1 - s.morph}}>
                <WorkItem kind={it.kind} k={it.k} check={it.kind === 'task' ? clamp((f - it.spawn - 20) / 12) : 0} />
              </div>
            ) : null}
            {s.morph > 0 ? (
              <div style={{position: 'absolute', inset: 0, opacity: s.morph}}>
                <OrderedTile slot={it.slot} f={f} />
              </div>
            ) : null}
          </Plane>
        );
      })}
    </>
  );
};

/** Connections drawn between ordered tiles once aligned ("linhas se conectam"). */
const GridLinks: React.FC<{f: number; vertical: boolean}> = ({f, vertical}) => {
  const grid = gridSlots(vertical);
  const t = prog(f, REORG + 110, REORG + 190, EASE.inOut);
  if (t <= 0) return null;
  const xs = grid.map((g) => g.x);
  const ys = grid.map((g) => g.y);
  const minX = Math.min(...xs) - TILE.w;
  const minY = Math.min(...ys) - TILE.h;
  const W = Math.max(...xs) - minX + TILE.w;
  const H = Math.max(...ys) - minY + TILE.h;
  const cols = vertical ? 4 : 6;
  const lines: Array<[number, number, number, number]> = [];
  grid.forEach((g, i) => {
    if ((i + 1) % cols !== 0 && grid[i + 1]) lines.push([g.x + TILE.w / 2, g.y, grid[i + 1].x - TILE.w / 2, grid[i + 1].y]);
    if (grid[i + cols] && i % 2 === 0) lines.push([g.x, g.y + TILE.h / 2, grid[i + cols].x, grid[i + cols].y - TILE.h / 2]);
  });
  return (
    <Plane x={minX + W / 2} y={minY + H / 2} z={GRID_Z - 2} w={W} h={H}>
      <svg width={W} height={H} style={{overflow: 'visible'}}>
        {lines.map(([x1, y1, x2, y2], i) => {
          const len = Math.hypot(x2 - x1, y2 - y1);
          const k = clamp(t * 1.6 - (i / lines.length) * 0.6);
          return (
            <line
              key={i}
              x1={x1 - minX}
              y1={y1 - minY}
              x2={x2 - minX}
              y2={y2 - minY}
              stroke={COLORS.accent}
              strokeOpacity={0.7}
              strokeWidth={2.5}
              strokeDasharray={len}
              strokeDashoffset={len * (1 - k)}
            />
          );
        })}
      </svg>
    </Plane>
  );
};

/* --------------------------------- typography ------------------------------ */

const TypeD: React.FC<{f: number}> = ({f}) => {
  const L = useLayout();
  const s = L.u;
  const t = beat('s03_wProcessos');
  const out = S4 - 4;
  if (f < t - 5 || f > out + 30) return null;
  const frozen = f >= FREEZE;
  const fade = 1 - prog(f, out, out + 22, EASE.in);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: fade}}>
      {/* local light falloff behind the type (contrast without outlines) */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse ${L.vertical ? 90 : 55}% ${L.vertical ? 22 : 34}% at 50% ${50 + ((L.safeCenterY - 20 * s) / L.height) * 100}%, rgba(0,0,0,${0.8 * prog(f, t - 20, t + 10)}), rgba(0,0,0,${0.45 * prog(f, t - 20, t + 10)}) 50%, transparent 100%)`}} />
      <div style={{transform: `translateY(${L.safeCenterY - 20 * s}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 * s}}>
        <SplitText text="PROCESSOS QUE" family={FONTS.sans} size={(L.vertical ? 56 : 52) * s} weight={400} tracking={0.22} color={COLORS.gray} state={riseIn(f, t, {stagger: 1.2})} />
        <SplitText text="PODERIAM SER" family={FONTS.sans} size={(L.vertical ? 56 : 52) * s} weight={400} tracking={0.22} color={COLORS.gray} state={riseIn(f, t + 30, {stagger: 1.2})} />
        <div style={{height: 18 * s}} />
        <SplitText
          text="AUTOMÁTICOS"
          family={FONTS.display}
          size={(L.vertical ? 136 : 150) * s}
          weight={750}
          tracking={-0.04}
          state={combine(slamIn(f, FREEZE, {from: 1.5, damping: 18}), () => ({color: frozen ? COLORS.white : COLORS.white}))}
        />
        {/* precision guides lock on the freeze */}
        <div style={{width: (L.vertical ? 900 : 1100) * s, height: 2, marginTop: 14 * s, background: `linear-gradient(90deg, transparent, ${COLORS.accent}, transparent)`, transform: `scaleX(${EASE.out(prog(f, FREEZE, FREEZE + 24))})`}} />
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------- scene 4 words ------------------------------ */

/**
 * PROBLEMAS / CRESCIMENTO as clean Geist type placed in world space at the
 * particle plane — the DOM glyphs and the WebGL particles share one camera, so
 * the word dissolves into segments exactly where it stands, and re-forms.
 */
const WorldWord: React.FC<{text: string; size: number; f: number; appear: number; hide: number; color: string; weight: number; scale?: number}> = ({text, size, f, appear, hide, color, weight, scale = 1}) => {
  const a = EASE.out(prog(f, appear, appear + 46, EASE.linear));
  const out = prog(f, hide - 10, hide + 4, EASE.inOut);
  if (f < appear - 1 || f > hide + 6) return null;
  return (
    <Plane x={0} y={0} z={PROB_Z} w={size * 9} h={size * 1.4} sharp scale={scale}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONTS.display,
          fontWeight: weight,
          fontSize: size,
          letterSpacing: '0.03em',
          lineHeight: 1,
          color,
          clipPath: `inset(${(1 - a) * 100}% -10% -10% -10%)`,
          transform: `translateY(${(1 - a) * size * 0.4}px)`,
          opacity: 1 - out,
          filter: out > 0.02 ? `blur(${out * 10}px)` : undefined,
        }}
      >
        {text}
      </div>
    </Plane>
  );
};

const TypeS4: React.FC<{f: number}> = ({f}) => {
  const L = useLayout();
  const v = L.vertical;
  const off = (v ? 300 : 230) * L.u;
  return (
    <>
      <Title f={f} at={PROB - 70} out={PROB + 110} anchor="center" offset={-off} scrim={0.6} lines={[eyebrow('ENQUANTO VOCÊ ADMINISTRA', 36)]} />
      <Title f={f} at={sec(36.0)} out={END - 30} anchor="center" offset={-off} scrim={0.6} lines={[eyebrow('PODERIA ESTAR ADMINISTRANDO O', 32)]} />
      <Title f={f} at={GROW + 30} out={END - 24} anchor="center" offset={off} scrim={1} lines={[{...eyebrow('DA SUA EMPRESA', 36), color: COLORS.white}]} />
    </>
  );
};

/* ---------------------------------- scene ---------------------------------- */

export const S03dS04Turn: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame() + from;
  const L = useLayout();
  const cam = useCam(f);
  const items = useItems(L.vertical);
  const size = L.vertical ? 150 : 210;
  const outlines = useOutlines(['PROBLEMAS', 'CRESCIMENTO'], size, 0.03);
  if (!outlines) return null;
  const [problemas, crescimento] = outlines;
  const crescScale = Math.min(1, problemas.width / crescimento.width) * (L.vertical ? 1 : 1);

  // light: cold & dark in the chaos → open, confident after the turn
  const dawn = prog(f, REORG, END, EASE.inOut);
  const flash = Math.exp(-Math.max(0, f - FREEZE) / 6) * (f >= FREEZE ? 1 : 0);
  const desat = f >= FREEZE ? 0.85 * (1 - prog(f, S4 + 20, REORG + 40)) : 0;
  const morphT = prog(f, DISSOLVE, GROW, EASE.linear);
  const showStage = f >= DISSOLVE - 5 && f < GROW + 20;
  const wordPool = prog(f, PROB - 20, PROB + 20) * (1 - prog(f, DISSOLVE, DISSOLVE + 30)) + prog(f, GROW - 30, GROW + 10) * (1 - prog(f, END - 10, END + 20));

  return (
    <AbsoluteFill style={{background: COLORS.black}}>
      {/* environment light */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 90% 60% at 50% 105%, rgba(81,112,255,${0.05 + dawn * 0.32}) 0%, rgba(20,24,40,${dawn * 0.5}) 45%, rgba(5,5,5,0) 75%), radial-gradient(ellipse 70% 50% at 50% 40%, rgba(255,255,255,${0.02 + dawn * 0.05}), transparent 70%)`,
        }}
      />
      {/* back layer: everything behind the monumental word */}
      <CssWorld cam={cam}>
        <GridLinks f={f} vertical={L.vertical} />
        <WorkField f={f} items={items} layer="back" vertical={L.vertical} />
      </CssWorld>

      {showStage ? (
        <Stage cam={cam} background={null} envIntensity={0.5 + dawn * 0.4} exposure={1}>
          <directionalLight position={[3, 6, 8]} intensity={1.2 + dawn * 1.5} />
          <directionalLight position={[-6, -2, -4]} intensity={2.5} color="#9fb0ff" />
          <pointLight position={[0, -3, PROB_Z / 100 + 6]} intensity={dawn * 60} color={COLORS.accent} distance={0} decay={1.2} />
          <group position={[0, 0, PROB_Z / 100]}>
            <ParticleMorph from={problemas} to={crescimento} t={morphT} visible={f >= DISSOLVE && f < GROW + 10} toScale={crescScale} depth={60} />
          </group>
        </Stage>
      ) : null}

      {/* contrast: the grid recedes into shadow while the words speak */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${L.vertical ? 95 : 60}% ${L.vertical ? 20 : 30}% at 50% 50%, rgba(0,0,0,${0.85 * wordPool}), rgba(0,0,0,${0.5 * wordPool}) 55%, transparent 100%)`,
        }}
      />
      {/* front layer */}
      <CssWorld cam={cam}>
        <WorkField f={f} items={items} layer="front" vertical={L.vertical} />
      </CssWorld>
      {/* the words live on their own layer: never occluded by passing fragments */}
      <CssWorld cam={cam}>
        <WorldWord text="PROBLEMAS" size={size} f={f} appear={PROB} hide={DISSOLVE} color={COLORS.white} weight={600} />
        <WorldWord text="CRESCIMENTO" size={size} f={f} appear={GROW - 4} hide={END + 30} color={COLORS.white} weight={600} scale={crescScale} />
      </CssWorld>

      {/* freeze: flash + desaturation hold */}
      <AbsoluteFill style={{background: '#808080', mixBlendMode: 'saturation', opacity: desat, pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: '#fff', opacity: flash * 0.22, mixBlendMode: 'screen', pointerEvents: 'none'}} />

      <TypeD f={f} />
      <TypeS4 f={f} />
    </AbsoluteFill>
  );
};
