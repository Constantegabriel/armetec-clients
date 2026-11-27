import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {camSmooth, shake, type SmoothKey} from '../animations/camera';
import {combine, dissolveOut, dropIn, focusIn, riseIn} from '../animations/kinetic';
import {CssWorld} from '../components/CssWorld';
import {LightStreak} from '../components/Light';
import {CAL} from '../config/staging';
import {COLORS, FONTS} from '../config/theme';
import {Clock3D} from '../three/Clock3D';
import {TimeRings} from '../three/TimeRings';
import {Stage} from '../three/Stage';
import {SplitText} from '../typography/SplitText';
import {TimeDebris} from '../interfaces/TimeDebris';
import {EASE} from '../utils/easing';
import {useLayout} from '../utils/layout';
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

/** Camera choreography (CSS px, clock at origin, dial radius 400). Velocity-continuous rig. */
const useCamera = (vertical: boolean): SmoothKey[] => {
  const back = vertical ? 3000 : 2350;
  const acc = beat('s02_accelerate');
  const zoom = beat('s02_calZoom');
  const end = sec(12);
  return [
    // low, grazing macro from the lower right: bezel and rehaut in the foreground, star bridge beyond
    {f: 0, pos: vertical ? [560, 470, 300] : [640, 420, 280], target: [-40, -60, 0], lens: 50, aperture: 2.6, focus: 640},
    {f: beat('s01_wDoSeu'), pos: vertical ? [480, 500, 360] : [560, 460, 340], target: [-80, -50, 0], lens: 46, aperture: 2.2, focus: 690},
    // rise and pull back to a frontal, centred dial for TEMPO
    {f: beat('s01_wTempo') + 30, pos: [-60, 30, back], target: [0, 0, 0], lens: 50, aperture: 0.6},
    {f: beat('s01_flyThrough'), pos: [-20, 10, back - 260], target: [0, 0, 0], lens: 50, aperture: 0.6},
    // through the counter of the O, onto the dial centre
    {f: acc + 6, pos: [30, 0, 520], target: [0, 0, 0], lens: 35, aperture: 1.2},
    // continuous pull-back while time accelerates; settles to rest
    {f: zoom, pos: [-240, 220, 5000], target: [-80, 40, 0], lens: 35, roll: -3, aperture: 0.8, stop: true},
    // smooth crane-in towards the calendar: accelerate, glide, decelerate into it
    {f: zoom + 52, pos: [-430, -150, 3900], target: [CAL.x, CAL.y, CAL.z], lens: 35, roll: -1, aperture: 0.7},
    {f: end, pos: [CAL.x, CAL.y, CAL.z + 520], target: [CAL.x, CAL.y, CAL.z], lens: 35, roll: 0, aperture: 0.5, stop: true},
  ];
};

export const S01S02Time: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame() + from;
  const L = useLayout();
  const acc = beat('s02_accelerate');
  const end = sec(12);
  const cam = camSmooth(f, useCamera(L.vertical), 3);
  const sk = shake(f, beat('s02_wPerde'), 10, 16);
  cam.x += sk.x;
  cam.y += sk.y;
  cam.roll = (cam.roll ?? 0) + sk.r;

  // Light: raking key reveal + global level
  const reveal = prog(f, beat('s01_lightReveal'), beat('s01_lightReveal') + 70, EASE.out);
  const keyX = -9 + reveal * 14;
  const fillLevel = 0.05 + prog(f, beat('s01_wTempo') - 10, beat('s01_wTempo') + 30) * 0.5;

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
      </Stage>

      {/* DOM layer in the same camera space: words of scene 1 + time debris of scene 2 */}
      <CssWorld cam={cam}>
        <TimeDebris f={f} start={acc - 10} end={end} />
      </CssWorld>
      <MacroWords f={f} />
      <TempoTitle f={f} />

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

/**
 * "TEMPO?" — the central concept. No extrusion: a heavy, tightly-spaced Geist
 * word revealed by a sweeping hand of light (a conic mask turning 360° from the
 * dial centre, like a seconds hand drawing the word into existence). It then
 * settles with a slow optical push; the "?" lands on the next tick in brand
 * blue. Finally the camera dives through the counter of the "O".
 */
const TempoTitle: React.FC<{f: number}> = ({f}) => {
  const L = useLayout();
  const T = beat('s01_wTempo');
  const F = beat('s01_flyThrough');
  const size = (L.vertical ? 236 : 250) * L.u;
  const tracking = -0.045 + 0.02 * (1 - EASE.out(prog(f, T, T + 150, EASE.linear)));
  const qGap = 0.06 * size;
  // measure glyph advances to find the counter of the O (fly-through origin)
  const m = useMemo(() => {
    const c = document.createElement('canvas').getContext('2d')!;
    c.font = `800 ${size}px "Geist Variable"`;
    (c as unknown as {letterSpacing: string}).letterSpacing = `${tracking * size}px`;
    const temp = c.measureText('TEMP').width;
    const o = c.measureText('O').width;
    const word = c.measureText('TEMPO').width;
    const q = c.measureText('?').width;
    return {temp, o, word, q};
  }, [size, tracking]);
  if (f < T - 2 || f > F + 50) return null;
  const total = m.word + qGap + m.q;
  const oX = -total / 2 + m.temp + m.o / 2;
  const sweep = EASE.inOut(prog(f, T, T + 54, EASE.linear));
  const angle = sweep * 360;
  const settle = 1.05 - 0.05 * EASE.out(prog(f, T, T + 160, EASE.linear));
  const qIn = EASE.out(prog(f, T + 54, T + 84, EASE.linear));
  const dive = EASE.in(prog(f, F, F + 46, EASE.linear));
  const scale = settle * (1 + dive * 46);
  const fade = 1 - prog(f, F + 26, F + 46, EASE.linear);
  const mask = sweep >= 1 ? undefined : `conic-gradient(from 0deg at 50% 50%, #000 0deg, #000 ${angle}deg, transparent ${angle + 0.5}deg)`;
  const handOpacity = Math.sin(Math.min(1, sweep) * Math.PI) * (sweep < 1 ? 1 : 0);
  const scrim = prog(f, T - 10, T + 30, EASE.out) * fade;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* localized darkening: the dial recedes behind the word */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 26% at 50% 50%, rgba(0,0,0,${0.72 * scrim}), rgba(0,0,0,${0.35 * scrim}) 55%, transparent 80%)`}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            fontFamily: FONTS.display,
            fontWeight: 800,
            fontSize: size,
            lineHeight: 1,
            letterSpacing: `${tracking}em`,
            color: COLORS.white,
            transform: `scale(${scale})`,
            transformOrigin: `calc(50% + ${oX}px) 50%`,
            opacity: fade,
            filter: dive > 0.02 ? `blur(${Math.min(18, dive * 26)}px)` : undefined,
            maskImage: mask,
            WebkitMaskImage: mask,
            textShadow: '0 18px 60px rgba(0,0,0,0.55)',
          }}
        >
          <span>TEMPO</span>
          <span
            style={{
              marginLeft: qGap,
              color: COLORS.accent,
              display: 'inline-block',
              clipPath: 'inset(-0.2em -0.2em -0.15em -0.2em)',
            }}
          >
            <span style={{display: 'inline-block', transform: `translateY(${(1 - qIn) * 1.05}em)`, opacity: qIn}}>?</span>
          </span>
        </div>
      </AbsoluteFill>
      {/* the hand of light that draws the word */}
      {handOpacity > 0.01 ? (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', mixBlendMode: 'screen'}}>
          <div style={{position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, transform: `rotate(${angle}deg)`}}>
            <div style={{position: 'absolute', left: -1.5, bottom: 0, width: 3, height: Math.hypot(L.width, L.height) / 2, background: `linear-gradient(0deg, ${COLORS.accent}00, ${COLORS.accentSoft} 30%, #ffffff)`, opacity: handOpacity, boxShadow: `0 0 24px ${COLORS.accent}`}} />
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
