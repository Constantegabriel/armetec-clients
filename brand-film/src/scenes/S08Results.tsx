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
 * MAIS CONTROLE — a control wheel spins up and locks at 100% while the
 * operation's facts confirm one by one below it; the camera then dives into
 * the wheel and the next take is born from its light.
 */
const CTRL_ROWS = [
  {k: 'Estoque sincronizado', v: '9.730 itens'},
  {k: 'Financeiro conciliado', v: 'R$ 86,4 mil'},
  {k: 'Pedidos rastreados', v: '48 de 48'},
  {k: 'Tarefas da equipe em dia', v: '312 concluídas'},
];

const MaisControle: React.FC<{f: number}> = ({f}) => {
  const L = useLayout();
  const s = L.u;
  if (f < CONTROLE - 10 || f > PROD + 6) return null;
  const inA = EASE.out(prog(f, CONTROLE - 6, CONTROLE + 16, EASE.linear));
  const t = f - CONTROLE;
  const spin = EASE.out(prog(f, CONTROLE, CONTROLE + 66, EASE.linear)); // 0 → 100 %
  const locked = spin >= 0.999;
  const lockFlash = f >= CONTROLE + 66 ? Math.exp(-(f - CONTROLE - 66) / 8) : 0;
  // dive into the wheel → next take
  const dive = EASE.in(prog(f, PROD - 24, PROD + 4, EASE.linear));
  const R = (L.vertical ? 230 : 190) * s;
  const cx = L.width / 2;
  const cy = L.height / 2 + L.safeCenterY - (L.vertical ? 10 : 30) * s;
  const a0 = -225;
  const sweep = 270;
  const wheelRot = (1 - spin) * -540; // the whole wheel turns and settles
  const polar = (deg: number, r: number) => [cx + Math.cos((deg * Math.PI) / 180) * r, cy + Math.sin((deg * Math.PI) / 180) * r];
  const arc = (from: number, to: number, r: number) => {
    const [x1, y1] = polar(from, r);
    const [x2, y2] = polar(to, r);
    return `M${x1},${y1} A${r},${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2},${y2}`;
  };
  const pct = Math.round(spin * 100);
  const rowsTop = cy + R * 1.28;
  return (
    <AbsoluteFill style={{opacity: inA * (1 - prog(f, PROD - 4, PROD + 6, EASE.linear)), transform: `scale(${1 + dive * 6})`, transformOrigin: `${cx}px ${cy}px`, filter: dive > 0.02 ? `blur(${dive * 14}px)` : undefined}}>
      <svg width={L.width} height={L.height} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="ctl-glow">
            <feGaussianBlur stdDeviation={7} />
          </filter>
          <radialGradient id="ctl-core">
            <stop offset="0" stopColor="rgba(81,112,255,0.35)" />
            <stop offset="1" stopColor="rgba(81,112,255,0)" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={R * 1.5} fill="url(#ctl-core)" opacity={0.5 + lockFlash} />
        {/* the wheel: ticks rotate with it */}
        <g transform={`rotate(${wheelRot} ${cx} ${cy})`}>
          {Array.from({length: 72}, (_, i) => {
            const d = (i / 72) * 360;
            const major = i % 6 === 0;
            const [x1, y1] = polar(d, R * (major ? 1.1 : 1.13));
            const [x2, y2] = polar(d, R * 1.19);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={major ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.2)'} strokeWidth={major ? 3 : 1.5} />;
          })}
        </g>
        <path d={arc(a0, a0 + sweep, R * 0.95)} stroke="rgba(255,255,255,0.07)" strokeWidth={18 * s} fill="none" strokeLinecap="round" />
        <path d={arc(a0, a0 + sweep * Math.max(0.001, spin), R * 0.95)} stroke={COLORS.accent} strokeWidth={18 * s} fill="none" strokeLinecap="round" />
        <path d={arc(a0, a0 + sweep * Math.max(0.001, spin), R * 0.95)} stroke={COLORS.accentSoft} strokeWidth={18 * s} fill="none" strokeLinecap="round" filter="url(#ctl-glow)" opacity={0.6 + lockFlash} />
        {/* inner precision ring counter-rotates */}
        <g transform={`rotate(${-wheelRot * 0.5} ${cx} ${cy})`}>
          <circle cx={cx} cy={cy} r={R * 0.72} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} strokeDasharray="2 10" />
        </g>
        <text x={cx} y={cy + 26 * s} textAnchor="middle" fill={COLORS.white} style={{fontFamily: FONTS.display, fontWeight: 650, fontSize: 92 * s, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums'}}>
          {pct}%
        </text>
        <text x={cx} y={cy + 66 * s} textAnchor="middle" fill={locked ? COLORS.accentSoft : COLORS.gray} style={{fontFamily: FONTS.sans, fontSize: 17 * s, letterSpacing: '0.26em'}}>
          {locked ? 'TUDO SOB CONTROLE' : 'SINCRONIZANDO'}
        </text>
      </svg>
      {/* the facts under control */}
      <div style={{position: 'absolute', left: cx - (L.vertical ? 380 : 330) * s, top: rowsTop, width: (L.vertical ? 760 : 660) * s, display: 'flex', flexDirection: 'column', gap: 10 * s}}>
        {CTRL_ROWS.map((r, i) => {
          const a = EASE.out(prog(f, CONTROLE + 16 + i * 11, CONTROLE + 34 + i * 11, EASE.linear));
          const ok = f >= CONTROLE + 30 + i * 11;
          return (
            <div key={r.k} style={{display: 'flex', alignItems: 'center', gap: 16 * s, padding: `${12 * s}px ${18 * s}px`, borderRadius: 14 * s, background: 'rgba(255,255,255,0.04)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.07)', opacity: a, transform: `translateY(${(1 - a) * 16}px)`}}>
              <div style={{width: 30 * s, height: 30 * s, borderRadius: 30, background: ok ? COLORS.success : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {ok ? (
                  <svg width={18 * s} height={18 * s} viewBox="0 0 24 24" fill="none" stroke="#0b0b0c" strokeWidth={3}>
                    <path d="M5 12.5l4.2 4.2L19 7" />
                  </svg>
                ) : null}
              </div>
              <div style={{flex: 1, fontFamily: FONTS.sans, fontSize: 24 * s, color: '#E4E4E7'}}>{r.k}</div>
              <div style={{fontFamily: FONTS.sans, fontSize: 24 * s, color: COLORS.white, fontWeight: 600, fontVariantNumeric: 'tabular-nums'}}>{r.v}</div>
            </div>
          );
        })}
      </div>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{position: 'absolute', transform: `translateY(${cy - L.height / 2 - R * 1.25 - (L.vertical ? 150 : 110) * s}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <SplitText text="MAIS" family={FONTS.sans} size={(L.vertical ? 44 : 40) * s} weight={400} tracking={0.4} color="#D4D4D8" state={focusIn(f, CONTROLE)} />
          <SplitText
            text="CONTROLE"
            size={150 * s}
            weight={750}
            tracking={-0.04}
            state={(i) => {
              const k = EASE.dolly(prog(f, CONTROLE + 2 + i * 2.5, CONTROLE + 26 + i * 2.5, EASE.linear));
              return {y: (i % 2 ? -1 : 1) * 60 * (1 - k), opacity: clamp(k * 3), blur: (1 - k) * 6};
            }}
          />
        </div>
      </AbsoluteFill>
      {void t}
    </AbsoluteFill>
  );
};

/* ------------------------------ PRODUTIVIDADE ----------------------------- */
const MaisProdutividade: React.FC<{f: number}> = ({f}) => {
  const L = useLayout();
  const s = L.u;
  if (f < PROD - 10 || f > TEMPO + 20) return null;
  // enter: born from the wheel's light (blue bloom → the bars rise into place)
  const enter = EASE.out(prog(f, PROD - 6, PROD + 26, EASE.linear));
  // exit: crane up — the whole take rises out of frame while the clock rises in
  const leave = EASE.inOut(prog(f, TEMPO - 22, TEMPO + 14, EASE.linear));
  const out = 1;
  const bars = L.vertical ? 7 : 11;
  const rise = prog(f, PROD, TEMPO, EASE.linear);
  return (
    <AbsoluteFill style={{opacity: out * clamp(enter * 1.5), transform: `translateY(${(1 - enter) * 18 - leave * 105}%)`, filter: leave > 0.03 && leave < 0.97 ? `blur(${Math.sin(leave * Math.PI) * 10}px)` : undefined}}>
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, rgba(81,112,255,${0.55 * (1 - enter)}), transparent 60%)`}} />
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
    {f: END - 34, pos: [300, -110, L.vertical ? 2700 : 2200], target: [0, 40, 0], lens: 35, aperture: 1.4, focus: 900},
    {f: END + 20, pos: [0, 0, 260], target: [0, 0, 0], lens: 35, aperture: 2, focus: 260},
  ]);
  const inA = 1;
  const riseUp = EASE.inOut(prog(f, TEMPO - 22, TEMPO + 14, EASE.linear));
  // final dive into the centre of the dial: the brand is born from it (scene 09)
  const dive = EASE.in(prog(f, END - 34, END + 20, EASE.linear));
  // calm, real-time clock (no longer accelerated)
  const time = 10 * 3600 + 10 * 60 + 2 + k / 60;
  const rise = EASE.out(prog(f, CRESCER, CRESCER + 50, EASE.linear));
  const pool = prog(f, CRESCER - 30, CRESCER + 10, EASE.out);
  const push = 1 + prog(f, CRESCER, END + 40, EASE.linear) * 0.06;
  const size = (L.vertical ? 220 : 250) * s;
  return (
    <AbsoluteFill style={{opacity: inA, transform: `translateY(${(1 - riseUp) * 100}%)`}}>
      <Stage cam={cam} background={COLORS.black} fog={{color: COLORS.black, near: 3000, far: 9000}} envIntensity={0.5} dof={{aperture: 0.0016 * (cam.aperture ?? 1), maxBlur: 0.012}}>
        <ambientLight intensity={0.08} />
        <spotLight position={[-6, 6, 7]} angle={0.6} penumbra={1} intensity={60} decay={1.3} castShadow />
        <directionalLight position={[5, 3, 9]} intensity={1.4} />
        <directionalLight position={[-3, 8, -6]} intensity={1.2} color="#c9d2ff" />
        <Clock3D time={time} ticking />
      </Stage>
      {/* the dial recedes into shadow behind the word */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse ${L.vertical ? 95 : 62}% ${L.vertical ? 26 : 38}% at 50% ${50 + ((L.safeCenterY + 40 * s) / L.height) * 100}%, rgba(0,0,0,${0.82 * pool}), rgba(0,0,0,${0.5 * pool}) 55%, transparent 100%)`}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: 1 - dive, transform: `scale(${1 + dive * 1.6})`, filter: dive > 0.02 ? `blur(${dive * 10}px)` : undefined}}>
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
      <AbsoluteFill style={{background: '#000', opacity: EASE.inOut(prog(f, END - 4, END + 18, EASE.linear))}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', pointerEvents: 'none'}}>
        <div style={{width: 14, height: 14, borderRadius: 14, background: '#fff', boxShadow: `0 0 30px 10px ${COLORS.accent}`, opacity: prog(f, END - 8, END + 10, EASE.out)}} />
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
