import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {camPath, shake, type CamKey} from '../animations/camera';
import {combine, dissolveOut, dropIn, focusIn, riseIn} from '../animations/kinetic';
import {CssWorld} from '../components/CssWorld';
import {LightStreak} from '../components/Light';
import {CAL} from '../config/staging';
import {COLORS, FONTS} from '../config/theme';
import {Clock3D} from '../three/Clock3D';
import {useExtruded, useOutlines} from '../three/ExtrudedText';
import type {TextOutline} from '../three/fontShapes';
import {MAT} from '../three/materials';
import {TimeRings} from '../three/TimeRings';
import {Stage} from '../three/Stage';
import {SplitText} from '../typography/SplitText';
import {TimeDebris} from '../interfaces/TimeDebris';
import {EASE} from '../utils/easing';
import {useLayout} from '../utils/layout';
import {clamp} from '../utils/math';
import {beat, prog, sec} from '../utils/time';

/**
 * SCENES 01 + 02 — one continuous shot.
 * Macro of a dark metal timepiece revealed by a raking line of light; words
 * appear on each tick; "TEMPO?" lands as monumental extruded metal; the camera
 * flies through the counter of the "O", reaches the dial and pulls back while
 * time accelerates and the space fills with calendars, hours and timelines.
 */

const CLOCK_T0 = 10 * 3600 + 8 * 60 + 27; // 10:08:27 — classic watch pose

export const clockTime = (f: number) => {
  const base = CLOCK_T0 + f / 60;
  const a = beat('s02_accelerate');
  if (f <= a) return base;
  const k = (f - a) / (sec(12) - a);
  return base + 3600 * 9 * Math.pow(k, 2.6); // ~9h of spin by the end of scene 2
};

const TEMPO_SIZE = 200;
const TEMPO_Z = 1000;

/** Camera choreography (CSS px, clock at origin, dial radius 400). */
const useCamera = (f: number, vertical: boolean) => {
  const back = vertical ? 3500 : 2600;
  const focusT = back - TEMPO_Z;
  const keys: CamKey[] = [
    // macro: grazing over the dial at the 2–3 o'clock indices (100mm)
    // low, grazing macro from the lower right: bezel and rehaut in the foreground, star bridge beyond
    {f: 0, pos: vertical ? [560, 470, 300] : [640, 420, 280], target: [-40, -60, 0], lens: 50, aperture: 2.6, focus: 640},
    {f: beat('s01_wDoSeu'), pos: vertical ? [470, 520, 380] : [560, 470, 360], target: [-90, -40, 0], lens: 45, aperture: 2.2, focus: 700, ease: EASE.inOut},
    // pull-back reveal for TEMPO
    {f: beat('s01_wTempo') + 8, pos: [-420, 120, back + 500], target: [0, 0, 0], lens: 50, focus: focusT + 500, aperture: 0.5, ease: EASE.dolly},
    {f: beat('s01_flyThrough'), pos: [-160, 40, back], target: [0, 0, 0], lens: 50, focus: focusT, aperture: 0.5, ease: EASE.inOut},
  ];
  return keys;
};

export const S01S02Time: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame() + from;
  const L = useLayout();
  // all glyph outlines are resolved before the WebGL stage mounts
  const outlines = useOutlines(['TEMPO', '?', 'T', 'E', 'M', 'P', 'O'], TEMPO_SIZE);
  const tempoOutline = outlines?.[0] ?? null;

  // O counter centre (fly-through target)
  const oBox = tempoOutline?.glyphs[4];
  const oX = oBox ? (oBox.x1 + oBox.x2) / 2 : 300;
  const oY = oBox ? (oBox.y1 + oBox.y2) / 2 : 0;

  const keys = useCamera(f, L.vertical);
  const fly = beat('s01_flyThrough');
  const acc = beat('s02_accelerate');
  const end = sec(12);
  const back = keys[3].pos[2];
  keys.push(
    // push through the counter of the "O"
    {f: fly + 40, pos: [oX, oY, TEMPO_Z - 120], target: [oX * 0.6, oY, 0], lens: 35, aperture: 0.6, ease: EASE.in},
    // arrive at the dial centre (match on the cap)
    {f: acc + 6, pos: [40, 0, 520], target: [0, 0, 0], lens: 35, aperture: 1.2, ease: EASE.out},
    // continuous pull-back reveal while time accelerates
    {f: end - 50, pos: [-220, 260, 5200], target: [0, 120, 0], lens: 35, roll: -4, aperture: 0.8, ease: EASE.inOut},
    // whip into the calendar that becomes the spreadsheet (scene 3 match cut)
    {f: end, pos: [CAL.x, CAL.y, CAL.z + 760], target: [CAL.x, CAL.y, CAL.z], lens: 35, aperture: 0.5, ease: EASE.in},
  );
  void back;
  const cam = camPath(f, keys, 3);
  const sk = shake(f, beat('s02_wPerde'), 10, 16);
  cam.x += sk.x;
  cam.y += sk.y;
  cam.roll = (cam.roll ?? 0) + sk.r;

  // Light: raking key reveal + global level
  const reveal = prog(f, beat('s01_lightReveal'), beat('s01_lightReveal') + 70, EASE.out);
  const keyX = -9 + reveal * 14;
  const fillLevel = 0.05 + prog(f, beat('s01_wTempo') - 10, beat('s01_wTempo') + 30) * 0.5;

  // TEMPO lifecycle
  const tempoIn = prog(f, beat('s01_wTempo'), beat('s01_wTempo') + 26, EASE.out);
  const tempoBreak = prog(f, fly + 34, fly + 90, EASE.in);

  if (!outlines) return null;
  return (
    <AbsoluteFill style={{background: COLORS.black}}>
      <Stage
        cam={cam}
        background={COLORS.black}
        fog={{color: COLORS.black, near: 2500, far: 9000}}
        envIntensity={0.06 + fillLevel * 0.45}
        exposure={1.05}
        dof={{aperture: 0.0035 * (cam.aperture ?? 1), maxBlur: 0.014}}
      >
        <ambientLight intensity={0.04} />
        {/* raking key — the line of light that discovers the dial */}
        <spotLight
          position={[keyX, 3.2, 2.6]}
          angle={0.42}
          penumbra={0.9}
          intensity={reveal * 90}
          decay={1.4}
          distance={0}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0004}
        />
        {/* cool rim from behind-top */}
        <directionalLight position={[-4, 8, -6]} intensity={0.6 + fillLevel * 2} color="#c9d2ff" />
        {/* soft front key for typography */}
        <directionalLight position={[3, 4, 12]} intensity={fillLevel * 2.4} />
        <Clock3D time={clockTime(f)} ticking={f < acc} />
        <TimeRings f={f} start={acc} />
        <TempoWord f={f} outlines={outlines} appear={tempoIn} breakT={tempoBreak} />
      </Stage>

      {/* DOM layer in the same camera space: words of scene 1 + time debris of scene 2 */}
      <CssWorld cam={cam}>
        <TimeDebris f={f} start={acc - 10} end={end} />
      </CssWorld>
      <MacroWords f={f} />

      {/* the first line of light */}
      <LightStreak
        progress={prog(f, beat('s01_lightReveal') - 6, beat('s01_lightReveal') + 60, EASE.out)}
        fade={1 - prog(f, beat('s01_lightReveal') + 40, beat('s01_lightReveal') + 110)}
        y={L.vertical ? -60 : -30}
      />

      <Scene02Type f={f} />
    </AbsoluteFill>
  );
};


const TempoWord: React.FC<{
  f: number;
  outlines: TextOutline[];
  appear: number;
  breakT: number;
}> = ({f, outlines, appear, breakT}) => {
  const L = useLayout();
  const scale = 1;
  void L;
  const [word, q, ...chars] = outlines;
  // per-letter meshes (positioned from the kerned word layout) so it can break apart
  return (
    <group position={[0, 0, TEMPO_Z / 100]} scale={scale}>
      {word.glyphs.map((g, i) => (
        <TempoLetter key={i} outline={chars[i]} cx={(g.x1 + g.x2) / 2} cy={(g.y1 + g.y2) / 2} i={i} f={f} appear={appear} breakT={breakT} />
      ))}
      <TempoLetter
        outline={q}
        cx={word.width / 2 + 40 + q.width / 2}
        cy={word.height / 2 - q.height / 2}
        i={5}
        f={f}
        appear={appear}
        breakT={breakT}
        accent
      />
    </group>
  );
};

const TempoLetter: React.FC<{outline: TextOutline; cx: number; cy: number; i: number; f: number; appear: number; breakT: number; accent?: boolean}> = ({
  outline,
  cx,
  cy,
  i,
  f,
  appear,
  breakT,
  accent,
}) => {
  const geo = useExtruded(outline, {depth: 120, bevel: 6, bevelSegments: 4});
  const mats = useMemo<[THREE.Material, THREE.Material]>(
    () => (accent ? [MAT.accent(), MAT.sideMetal()] : [MAT.satinWhite(), MAT.blackMetal()]),
    [accent],
  );
  if (!geo || appear <= 0) return null;
  // staggered arrival from depth, then radial break-away after the camera passes
  const a = clamp(appear * 1.4 - i * 0.08);
  const zIn = (1 - EASE.out(a)) * -900;
  const dir = Math.sign(cx || 1);
  const bx = breakT * dir * (500 + i * 60);
  const by = breakT * (i % 2 === 0 ? -1 : 1) * 260;
  const bz = breakT * 600;
  void f;
  return (
    <mesh
      geometry={geo}
      material={mats}
      position={[(cx + bx) / 100, -(cy + by) / 100, (zIn + bz) / 100]}
      rotation={[breakT * 0.6 * dir, breakT * 0.9 * dir, 0]}
      scale={0.6 + 0.4 * EASE.out(a)}
      castShadow
    />
  );
};

/**
 * Scene 1 words — appear on each tick in layered depth. The newest word is in
 * focus; previous ones fall back (rack focus) and drift with the camera move.
 */
const MacroWords: React.FC<{f: number}> = ({f}) => {
  const L = useLayout();
  const s = L.u;
  const words: Array<{t: number; text: string; size: number; weight: number; x: number}> = [
    {t: beat('s01_wQuantoVale'), text: 'QUANTO VALE', size: 64, weight: 300, x: -30},
    {t: beat('s01_wUmaHora'), text: 'UMA HORA', size: 118, weight: 700, x: 10},
    {t: beat('s01_wDoSeu'), text: 'DO SEU', size: 64, weight: 300, x: 40},
  ];
  const exitAt = beat('s01_wTempo') - 32;
  if (f < words[0].t - 2 || f > exitAt + 40) return null;
  const drift = (f - words[0].t) * 0.35;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', perspective: 1200}}>
      <div style={{transform: `translateY(${L.safeCenterY - 40 * s}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 * s}}>
        {words.map((w, idx) => {
          // rack focus: once the next word lands, this one recedes
          const next = words[idx + 1]?.t ?? exitAt + 999;
          const recede = prog(f, next, next + 18, EASE.out);
          const st = combine(focusIn(f, w.t, {dur: 26, spread: 0.18, z: -500}), dissolveOut(f, exitAt + idx * 3, {stagger: 0.7, dur: 16}));
          const prev = combine(focusIn(f - 1, w.t, {dur: 26, spread: 0.18, z: -500}), dissolveOut(f - 1, exitAt + idx * 3, {stagger: 0.7, dur: 16}));
          return (
            <div
              key={idx}
              style={{
                transform: `translate3d(${(w.x - drift * (1 + idx * 0.5)) * s}px, 0, ${-recede * 160}px)`,
                filter: recede > 0.02 ? `blur(${recede * 3.5}px)` : undefined,
                opacity: 1 - recede * 0.45,
              }}
            >
              <SplitText
                text={w.text}
                state={st}
                prevState={prev}
                size={w.size * s}
                weight={w.weight}
                tracking={idx === 1 ? 0.01 : 0.2}
                style={{textShadow: '0 0 40px rgba(0,0,0,0.8)'}}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Scene 2 kinetic headline — screen-space, stacked, inside the safe area. */
const Scene02Type: React.FC<{f: number}> = ({f}) => {
  const L = useLayout();
  const v = L.vertical;
  const out = sec(10.95);
  const exit = (d = 0) => dissolveOut(f, out + d, {stagger: 0.8, dur: 18});
  const exitP = (d = 0) => dissolveOut(f - 1, out + d, {stagger: 0.8, dur: 18});
  if (f < beat('s02_wQuantasHoras') - 30 || f > out + 50) return null;
  const s = L.u;
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const mT = beat('s02_wTodosOsMeses');
  const eyebrow = prog(f, sec(6.5), sec(7.0), EASE.out) * (1 - prog(f, out, out + 16));
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{transform: `translateY(${L.safeCenterY - (v ? 40 : 10)}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: (v ? 6 : 0) * s}}>
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 26 * s,
            letterSpacing: `${0.42 - eyebrow * 0.12}em`,
            color: COLORS.gray,
            opacity: eyebrow,
            marginBottom: 18 * s,
            fontWeight: 500,
          }}
        >
          AGORA IMAGINE
        </div>
        <SplitText
          text="QUANTAS HORAS"
          size={(v ? 104 : 96) * s}
          weight={300}
          tracking={0.02}
          state={combine(focusIn(f, beat('s02_wQuantasHoras'), {spread: 0.35}), exit(0))}
          prevState={combine(focusIn(f - 1, beat('s02_wQuantasHoras'), {spread: 0.35}), exitP(0))}
        />
        <div style={{display: 'flex', gap: 22 * s, alignItems: 'baseline'}}>
          <SplitText
            text="SUA"
            size={(v ? 104 : 96) * s}
            weight={300}
            state={combine(riseIn(f, beat('s02_wEmpresa') - 8), exit(2))}
          />
          <SplitText
            text="EMPRESA"
            size={(v ? 104 : 96) * s}
            weight={700}
            state={combine(riseIn(f, beat('s02_wEmpresa')), exit(3))}
            prevState={combine(riseIn(f - 1, beat('s02_wEmpresa')), exitP(3))}
          />
        </div>
        <SplitText
          text="PERDE"
          family={FONTS.sans}
          size={(v ? 270 : 230) * s}
          weight={900}
          tracking={-0.04}
          state={combine(dropIn(f, beat('s02_wPerde'), {stagger: 2.5, height: 320}), (i) => {
            // the word keeps sinking: weight of lost time
            const sink = prog(f, beat('s02_wPerde') + 30, out, EASE.in);
            return {y: sink * (12 + i * 7), rz: sink * (i - 2) * 1.2};
          })}
          prevState={combine(dropIn(f - 1, beat('s02_wPerde'), {stagger: 2.5, height: 320}), () => ({}))}
          style={{margin: `${-14 * s}px 0`, opacity: 1 - prog(f, out + 4, out + 22)}}
        />
        <SplitText
          text="TODOS OS MESES"
          size={(v ? 78 : 70) * s}
          weight={500}
          tracking={0.06}
          state={combine(riseIn(f, mT, {stagger: 1.4}), exit(6))}
          prevState={combine(riseIn(f - 1, mT, {stagger: 1.4}), exitP(6))}
        />
        <div style={{display: 'flex', gap: 14 * s, marginTop: 26 * s}}>
          {months.map((m, i) => {
            const on = prog(f, mT + 10 + i * 4, mT + 18 + i * 4, EASE.out);
            const off = prog(f, out + i, out + 12 + i);
            return (
              <div
                key={m}
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 17 * s,
                  letterSpacing: '0.12em',
                  color: i === 11 ? COLORS.white : COLORS.gray,
                  opacity: on * (1 - off),
                  transform: `translateY(${(1 - on) * 12}px)`,
                  borderTop: `2px solid ${i === 11 ? COLORS.accent : 'rgba(245,245,245,0.25)'}`,
                  paddingTop: 8 * s,
                  width: (v ? 58 : 64) * s,
                  textAlign: 'center',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {m}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
