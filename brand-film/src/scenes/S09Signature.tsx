import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {riseIn} from '../animations/kinetic';
import {LightStreak} from '../components/Light';
import {SYMBOL_PATH, WORDMARK_ARME_PATH, WORDMARK_TEC_PATH} from '../config/brand-paths.generated';
import {BRAND} from '../config/brand';
import {COLORS, FONTS} from '../config/theme';
import {SplitText} from '../typography/SplitText';
import {EASE} from '../utils/easing';
import {useLayout} from '../utils/layout';
import {hash01} from '../utils/random';
import {clamp} from '../utils/math';
import {beat, prog, sceneEnd} from '../utils/time';

/**
 * SCENE 09 — the logo is *constructed*.
 *  1. a line of light crosses the frame; geometric construction guides draw
 *     across the whole frame (they fill the safe margins without carrying info);
 *  2. the three orbits of the official symbol are traced in light, one by one;
 *  3. each orbit rotates into its exact position and fills, locking with a flash;
 *  4. the wordmark is unmasked letter-group by letter-group; the slogan settles;
 *  5. hold for recall, then absolute black.
 * Paths are vectorised from the official logo files (public/brand).
 */
const FADE = beat('s09_fade');
const LINE = beat('s09_lightLine');
const LOGO = beat('s09_logo');
const SLOGAN = beat('s09_slogan');
const BLACK = beat('s09_black');
const END = sceneEnd('s09-assinatura');

const PIECES = SYMBOL_PATH.d.split(/(?=M )/).map((d) => d.trim());
const SW = SYMBOL_PATH.width;
const SH = SYMBOL_PATH.height;

/** Full-bleed construction geometry (circle, axes, 120° rays) — atmosphere, not information. */
const Guides: React.FC<{k: number; fade: number; size: number; cy: number}> = ({k, fade, size, cy}) => {
  const L = useLayout();
  const W = L.width;
  const H = L.height;
  const cx = W / 2;
  const y0 = H / 2 + cy;
  const r = size * 0.56;
  const diag = Math.hypot(W, H);
  const rays = [90, 210, 330, 30, 150, 270];
  const line = (x1: number, y1: number, x2: number, y2: number, t: number, key: string, o = 0.18) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    return <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeOpacity={o * fade} strokeWidth={1} strokeDasharray={len} strokeDashoffset={len * (1 - t)} />;
  };
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      {line(0, y0, W, y0, EASE.inOut(clamp(k * 1.6)), 'h', 0.14)}
      {line(cx, 0, cx, H, EASE.inOut(clamp(k * 1.6 - 0.15)), 'v', 0.1)}
      {rays.map((a, i) => {
        const rad = (a * Math.PI) / 180;
        return line(cx, y0, cx + Math.cos(rad) * diag, y0 - Math.sin(rad) * diag, EASE.inOut(clamp(k * 1.4 - 0.2 - i * 0.05)), `r${i}`, 0.07);
      })}
      {[1, 1.55, 2.4].map((m, i) => {
        const c = 2 * Math.PI * r * m;
        return (
          <circle
            key={i}
            cx={cx}
            cy={y0}
            r={r * m}
            fill="none"
            stroke={i === 0 ? COLORS.accent : '#fff'}
            strokeOpacity={(i === 0 ? 0.45 : 0.09) * fade}
            strokeWidth={1}
            strokeDasharray={c}
            strokeDashoffset={c * (1 - EASE.inOut(clamp(k * 1.5 - 0.25 - i * 0.1)))}
            transform={`rotate(-90 ${cx} ${y0})`}
          />
        );
      })}
    </svg>
  );
};

/**
 * The symbol is *built*: ~1600 points of light swirl in from the whole frame
 * and settle exactly onto the official mark (sampled from its traced shape),
 * while its three orbits are traced in light; the solid mark then materialises
 * with a sheen and a lock pulse.
 */
const N_PARTICLES = 1600;

const useSymbolSamples = () =>
  useMemo(() => {
    const S = 520;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d')!;
    const k = S / Math.max(SW, SH);
    g.setTransform(k, 0, 0, k, (S - SW * k) / 2, (S - SH * k) / 2);
    g.fillStyle = '#fff';
    g.fill(new Path2D(SYMBOL_PATH.d), 'evenodd');
    const data = g.getImageData(0, 0, S, S).data;
    const pts: Array<[number, number]> = [];
    for (let y = 0; y < S; y += 3) for (let x = 0; x < S; x += 3) if (data[(y * S + x) * 4 + 3] > 128) pts.push([x / S, y / S]);
    return Array.from({length: N_PARTICLES}, (_, i) => pts[Math.floor(hash01(i, 5) * pts.length)] ?? [0.5, 0.5]);
  }, []);

const ParticleBuild: React.FC<{f: number; size: number}> = ({f, size}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const samples = useSymbolSamples();
  const L = useLayout();
  const W = Math.round(L.width);
  const H = Math.round(L.height);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext('2d')!;
    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    const cx = W / 2;
    const cy = H / 2;
    const pos = (i: number, ff: number) => {
      const r = (k: number) => hash01(i, k);
      const start = LINE - 12 + r(1) * 26;
      const dur = 50 + r(2) * 26;
      const u = clamp((ff - start) / dur);
      const e = EASE.inOut(u);
      const tx = cx + (samples[i][0] - 0.5) * size;
      const ty = cy + (samples[i][1] - 0.5) * size;
      // spiral approach from far away
      const ang0 = r(3) * Math.PI * 2;
      const rad0 = Math.max(W, H) * (0.45 + r(4) * 0.5);
      const ang = ang0 + (1 - e) * (2.2 + r(5) * 1.5);
      const rad = rad0 * (1 - e);
      return {x: tx + Math.cos(ang) * rad, y: ty + Math.sin(ang) * rad * 0.8, u};
    };
    const fadeAll = 1 - prog(f, LINE + 74, LINE + 96, EASE.inOut);
    if (fadeAll <= 0) return;
    for (let i = 0; i < N_PARTICLES; i++) {
      const p1 = pos(i, f);
      if (p1.u <= 0) continue;
      const p0 = pos(i, f - 2.2);
      const arrived = p1.u >= 1;
      const a = (arrived ? 0.55 : 0.25 + 0.5 * p1.u) * fadeAll;
      g.strokeStyle = hash01(i, 9) < 0.22 ? `rgba(129,150,255,${a})` : `rgba(235,240,255,${a})`;
      g.lineWidth = arrived ? 2.2 : 1.6;
      g.beginPath();
      g.moveTo(p0.x, p0.y);
      g.lineTo(p1.x + (arrived ? 0.6 : 0), p1.y);
      g.stroke();
    }
  });
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', left: 0, top: 0, width: W, height: H, pointerEvents: 'none'}} />;
};

const Symbol: React.FC<{f: number; size: number}> = ({f, size}) => {
  const scale = size / Math.max(SW, SH);
  const fill = EASE.out(prog(f, LINE + 60, LINE + 86, EASE.linear));
  const flash = f >= LINE + 84 ? Math.exp(-(f - LINE - 84) / 9) : 0;
  const sheen = prog(f, LINE + 78, LINE + 130, EASE.inOut);
  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} width={SW * scale} height={SH * scale} style={{overflow: 'visible'}}>
      <defs>
        <filter id="sym-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={16} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="sym-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#dfe3ee" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id="sym-sheen" x1="0" y1="0" x2="1" y2="0.6">
          <stop offset={Math.max(0, sheen - 0.15)} stopColor="#fff" stopOpacity={0} />
          <stop offset={sheen} stopColor="#fff" stopOpacity={0.95} />
          <stop offset={Math.min(1, sheen + 0.15)} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id="sym-mask">
          <path d={SYMBOL_PATH.d} fill="#fff" fillRule="evenodd" />
        </mask>
      </defs>
      {/* orbits traced in light, one after another */}
      {PIECES.map((d, i) => {
        const t0 = LINE + 4 + i * 12;
        const draw = EASE.inOut(prog(f, t0, t0 + 46, EASE.linear));
        return (
          <path key={i} d={d} fill="none" stroke={i === 1 ? COLORS.accentSoft : '#ffffff'} strokeWidth={4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} strokeOpacity={0.75 * (1 - fill * 0.85)} filter="url(#sym-glow)" />
        );
      })}
      <path d={SYMBOL_PATH.d} fill="url(#sym-fill)" fillRule="evenodd" opacity={fill} />
      {sheen > 0 && sheen < 1 ? <rect x={0} y={0} width={SW} height={SH} fill="url(#sym-sheen)" mask="url(#sym-mask)" opacity={0.8} /> : null}
      {flash > 0.01 ? <path d={SYMBOL_PATH.d} fill="#ffffff" fillRule="evenodd" opacity={flash * 0.7} filter="url(#sym-glow)" /> : null}
    </svg>
  );
};

/** Official wordmark, unmasked from its baseline in two strokes ("Arme" then "tec"). */
const Wordmark: React.FC<{f: number; height: number}> = ({f, height}) => {
  const W = WORDMARK_ARME_PATH.width + WORDMARK_TEC_PATH.width;
  const H = WORDMARK_ARME_PATH.height;
  const w = (W / H) * height;
  const a = EASE.out(prog(f, LOGO + 6, LOGO + 44, EASE.linear));
  const b = EASE.out(prog(f, LOGO + 22, LOGO + 60, EASE.linear));
  const sheen = prog(f, LOGO + 60, LOGO + 120, EASE.inOut);
  return (
    <div style={{width: w, height, position: 'relative', clipPath: 'inset(-10% -5% -6% -5%)'}}>
      <svg viewBox={`0 0 ${W} ${H}`} width={w} height={height} style={{overflow: 'visible'}}>
        <defs>
          <linearGradient id="wm-sheen" x1="0" x2="1" y1="0" y2="0">
            <stop offset={Math.max(0, sheen - 0.12)} stopColor="#fff" stopOpacity={0} />
            <stop offset={sheen} stopColor="#fff" stopOpacity={0.85} />
            <stop offset={Math.min(1, sheen + 0.12)} stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id="wm-mask">
            <path d={WORDMARK_ARME_PATH.d} fill="#fff" fillRule="evenodd" />
            <path d={WORDMARK_TEC_PATH.d} fill="#fff" fillRule="evenodd" transform={`translate(${WORDMARK_ARME_PATH.width},0)`} />
          </mask>
        </defs>
        <g transform={`translate(0 ${(1 - a) * H * 1.1})`} opacity={clamp(a * 2)}>
          <path d={WORDMARK_ARME_PATH.d} fill={COLORS.white} fillRule="evenodd" />
        </g>
        <g transform={`translate(${WORDMARK_ARME_PATH.width} ${(1 - b) * H * 1.1})`} opacity={clamp(b * 2)}>
          <path d={WORDMARK_TEC_PATH.d} fill={BRAND.accent} fillRule="evenodd" />
        </g>
        {sheen > 0 && sheen < 1 ? <rect x={0} y={0} width={W} height={H} fill="url(#wm-sheen)" mask="url(#wm-mask)" /> : null}
      </svg>
    </div>
  );
};

export const S09Signature: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame() + from;
  const L = useLayout();
  const s = L.u;
  const v = L.vertical;
  const symSize = (v ? 430 : 400) * s;
  const symY = L.safeCenterY - (v ? 190 : 150) * s;
  const markY = L.safeCenterY + (v ? 150 : 140) * s;
  const sloganY = markY + (v ? 140 : 130) * s;
  const guides = prog(f, LINE - 6, LOGO + 40, EASE.linear);
  const guidesFade = 1 - prog(f, SLOGAN + 30, BLACK, EASE.inOut) * 0.7;
  const dim = 1 - prog(f, BLACK, END - 6, EASE.inOut);
  // slow push-in for the whole signature (camera breathing in)
  const push = 1 + prog(f, FADE, END, EASE.linear) * 0.06;
  const tilt = (1 - EASE.out(prog(f, LINE, LOGO + 70, EASE.linear))) * 16;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{opacity: dim}}>
        <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 40% at 50% ${50 + (symY / L.height) * 100}%, rgba(81,112,255,${0.12 * guides}), transparent 70%)`}} />
        <Guides k={guides} fade={guidesFade} size={symSize} cy={symY} />
        <LightStreak progress={EASE.out(prog(f, LINE - 8, LINE + 30, EASE.linear))} fade={1 - prog(f, LINE + 40, LINE + 90)} y={symY} intensity={1.2} />
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', perspective: 1400, transform: `scale(${push})`}}>
          <AbsoluteFill style={{transform: `translateY(${symY}px)`}}>
            <ParticleBuild f={f} size={symSize} />
          </AbsoluteFill>
          <div style={{position: 'absolute', transform: `translateY(${symY}px) rotateX(${tilt}deg)`}}>
            <Symbol f={f} size={symSize} />
          </div>
          <div style={{position: 'absolute', transform: `translateY(${markY}px)`}}>
            <Wordmark f={f} height={(v ? 112 : 112) * s} />
          </div>
          <div style={{position: 'absolute', transform: `translateY(${sloganY}px)`}}>
            <SplitText text="Tecnologia que devolve o seu tempo." family={FONTS.sans} size={(v ? 38 : 36) * s} weight={400} tracking={0.04} state={riseIn(f, SLOGAN, {stagger: 0.7, dur: 40})} />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
