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
import {beat, prog, sec} from '../utils/time';

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
const END = sec(93);

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
const MaisControle: React.FC<{f: number}> = ({f}) => {
  const L = useLayout();
  const s = L.u;
  if (f < CONTROLE - 10 || f > PROD + 14) return null;
  const out = 1 - prog(f, PROD - 6, PROD + 10, EASE.in);
  const W = L.width;
  const H = L.height;
  const n = 36;
  const snap = EASE.dolly(prog(f, CONTROLE + 4, CONTROLE + 50, EASE.linear));
  const guides = EASE.out(prog(f, CONTROLE + 30, CONTROLE + 70, EASE.linear));
  const cols = 6;
  const gx = (i: number) => W / 2 + ((i % cols) - (cols - 1) / 2) * 120 * s;
  const gy = (i: number) => H / 2 + L.safeCenterY + 230 * s + (Math.floor(i / cols) - 2.5) * 80 * s;
  return (
    <AbsoluteFill style={{opacity: out}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {/* precise grid guides */}
        {Array.from({length: cols}, (_, c) => (
          <line key={`v${c}`} x1={gx(c)} x2={gx(c)} y1={gy(0) - 60 * s} y2={gy(0) - 60 * s + (gy(n - 1) - gy(0) + 120 * s) * guides} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
        ))}
        {Array.from({length: 6}, (_, r) => (
          <line key={`h${r}`} y1={gy(r * cols)} y2={gy(r * cols)} x1={gx(0) - 60 * s} x2={gx(0) - 60 * s + (gx(cols - 1) - gx(0) + 120 * s) * guides} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
        ))}
        {/* connections between indicators */}
        {Array.from({length: n - 1}, (_, i) =>
          (i + 1) % cols === 0 ? null : (
            <line key={`c${i}`} x1={gx(i)} y1={gy(i)} x2={gx(i) + (gx(i + 1) - gx(i)) * guides} y2={gy(i + 1)} stroke={COLORS.accent} strokeOpacity={0.55} strokeWidth={2} />
          ),
        )}
        {Array.from({length: n}, (_, i) => {
          const sx = W / 2 + (hash01(i, 1) - 0.5) * W * 1.1;
          const sy = H / 2 + (hash01(i, 2) - 0.5) * H * 0.9;
          const x = sx + (gx(i) - sx) * snap;
          const y = sy + (gy(i) - sy) * snap;
          const on = i % 7 === 3;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={(on ? 11 : 7) * s} fill={on ? COLORS.accent : COLORS.white} opacity={0.4 + 0.6 * snap} />
              {snap > 0.98 && on ? <circle cx={x} cy={y} r={22 * s} fill="none" stroke={COLORS.accent} strokeOpacity={0.6} /> : null}
            </g>
          );
        })}
      </svg>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{position: 'absolute', transform: `translateY(${L.safeCenterY - (L.vertical ? 260 : 200) * s}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <SplitText text="MAIS" size={(L.vertical ? 64 : 60) * s} weight={300} tracking={0.4} state={focusIn(f, CONTROLE, {spread: 0.4})} />
          <SplitText
            text="CONTROLE"
            size={(L.vertical ? 168 : 170) * s}
            weight={700}
            tracking={-0.02}
            state={(i, n) => {
              // glyphs arrive from scattered offsets and lock onto the baseline
              const k = EASE.dolly(prog(f, CONTROLE + 2 + i, CONTROLE + 34 + i, EASE.linear));
              return {x: (hash01(i, 8) - 0.5) * 300 * (1 - k), y: (hash01(i, 9) - 0.5) * 300 * (1 - k), rz: (hash01(i, 10) - 0.5) * 40 * (1 - k), opacity: clamp(k * 3), blur: (1 - k) * 6 + 0 * n};
            }}
          />
          <div style={{width: (L.vertical ? 860 : 1100) * s, height: 2, marginTop: 10 * s, background: COLORS.accent, transform: `scaleX(${guides})`}} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

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
