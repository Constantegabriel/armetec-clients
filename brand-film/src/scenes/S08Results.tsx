import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {camSmooth} from '../animations/camera';
import {combine, dissolveOut, focusIn, riseIn} from '../animations/kinetic';
import {COLORS, FONTS} from '../config/theme';
import {TaskItem} from '../interfaces/WorkItems';
import {Clock3D} from '../three/Clock3D';
import {Stage} from '../three/Stage';
import {SplitText} from '../typography/SplitText';
import {EASE} from '../utils/easing';
import {useLayout} from '../utils/layout';
import {clamp} from '../utils/math';
import {hash01} from '../utils/random';
import {beat, prog, sceneEnd} from '../utils/time';

/**
 * SCENE 08 — the climax. Each benefit has its own visual language:
 * MENOS contracts, CONTROLE aligns, PRODUTIVIDADE rises, and the clock from
 * the opening returns — calm now — for MAIS TEMPO PARA CRESCER.
 */
const MENOS = beat('s08_menos');
const CONTROLE = beat('s08_controle');
const PROD = beat('s08_produtividade');
const TEMPO = beat('s08_tempo');
const CRESCER = beat('s08_crescer');
const END = sceneEnd('s08-resultados');

/* --------------------------------- MENOS ---------------------------------- */
const MenosTarefas: React.FC<{f: number}> = ({f}) => {
  const L = useLayout();
  const s = L.u;
  if (f < MENOS - 20 || f > CONTROLE + 14) return null;
  const cols = L.vertical ? 3 : 5;
  const rows = L.vertical ? 8 : 5;
  const cw = 300;
  const chh = 78;
  const essential = new Set([Math.floor(rows / 2) * cols + Math.floor(cols / 2) - 0, Math.floor(rows / 2 - 1) * cols + Math.floor(cols / 2), Math.floor(rows / 2 + 1) * cols + Math.floor(cols / 2)]);
  const out = 1 - prog(f, CONTROLE - 6, CONTROLE + 10, EASE.in);
  // MENOS: wide tracking collapses (contraction)
  const c = EASE.out(prog(f, MENOS, MENOS + 34, EASE.linear));
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: out}}>
      <div style={{position: 'absolute', display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cw}px)`, gap: 18, transform: `scale(${s * (L.vertical ? 1.05 : 1)})`, opacity: 0.85}}>
        {Array.from({length: cols * rows}, (_, i) => {
          const keep = essential.has(i);
          const kill = MENOS + 6 + hash01(i, 4) * 60;
          const k = keep ? 0 : EASE.in(clamp((f - kill) / 14));
          const centre = keep ? EASE.inOut(prog(f, MENOS + 60, MENOS + 90, EASE.linear)) : 0;
          return (
            <div key={i} style={{height: chh, transform: `scale(${1 - k}) translateY(${0}px)`, opacity: (1 - k) * (keep ? 1 : 0.7), filter: k > 0 ? `blur(${k * 6}px)` : undefined}}>
              <div style={{transform: `scale(${0.7 + centre * 0.12})`, transformOrigin: 'center', width: cw / 0.7, height: chh / 0.7, marginLeft: (cw - cw / 0.7) / 2, marginTop: (chh - chh / 0.7) / 2}}>
                <TaskItem check={keep ? clamp((f - MENOS - 70) / 10) : 0} label={['Validar pedido', 'Faturar', 'Entregar'][[...essential].indexOf(i)] ?? 'Tarefa manual'} meta={keep ? 'essencial' : 'manual'} accent={keep} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', transform: `translateY(${L.safeCenterY - (L.vertical ? 470 : 290) * s}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <SplitText
          text="MENOS"
          family={FONTS.display}
          size={(L.vertical ? 210 : 190) * s}
          weight={800}
          tracking={-0.05}
          state={(i, n) => ({x: (i - (n - 1) / 2) * (1 - c) * 120 * s, sx: 1 + (1 - c) * 0.6, opacity: clamp((f - MENOS) / 6), blur: (1 - c) * 8})}
          prevState={(i, n) => {
            const c1 = EASE.out(prog(f - 1, MENOS, MENOS + 34, EASE.linear));
            return {x: (i - (n - 1) / 2) * (1 - c1) * 120 * s};
          }}
          style={{textShadow: '0 20px 60px rgba(0,0,0,0.8)'}}
        />
        <SplitText text="TAREFAS" size={(L.vertical ? 64 : 60) * s} weight={300} tracking={0.4} state={focusIn(f, MENOS + 14, {spread: 0.5})} />
      </div>
    </AbsoluteFill>
  );
};

/* -------------------------------- CONTROLE -------------------------------- */
/**
 * MAIS CONTROLE — a control panel calibrates itself: a precision dial settles
 * from erratic readings to a locked target, sliders align on one line,
 * switches turn on in sequence. Everything ends perfectly still and aligned.
 */
const MaisControle: React.FC<{f: number}> = ({f}) => {
  const L = useLayout();
  const s = L.u;
  if (f < CONTROLE - 10 || f > PROD + 14) return null;
  const out = 1 - prog(f, PROD - 8, PROD + 10, EASE.in);
  const inA = EASE.out(prog(f, CONTROLE - 6, CONTROLE + 18, EASE.linear));
  const lock = EASE.dolly(prog(f, CONTROLE + 8, CONTROLE + 62, EASE.linear));
  const t = f - CONTROLE;
  // erratic needle → precise target (jitter decays as control is gained)
  const jitter = (1 - lock) * (Math.sin(t * 0.9) * 55 + Math.sin(t * 2.3 + 1) * 30);
  const target = 0.82;
  const val = target * EASE.out(prog(f, CONTROLE, CONTROLE + 50, EASE.linear));
  const R = (L.vertical ? 250 : 210) * s;
  const cx = L.width / 2;
  const cy = L.height / 2 + L.safeCenterY + (L.vertical ? 120 : 80) * s;
  const a0 = -225;
  const sweep = 270;
  const needle = a0 + sweep * val + jitter;
  const polar = (deg: number, r: number) => [cx + Math.cos((deg * Math.PI) / 180) * r, cy + Math.sin((deg * Math.PI) / 180) * r];
  const arc = (from: number, to: number, r: number) => {
    const [x1, y1] = polar(from, r);
    const [x2, y2] = polar(to, r);
    return `M${x1},${y1} A${r},${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2},${y2}`;
  };
  const [nx, ny] = polar(needle, R * 0.78);
  const sliders = [0.3, 0.75, 0.5, 0.62];
  const sw = (L.vertical ? 560 : 460) * s;
  const sy0 = cy + R + (L.vertical ? 110 : 70) * s;
  const pct = Math.round(val * 100 * (0.9 + 0.1 * lock));
  return (
    <AbsoluteFill style={{opacity: out * inA}}>
      <svg width={L.width} height={L.height} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="ctl-glow">
            <feGaussianBlur stdDeviation={6} />
          </filter>
        </defs>
        {/* ticks */}
        {Array.from({length: 55}, (_, i) => {
          const d = a0 + (i / 54) * sweep;
          const major = i % 9 === 0;
          const [x1, y1] = polar(d, R * (major ? 1.06 : 1.03));
          const [x2, y2] = polar(d, R * 1.12);
          const lit = (i / 54) <= val;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={lit ? COLORS.accentSoft : 'rgba(255,255,255,0.22)'} strokeWidth={major ? 3 : 1.5} />;
        })}
        <path d={arc(a0, a0 + sweep, R * 0.92)} stroke="rgba(255,255,255,0.08)" strokeWidth={14 * s} fill="none" strokeLinecap="round" />
        <path d={arc(a0, a0 + sweep * val, R * 0.92)} stroke={COLORS.accent} strokeWidth={14 * s} fill="none" strokeLinecap="round" />
        <path d={arc(a0, a0 + sweep * val, R * 0.92)} stroke={COLORS.accent} strokeWidth={14 * s} fill="none" strokeLinecap="round" filter="url(#ctl-glow)" opacity={0.7} />
        {/* target marker */}
        {(() => {
          const [tx, ty] = polar(a0 + sweep * target, R * 1.2);
          return <circle cx={tx} cy={ty} r={7 * s} fill={lock > 0.95 ? COLORS.accent : 'rgba(255,255,255,0.4)'} />;
        })()}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={COLORS.white} strokeWidth={4 * s} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={12 * s} fill={COLORS.white} />
        <text x={cx} y={cy + R * 0.45} textAnchor="middle" fill={COLORS.white} style={{fontFamily: FONTS.display, fontWeight: 600, fontSize: 64 * s, fontVariantNumeric: 'tabular-nums'}}>
          {pct}%
        </text>
        <text x={cx} y={cy + R * 0.45 + 34 * s} textAnchor="middle" fill={COLORS.gray} style={{fontFamily: FONTS.sans, fontSize: 18 * s, letterSpacing: '0.24em'}}>
          OPERAÇÃO SOB CONTROLE
        </text>
        {/* sliders snap onto one aligned value */}
        {sliders.map((v0, i) => {
          const y = sy0 + i * 46 * s;
          const v1 = lerpN(v0 + Math.sin(t * 0.5 + i) * 0.15 * (1 - lock), target, lock);
          const x0 = cx - sw / 2;
          return (
            <g key={i}>
              <line x1={x0} y1={y} x2={x0 + sw} y2={y} stroke="rgba(255,255,255,0.12)" strokeWidth={6 * s} strokeLinecap="round" />
              <line x1={x0} y1={y} x2={x0 + sw * clamp(v1)} y2={y} stroke={COLORS.accentSoft} strokeWidth={6 * s} strokeLinecap="round" />
              <circle cx={x0 + sw * clamp(v1)} cy={y} r={11 * s} fill={COLORS.white} />
            </g>
          );
        })}
        {/* alignment guide appears when everything locks */}
        <line x1={cx - sw / 2 + sw * target} y1={sy0 - 26 * s} x2={cx - sw / 2 + sw * target} y2={sy0 + 3 * 46 * s + 26 * s} stroke={COLORS.accent} strokeWidth={2} strokeDasharray="6 6" opacity={clamp((lock - 0.8) * 5)} />
      </svg>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{position: 'absolute', transform: `translateY(${cy - L.height / 2 - R - (L.vertical ? 190 : 140) * s}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <SplitText text="MAIS" family={FONTS.sans} size={(L.vertical ? 44 : 40) * s} weight={400} tracking={0.4} color="#D4D4D8" state={focusIn(f, CONTROLE)} />
          <SplitText
            text="CONTROLE"
            size={(L.vertical ? 150 : 150) * s}
            weight={750}
            tracking={-0.04}
            state={(i, n) => {
              // glyphs lock onto the baseline one by one, like calibrated parts
              const k = EASE.dolly(prog(f, CONTROLE + 2 + i * 2.5, CONTROLE + 26 + i * 2.5, EASE.linear));
              return {y: (i % 2 ? -1 : 1) * 60 * (1 - k), opacity: clamp(k * 3), blur: (1 - k) * 6 + 0 * n};
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;

/* ------------------------------ PRODUTIVIDADE ----------------------------- */
const MaisProdutividade: React.FC<{f: number}> = ({f}) => {
  const L = useLayout();
  const s = L.u;
  if (f < PROD - 10 || f > TEMPO + 20) return null;
  const out = 1 - prog(f, TEMPO - 4, TEMPO + 16, EASE.in);
  const bars = L.vertical ? 7 : 11;
  const rise = prog(f, PROD, TEMPO, EASE.linear);
  return (
    <AbsoluteFill style={{opacity: out}}>
      {/* progressive light from below */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 80% ${30 + rise * 40}% at 50% 100%, rgba(81,112,255,${0.15 + rise * 0.3}), transparent 70%)`}} />
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: (L.vertical ? L.safe.bottom + 90 : 90) * s}}>
        <div style={{display: 'flex', alignItems: 'flex-end', gap: 22 * s, height: (L.vertical ? 620 : 420) * s}}>
          {Array.from({length: bars}, (_, i) => {
            const k = EASE.out(prog(f, PROD + 4 + i * 5, PROD + 34 + i * 5, EASE.linear));
            const hgt = (0.3 + (i / (bars - 1)) * 0.7) * k;
            const done = k >= 1;
            return (
              <div key={i} style={{width: (L.vertical ? 76 : 84) * s, height: `${hgt * 100}%`, borderRadius: 14 * s, position: 'relative', background: done ? `linear-gradient(180deg, ${COLORS.accent}, rgba(81,112,255,0.25))` : 'linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.05))', boxShadow: done ? `0 0 40px ${COLORS.accent}55` : undefined}}>
                {done ? (
                  <div style={{position: 'absolute', top: -46 * s, left: '50%', marginLeft: -16 * s, width: 32 * s, height: 32 * s, borderRadius: 32, background: COLORS.white, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <svg width={18 * s} height={18 * s} viewBox="0 0 24 24" fill="none" stroke={COLORS.black} strokeWidth={3}>
                      <path d="M5 12.5l4.2 4.2L19 7" />
                    </svg>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{position: 'absolute', transform: `translateY(${L.safeCenterY - (L.vertical ? 470 : 300) * s - rise * 30}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <SplitText text="MAIS" size={(L.vertical ? 64 : 60) * s} weight={300} tracking={0.4} state={focusIn(f, PROD, {spread: 0.4})} />
          <SplitText
            text="PRODUTIVIDADE"
            size={(L.vertical ? 112 : 150) * s}
            weight={700}
            tracking={-0.02}
            state={(i) => {
              const k = EASE.out(prog(f, PROD + 4 + i * 1.5, PROD + 30 + i * 1.5, EASE.linear));
              return {y: (1 - k) * 140, opacity: clamp(k * 2), blur: (1 - k) * 8, color: k >= 1 && f > PROD + 60 ? COLORS.white : undefined};
            }}
            prevState={(i) => {
              const k = EASE.out(prog(f - 1, PROD + 4 + i * 1.5, PROD + 30 + i * 1.5, EASE.linear));
              return {y: (1 - k) * 140};
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------- MAIS TEMPO PARA CRESCER ------------------------- */
/**
 * The opening timepiece returns — calm, real time, organised. The dial falls
 * into soft focus and shadow while CRESCER rises out of a baseline mask
 * (growth as motion), with a long, slow optical push to hold the moment.
 */
const TempoCrescer: React.FC<{f: number}> = ({f}) => {
  const L = useLayout();
  const s = L.u;
  if (f < TEMPO - 16) return null;
  const k = f - TEMPO;
  const cam = camSmooth(f, [
    {f: TEMPO - 16, pos: [-900, -300, 2600], target: [0, 0, 0], lens: 35, aperture: 0.6},
    {f: END + 40, pos: [380, -140, L.vertical ? 2600 : 2100], target: [0, 40, 0], lens: 35, aperture: 1.4, focus: 900},
  ]);
  const inA = prog(f, TEMPO - 16, TEMPO + 10, EASE.out);
  // calm, real-time clock (no longer accelerated)
  const time = 10 * 3600 + 10 * 60 + 2 + k / 60;
  const rise = EASE.out(prog(f, CRESCER, CRESCER + 50, EASE.linear));
  const pool = prog(f, CRESCER - 30, CRESCER + 10, EASE.out);
  const push = 1 + prog(f, CRESCER, END + 40, EASE.linear) * 0.06;
  const size = (L.vertical ? 220 : 250) * s;
  return (
    <AbsoluteFill style={{opacity: inA}}>
      <Stage cam={cam} background={COLORS.black} fog={{color: COLORS.black, near: 3000, far: 9000}} envIntensity={0.5} dof={{aperture: 0.0016 * (cam.aperture ?? 1), maxBlur: 0.012}}>
        <ambientLight intensity={0.08} />
        <spotLight position={[-6, 6, 7]} angle={0.6} penumbra={1} intensity={60} decay={1.3} castShadow />
        <directionalLight position={[5, 3, 9]} intensity={1.4} />
        <directionalLight position={[-3, 8, -6]} intensity={1.2} color="#c9d2ff" />
        <Clock3D time={time} ticking />
      </Stage>
      {/* the dial recedes into shadow behind the word */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse ${L.vertical ? 95 : 62}% ${L.vertical ? 26 : 38}% at 50% ${50 + ((L.safeCenterY + 40 * s) / L.height) * 100}%, rgba(0,0,0,${0.82 * pool}), rgba(0,0,0,${0.5 * pool}) 55%, transparent 100%)`}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{position: 'absolute', transform: `translateY(${L.safeCenterY - (L.vertical ? 150 : 140) * s}px)`}}>
          <SplitText text="MAIS TEMPO PARA" family={FONTS.sans} size={(L.vertical ? 44 : 42) * s} weight={400} tracking={0.32} color="#D4D4D8" state={combine(riseIn(f, TEMPO, {stagger: 1.4}), dissolveOut(f, END + 30))} />
        </div>
        <div style={{position: 'absolute', transform: `translateY(${L.safeCenterY + 40 * s}px) scale(${push})`}}>
          <div style={{clipPath: 'inset(-0.3em -1em -0.2em -1em)'}}>
            <div
              style={{
                fontFamily: FONTS.display,
                fontWeight: 750,
                fontSize: size,
                letterSpacing: `${-0.045 + 0.015 * (1 - rise)}em`,
                lineHeight: 1,
                color: COLORS.white,
                transform: `translateY(${(1 - rise) * 1.05}em)`,
                opacity: f >= CRESCER ? 1 : 0,
                filter: rise < 0.98 ? `blur(${(1 - rise) * 6}px)` : undefined,
              }}
            >
              CRESCER
            </div>
          </div>
          {/* a single line of brand light grows under the word */}
          <div style={{height: 3 * s, marginTop: 18 * s, background: `linear-gradient(90deg, transparent, ${COLORS.accent}, transparent)`, transform: `scaleX(${EASE.inOut(prog(f, CRESCER + 20, CRESCER + 80, EASE.linear))})`}} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const S08Results: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame() + from;
  return (
    <AbsoluteFill style={{background: COLORS.black}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(37,37,37,0.6), transparent 70%)'}} />
      <MenosTarefas f={f} />
      <MaisControle f={f} />
      <MaisProdutividade f={f} />
      <TempoCrescer f={f} />
    </AbsoluteFill>
  );
};
