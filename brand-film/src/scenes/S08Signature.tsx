import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {riseIn} from '../animations/kinetic';
import {LightStreak} from '../components/Light';
import {SYMBOL_PATH, WORDMARK_ARME_PATH, WORDMARK_TEC_PATH} from '../config/brand-paths.generated';
import {BRAND} from '../config/brand';
import {COLORS, FONTS} from '../config/theme';
import {SplitText} from '../typography/SplitText';
import {EASE} from '../utils/easing';
import {useLayout} from '../utils/layout';
import {clamp} from '../utils/math';
import {beat, prog, sec} from '../utils/time';

/**
 * SCENE 08 — the logo is *constructed*.
 *  1. a line of light crosses the frame; geometric construction guides draw
 *     across the whole frame (they fill the safe margins without carrying info);
 *  2. the three orbits of the official symbol are traced in light, one by one;
 *  3. each orbit rotates into its exact position and fills, locking with a flash;
 *  4. the wordmark is unmasked letter-group by letter-group; the slogan settles;
 *  5. hold for recall, then absolute black.
 * Paths are vectorised from the official logo files (public/brand).
 */
const FADE = beat('s08_fade');
const LINE = beat('s08_lightLine');
const LOGO = beat('s08_logo');
const SLOGAN = beat('s08_slogan');
const BLACK = beat('s08_black');
const END = sec(70);

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

const Symbol: React.FC<{f: number; size: number}> = ({f, size}) => {
  const scale = size / Math.max(SW, SH);
  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} width={SW * scale} height={SH * scale} style={{overflow: 'visible'}}>
      <defs>
        <filter id="sym-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={18} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="sym-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#d9dbe3" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      {PIECES.map((d, i) => {
        const t0 = LINE + 14 + i * 12;
        const draw = EASE.inOut(prog(f, t0, t0 + 40, EASE.linear));
        const lock = EASE.dolly(prog(f, t0 + 20, t0 + 62, EASE.linear));
        const fill = EASE.out(prog(f, t0 + 44, t0 + 66, EASE.linear));
        // each orbit arrives from its own angle and settles exactly in place
        const rot = (1 - lock) * (i === 0 ? -38 : i === 1 ? 34 : -26);
        const sc = 0.86 + 0.14 * lock;
        const flash = Math.exp(-Math.max(0, f - (t0 + 62)) / 7) * (f >= t0 + 62 ? 1 : 0);
        return (
          <g key={i} transform={`rotate(${rot} ${SW / 2} ${SH / 2}) translate(${(SW / 2) * (1 - sc)} ${(SH / 2) * (1 - sc)}) scale(${sc})`}>
            <path
              d={d}
              fill="none"
              stroke={i === 1 ? COLORS.accentSoft : '#ffffff'}
              strokeWidth={5}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - draw}
              strokeOpacity={1 - fill * 0.9}
              filter="url(#sym-glow)"
            />
            <path d={d} fill="url(#sym-sheen)" fillRule="evenodd" opacity={fill} />
            {flash > 0.01 ? <path d={d} fill="#ffffff" opacity={flash * 0.8} filter="url(#sym-glow)" /> : null}
          </g>
        );
      })}
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

export const S08Signature: React.FC<{from: number}> = ({from}) => {
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
