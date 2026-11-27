import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {camPath, type CamKey} from '../animations/camera';
import {combine, dissolveOut, focusIn, riseIn, slamIn} from '../animations/kinetic';
import {CssWorld, Plane, type CamState} from '../components/CssWorld';
import {COLORS, FONTS} from '../config/theme';
import {useExtruded, useOutlines} from '../three/ExtrudedText';
import type {TextOutline} from '../three/fontShapes';
import {MAT} from '../three/materials';
import {ParticleMorph} from '../three/ParticleMorph';
import {Stage} from '../three/Stage';
import {SplitText} from '../typography/SplitText';
import {Spreadsheet} from '../interfaces/Spreadsheet';
import {SearchBar, TaskItem, WORK_SIZE, WorkItem, type WorkKind} from '../interfaces/WorkItems';
import {OrderedTile, TILE, gridSlots} from '../interfaces/OrderedTile';
import {EASE} from '../utils/easing';
import {useLayout} from '../utils/layout';
import {clamp, lerp} from '../utils/math';
import {hash01} from '../utils/random';
import {beat, prog, sec} from '../utils/time';

/**
 * SCENES 03 + 04 — one continuous camera move through operational chaos:
 * spreadsheets → searching → repetition → accumulation → FREEZE ("AUTOMÁTICOS")
 * → the frozen chaos re-organises itself; PROBLEMAS dissolves into CRESCIMENTO.
 */

const A = beat('s03a');
const B = beat('s03b');
const C = beat('s03c');
const D = beat('s03d');
const FREEZE = beat('s03_wAutomaticos');
const S4 = sec(25);
const PROB = beat('s04_wProblemas');
const REORG = beat('s04_reorganize');
const DISSOLVE = beat('s04_dissolve');
const GROW = beat('s04_wCrescimento');
const END = sec(33);

const SHEET = {w: 1500, h: 2000};
const PROB_Z = -10400;
export const GRID_Z = -10900;
const CAM_END_Z = -8000;

/** Motion clock: stops dead at the freeze, everything holds in space. */
const motionFrame = (f: number) => Math.min(f, FREEZE);

const useCam = (f: number, vertical: boolean): CamState => {
  const keys: CamKey[] = [
    {f: A - 15, pos: [-430, -720, 520], target: [-380, -700, 0], lens: 50, aperture: 1.6},
    {f: A + 110, pos: [-120, -380, 1050], target: [-60, -300, 0], lens: 50, aperture: 1.3, ease: EASE.out},
    {f: B - 20, pos: [260, 120, 1900], target: [0, 0, -400], lens: 40, aperture: 1.1, ease: EASE.inOut},
    // push through the stacked sheets into the information field
    {f: B + 70, pos: [40, 0, -1450], target: [0, 0, -3200], lens: 35, aperture: 1, ease: EASE.inOut},
    {f: C - 10, pos: [-40, 30, -2900], target: [0, 0, -4800], lens: 35, roll: 2, aperture: 1, ease: EASE.linear},
    // repetition tunnel
    {f: D, pos: [0, 0, -6300], target: [0, 0, -8300], lens: 35, roll: 0, aperture: 1.1, ease: EASE.linear},
    // accumulation, then a hard stop on AUTOMÁTICOS
    {f: FREEZE, pos: [30, -20, -7600], target: [60, 0, -9600], lens: 35, roll: -5, aperture: 1.1, ease: EASE.out},
    {f: S4, pos: [30, -20, -7600], target: [60, 0, -9600], lens: 35, roll: -5, aperture: 1.1},
    // scene 4: slow move between frozen elements
    {f: REORG, pos: [-140, 60, -7900], target: [0, 0, PROB_Z], lens: 35, roll: -1, focus: 2500, aperture: 0.8, ease: EASE.inOut},
    {f: END, pos: [0, 0, CAM_END_Z], target: [0, 0, GRID_Z], lens: 35, roll: 0, focus: GRID_Z * -1 + CAM_END_Z, aperture: 0.6, ease: EASE.inOut},
  ];
  void vertical;
  return camPath(f, keys, 2);
};

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
    // B — information field around the camera path
    for (let i = 0; i < 26; i++) {
      const r = (k: number) => hash01(i, 100 + k);
      const a = r(1) * Math.PI * 2;
      const rad = 480 + r(2) * 900;
      items.push({
        kind: KINDS[i % 5],
        k: i,
        p: [Math.cos(a) * rad * (vertical ? 0.75 : 1.4), Math.sin(a) * rad * (vertical ? 1.4 : 0.8), -1700 - r(3) * 2700],
        v: [(r(4) - 0.5) * 0.6, (r(5) - 0.5) * 0.6, 0],
        rot: [(r(6) - 0.5) * 30, (r(7) - 0.5) * 50, (r(8) - 0.5) * 24],
        spin: (r(9) - 0.5) * 0.25,
        spawn: B - 60 + r(10) * 80,
        slot: -2,
      });
    }
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
          <Plane key={i} x={s.x} y={s.y} z={s.z} rx={s.rx} ry={s.ry} rz={s.rz} w={w} h={h} opacity={s.opacity}>
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

/* ------------------------------ sheets & tunnel --------------------------- */

const Sheets: React.FC<{f: number}> = ({f}) => {
  if (f > B + 90) return null;
  const sheets = [
    {x: 0, y: 0, z: 0, seed: 0, t0: A - 20, rate: 0.62, title: 'Controle_Pedidos_FINAL_v7.xlsx'},
    {x: 380, y: -260, z: -520, seed: 3, t0: A + 40, rate: 0.9, title: 'Estoque_conferência_MANUAL.xlsx'},
    {x: -420, y: 300, z: -1040, seed: 5, t0: A + 90, rate: 1.1, title: 'Financeiro_out_revisado(2).xlsx'},
  ];
  return (
    <>
      {sheets.map((s, i) => {
        const a = EASE.out(clamp((f - s.t0) / 40));
        if (a <= 0) return null;
        return (
          <Plane key={i} x={s.x} y={s.y} z={s.z - (1 - a) * 400} w={SHEET.w} h={SHEET.h} opacity={a} nearFade={420}>
            <Spreadsheet w={SHEET.w} h={SHEET.h} filled={Math.max(0, (f - s.t0) * s.rate)} seed={s.seed} title={s.title} />
          </Plane>
        );
      })}
    </>
  );
};

/** Identical task cards receding in depth — check, duplicate, reset, again. */
const TaskTunnel: React.FC<{f: number; vertical: boolean}> = ({f, vertical}) => {
  if (f < C - 120 || f > FREEZE + 200) return null;
  const n = 14;
  const period = 30; // one repetition every 0.5 s (synced to the click SFX)
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const z = -3900 - i * 300;
        const side = i % 2 === 0 ? -1 : 1;
        const x = side * (vertical ? 330 : 560);
        const y = ((i % 4) - 1.5) * (vertical ? 260 : 140);
        const mf = motionFrame(f);
        const local = (mf - C + i * 6 + period * 4) % period;
        const check = clamp((local - 8) / 6);
        return (
          <Plane key={i} x={x} y={y} z={z} ry={-side * 18} w={560} h={132} opacity={clamp((f - (C - 120) - i * 4) / 20)}>
            <TaskItem check={check} accent={i === 0} meta={`Repetição ${(i + Math.floor((mf - C) / period) + 1).toString().padStart(2, '0')} · manual`} />
          </Plane>
        );
      })}
    </>
  );
};

/* --------------------------------- typography ------------------------------ */

const TypeA: React.FC<{f: number}> = ({f}) => {
  const L = useLayout();
  const s = L.u;
  const t = beat('s03a') + 20;
  const out = B - 14;
  if (f < t - 5 || f > out + 30) return null;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{transform: `translateY(${L.vertical ? 420 * s : 300 * s}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <SplitText text="PREENCHENDO" size={(L.vertical ? 74 : 70) * s} weight={300} tracking={0.24} state={combine(focusIn(f, t, {spread: 0.4}), dissolveOut(f, out, {stagger: 0.7}))} />
        <SplitText
          text="PLANILHAS"
          size={(L.vertical ? 150 : 140) * s}
          weight={700}
          tracking={-0.02}
          state={combine(riseIn(f, t + 14, {stagger: 2}), dissolveOut(f, out + 3, {stagger: 0.7}))}
          prevState={combine(riseIn(f - 1, t + 14, {stagger: 2}), dissolveOut(f - 1, out + 3, {stagger: 0.7}))}
        />
      </div>
    </AbsoluteFill>
  );
};

const QUERIES = ['contrato cliente versão final', 'planilha atualizada março', 'orçamento enviado ontem'];
const TypeB: React.FC<{f: number}> = ({f}) => {
  const L = useLayout();
  const s = L.u;
  const t = B + 18;
  const out = C - 12;
  if (f < t - 10 || f > out + 30) return null;
  const local = f - t;
  const qi = Math.min(QUERIES.length - 1, Math.floor(local / 52));
  const q = QUERIES[qi];
  const ql = local - qi * 52;
  const typed = q.slice(0, Math.max(0, Math.floor(ql * 1.1)));
  const deleting = ql > 40 && qi < QUERIES.length - 1;
  const shown = deleting ? typed.slice(0, Math.max(0, typed.length - (ql - 40) * 4)) : typed;
  const bar = EASE.out(clamp((f - t + 10) / 24)) * (1 - prog(f, out, out + 18, EASE.in));
  const status = ql < 30 ? `Buscando em pastas, e-mails e ${12 + qi * 7} planilhas…` : 'Nenhum resultado exato encontrado';
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', perspective: 1600}}>
      <div style={{transform: `translateY(${(L.vertical ? -330 : -170) * s}px) rotateX(${(1 - bar) * 40}deg) scale(${(L.vertical ? 1.12 : 1) * s})`, opacity: bar}}>
        <SearchBar query={shown} caret={Math.floor(f / 18) % 2 === 0} status={status} progress={clamp((ql % 52) / 30)} w={L.vertical ? 820 : 900} />
      </div>
      <div style={{position: 'absolute', transform: `translateY(${(L.vertical ? 360 : 300) * s}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <SplitText text="PROCURANDO" size={(L.vertical ? 112 : 110) * s} weight={700} tracking={-0.01} state={combine(riseIn(f, t + 8), dissolveOut(f, out, {stagger: 0.6}))} />
        <SplitText text="INFORMAÇÕES" size={(L.vertical ? 74 : 70) * s} weight={300} tracking={0.2} state={combine(focusIn(f, t + 22, {spread: 0.5}), dissolveOut(f, out + 2, {stagger: 0.6}))} />
      </div>
    </AbsoluteFill>
  );
};

const TypeC: React.FC<{f: number}> = ({f}) => {
  const L = useLayout();
  const s = L.u;
  const t = C + 10;
  const out = D - 10;
  if (f < t - 5 || f > out + 30) return null;
  const period = 30;
  const reps = 7;
  const fade = 1 - prog(f, out, out + 20, EASE.in);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', perspective: 900}}>
      <div style={{transform: `translateY(${L.safeCenterY - 30 * s}px)`, transformStyle: 'preserve-3d', position: 'relative'}}>
        {Array.from({length: reps}, (_, i) => {
          // echo copies are added one per repetition, receding into depth
          const born = t + i * (period * 0.5);
          const a = clamp((f - born) / 10);
          if (a <= 0) return null;
          const pulse = Math.exp(-(((f - C) % period) / 6)) * 0.08;
          return (
            <div
              key={i}
              style={{
                position: i === 0 ? 'relative' : 'absolute',
                left: 0,
                top: 0,
                transform: `translate3d(0, ${-i * 18 * s}px, ${-i * 190}px) scale(${1 + (i === 0 ? pulse : 0)})`,
                opacity: (i === 0 ? 1 : 0.55 / i) * a * fade,
                filter: i > 0 ? `blur(${i * 0.8}px)` : undefined,
              }}
            >
              <SplitText text="REPETINDO" size={(L.vertical ? 150 : 150) * s} weight={700} tracking={-0.02} state={() => ({})} color={i === 0 ? COLORS.white : COLORS.gray} />
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', transform: `translateY(${L.safeCenterY + (L.vertical ? 130 : 110) * s}px)`, opacity: fade}}>
        <SplitText text="TAREFAS" size={(L.vertical ? 78 : 72) * s} weight={300} tracking={0.3} state={focusIn(f, t + 24, {spread: 0.4})} />
      </div>
    </AbsoluteFill>
  );
};

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
      <div style={{transform: `translateY(${L.safeCenterY - 20 * s}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 * s}}>
        <SplitText text="PROCESSOS QUE" size={(L.vertical ? 70 : 64) * s} weight={300} tracking={0.12} state={riseIn(f, t, {stagger: 1.2})} />
        <SplitText text="PODERIAM SER" size={(L.vertical ? 70 : 64) * s} weight={300} tracking={0.12} state={riseIn(f, t + 30, {stagger: 1.2})} />
        <div style={{height: 18 * s}} />
        <SplitText
          text="AUTOMÁTICOS"
          family={FONTS.sans}
          size={(L.vertical ? 132 : 150) * s}
          weight={800}
          tracking={-0.03}
          state={combine(slamIn(f, FREEZE, {from: 1.5, damping: 18}), () => ({color: frozen ? COLORS.white : COLORS.white}))}
        />
        {/* precision guides lock on the freeze */}
        <div style={{width: (L.vertical ? 900 : 1100) * s, height: 2, marginTop: 14 * s, background: `linear-gradient(90deg, transparent, ${COLORS.accent}, transparent)`, transform: `scaleX(${EASE.out(prog(f, FREEZE, FREEZE + 24))})`}} />
      </div>
    </AbsoluteFill>
  );
};

/* ----------------------------- scene 4 (WebGL) ----------------------------- */

const MonumentalWord: React.FC<{outline: TextOutline; f: number; appearAt: number; hideAt: number; z: number; mats: [THREE.Material, THREE.Material]; fromBelow?: boolean}> = ({
  outline,
  f,
  appearAt,
  hideAt,
  z,
  mats,
  fromBelow,
}) => {
  const geo = useExtruded(outline, {depth: 160, bevel: 5});
  const a = EASE.out(clamp((f - appearAt) / 50));
  if (!geo || f < appearAt || f >= hideAt) return null;
  return (
    <mesh
      geometry={geo}
      material={mats}
      position={[0, (fromBelow ? -(1 - a) * 3 : 0), (z - (1 - a) * 300) / 100]}
      rotation={[(1 - a) * 0.5, 0, 0]}
    />
  );
};

const TypeS4: React.FC<{f: number}> = ({f}) => {
  const L = useLayout();
  const s = L.u;
  const yTop = L.safeCenterY - (L.vertical ? 300 : 230) * s;
  const yBot = L.safeCenterY + (L.vertical ? 300 : 230) * s;
  const e1 = beat('s04_wProblemas') - 70;
  const e2 = sec(29.6);
  const e3 = GROW + 30;
  const out1 = PROB + 120;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      {f > e1 - 5 && f < out1 + 30 ? (
        <div style={{position: 'absolute', transform: `translateY(${yTop}px)`}}>
          <SplitText text="ENQUANTO VOCÊ ADMINISTRA" size={(L.vertical ? 40 : 40) * s} weight={400} tracking={0.22} color={COLORS.gray} state={combine(focusIn(f, e1, {spread: 0.3}), dissolveOut(f, out1))} />
        </div>
      ) : null}
      {f > e2 - 5 && f < END ? (
        <div style={{position: 'absolute', transform: `translateY(${yTop}px)`}}>
          <SplitText text="PODERIA ESTAR ADMINISTRANDO O" size={(L.vertical ? 34 : 38) * s} weight={400} tracking={0.18} color={COLORS.gray} state={combine(focusIn(f, e2, {spread: 0.3}), dissolveOut(f, END - 24))} />
        </div>
      ) : null}
      {f > e3 - 5 && f < END ? (
        <div style={{position: 'absolute', transform: `translateY(${yBot}px)`}}>
          <SplitText text="DA SUA EMPRESA" size={(L.vertical ? 40 : 40) * s} weight={400} tracking={0.3} color={COLORS.white} state={combine(riseIn(f, e3, {stagger: 1.2}), dissolveOut(f, END - 20))} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* ---------------------------------- scene ---------------------------------- */

export const S03S04Chaos: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame() + from;
  const L = useLayout();
  const cam = useCam(f, L.vertical);
  const items = useItems(L.vertical);
  const size = L.vertical ? 165 : 230;
  const outlines = useOutlines(['PROBLEMAS', 'CRESCIMENTO'], size, -0.01);
  if (!outlines) return null;
  const [problemas, crescimento] = outlines;
  const crescScale = Math.min(1, problemas.width / crescimento.width) * (L.vertical ? 1 : 1);

  // light: cold & dark in the chaos → open, confident after the turn
  const dawn = prog(f, REORG, END, EASE.inOut);
  const flash = Math.exp(-Math.max(0, f - FREEZE) / 6) * (f >= FREEZE ? 1 : 0);
  const desat = f >= FREEZE ? 0.85 * (1 - prog(f, S4 + 20, REORG + 40)) : 0;
  const morphT = prog(f, DISSOLVE, GROW, EASE.linear);
  const showStage = f >= S4 - 30;

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
          <MonumentalWord outline={problemas} f={f} appearAt={PROB} hideAt={DISSOLVE} z={PROB_Z} mats={[MAT.graphiteFace(), MAT.blackMetal()]} fromBelow />
          <group position={[0, 0, PROB_Z / 100]}>
            <ParticleMorph from={problemas} to={crescimento} t={morphT} visible={f >= DISSOLVE && f < GROW + 6} toScale={crescScale} depth={160} />
          </group>
          <group scale={crescScale} position={[0, 0, 0]}>
            <MonumentalWord outline={crescimento} f={f} appearAt={GROW} hideAt={END + 20} z={PROB_Z / crescScale} mats={[MAT.satinWhite(), MAT.accent()]} />
          </group>
        </Stage>
      ) : null}

      {/* front layer */}
      <CssWorld cam={cam}>
        <Sheets f={f} />
        <TaskTunnel f={f} vertical={L.vertical} />
        <WorkField f={f} items={items} layer="front" vertical={L.vertical} />
      </CssWorld>

      {/* freeze: flash + desaturation hold */}
      <AbsoluteFill style={{background: '#808080', mixBlendMode: 'saturation', opacity: desat, pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: '#fff', opacity: flash * 0.22, mixBlendMode: 'screen', pointerEvents: 'none'}} />

      <TypeA f={f} />
      <TypeB f={f} />
      <TypeC f={f} />
      <TypeD f={f} />
      <TypeS4 f={f} />
    </AbsoluteFill>
  );
};
