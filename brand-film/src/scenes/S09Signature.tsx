import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {riseIn} from '../animations/kinetic';
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
const LOGO = beat('s09_logo');
const SLOGAN = beat('s09_slogan');
const BLACK = beat('s09_black');
const END = sceneEnd('s09-assinatura');

const PIECES = SYMBOL_PATH.d.split(/(?=M )/).map((d) => d.trim());
const SW = SYMBOL_PATH.width;
const SH = SYMBOL_PATH.height;

/* ------------------------------------------------------------------------- */
/*  Symbol construction: orbits → traced light → fill                           */
/* ------------------------------------------------------------------------- */

type PieceGeo = {d: string; len: number; at: (u: number) => [number, number]; ellipse: {cx: number; cy: number; rx: number; ry: number; rot: number}};

/** Measures each piece of the official mark: path length, point sampler and its principal ellipse. */
const usePieces = (): PieceGeo[] =>
  useMemo(() => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    document.body.appendChild(svg);
    const out = PIECES.map((d) => {
      // outer contour of the piece only (first subpath segment set) for tracing
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      el.setAttribute('d', d);
      svg.appendChild(el);
      const len = el.getTotalLength();
      const at = (u: number): [number, number] => {
        const p = el.getPointAtLength(clamp(u) * len);
        return [p.x, p.y];
      };
      // principal axes (PCA) → the orbit this piece belongs to
      const n = 160;
      const pts = Array.from({length: n}, (_, i) => at(i / n));
      const mx = pts.reduce((a2, p) => a2 + p[0], 0) / n;
      const my = pts.reduce((a2, p) => a2 + p[1], 0) / n;
      let sxx = 0;
      let syy = 0;
      let sxy = 0;
      pts.forEach(([x, y]) => {
        sxx += (x - mx) ** 2;
        syy += (y - my) ** 2;
        sxy += (x - mx) * (y - my);
      });
      sxx /= n;
      syy /= n;
      sxy /= n;
      const tr = sxx + syy;
      const det = sxx * syy - sxy * sxy;
      const l1 = tr / 2 + Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
      const l2 = tr / 2 - Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
      const rot = (Math.atan2(l1 - sxx, sxy) * 180) / Math.PI;
      return {d, len, at, ellipse: {cx: mx, cy: my, rx: Math.sqrt(l1) * 1.55, ry: Math.sqrt(Math.max(1, l2)) * 1.55, rot}};
    });
    return out;
  }, []);

const S9 = FADE;
const tTrace = (i: number) => S9 + 24 + i * 10;
const TRACE = 46;
const tFill = (i: number) => tTrace(i) + TRACE - 6;

const Symbol: React.FC<{f: number; size: number}> = ({f, size}) => {
  const pieces = usePieces();
  const scale = size / Math.max(SW, SH);
  const lockAt = tFill(2) + 18;
  const lock = f >= lockAt ? Math.exp(-(f - lockAt) / 10) : 0;
  const settle = 0.94 + 0.06 * EASE.out(prog(f, S9 + 10, lockAt, EASE.linear));
  const sheen = prog(f, lockAt + 4, lockAt + 60, EASE.inOut);
  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} width={SW * scale} height={SH * scale} style={{overflow: 'visible', transform: `scale(${settle})`}}>
      <defs>
        <filter id="sym-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={14} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="comet" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
        <linearGradient id="sym-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#e2e6f0" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id="sym-sheen" x1="0" y1="0" x2="1" y2="0.6">
          <stop offset={Math.max(0, sheen - 0.14)} stopColor="#fff" stopOpacity={0} />
          <stop offset={sheen} stopColor="#fff" stopOpacity={0.9} />
          <stop offset={Math.min(1, sheen + 0.14)} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id="sym-mask">
          <path d={SYMBOL_PATH.d} fill="#fff" fillRule="evenodd" />
        </mask>
      </defs>
      {pieces.map((p, i) => {
        // 1 — orbit guide opens, spinning into its exact orientation
        const g = EASE.out(prog(f, S9 + 8 + i * 6, S9 + 40 + i * 6, EASE.linear));
        const gFade = 1 - prog(f, tFill(i), tFill(i) + 24, EASE.inOut);
        const e = p.ellipse;
        // 2 — a comet traces the true contour
        const u = EASE.inOut(prog(f, tTrace(i), tTrace(i) + TRACE, EASE.linear));
        const tracing = u > 0 && u < 1;
        const head = p.at(u);
        const tail = Array.from({length: 8}, (_, k) => p.at(Math.max(0, u - (k + 1) * 0.012)));
        // 3 — fill
        const fill = EASE.out(prog(f, tFill(i), tFill(i) + 18, EASE.linear));
        return (
          <g key={i}>
            {g > 0 && gFade > 0 ? (
              <ellipse
                cx={e.cx}
                cy={e.cy}
                rx={e.rx * g}
                ry={e.ry * g}
                transform={`rotate(${e.rot + (1 - g) * -90} ${e.cx} ${e.cy})`}
                fill="none"
                stroke={i === 1 ? COLORS.accentSoft : '#ffffff'}
                strokeOpacity={0.32 * gFade}
                strokeWidth={2.5}
                strokeDasharray="10 14"
              />
            ) : null}
            <path d={p.d} fill="none" stroke="#ffffff" strokeWidth={5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - u} strokeOpacity={0.9 * (1 - fill * 0.9)} filter="url(#sym-glow)" />
            <path d={p.d} fill="url(#sym-fill)" fillRule="evenodd" opacity={fill} />
            {tracing ? (
              <g>
                {tail.map((q, k) => (
                  <circle key={k} cx={q[0]} cy={q[1]} r={26 - k * 2.6} fill={i === 1 ? COLORS.accentSoft : '#ffffff'} opacity={0.5 - k * 0.055} />
                ))}
                <circle cx={head[0]} cy={head[1]} r={70} fill={COLORS.accent} opacity={0.7} filter="url(#comet)" />
                <circle cx={head[0]} cy={head[1]} r={22} fill="#fff" />
                {/* sparks shed along the path */}
                {Array.from({length: 10}, (_, k) => {
                  const born = tTrace(i) + k * (TRACE / 10);
                  const age = f - born;
                  if (age < 0 || age > 24) return null;
                  const at = p.at(EASE.inOut(prog(born, tTrace(i), tTrace(i) + TRACE, EASE.linear)));
                  const ang = hash01(k + i * 10, 3) * Math.PI * 2;
                  const dist = age * (2.2 + hash01(k, 4) * 2.5);
                  return <circle key={`s${k}`} cx={at[0] + Math.cos(ang) * dist * 3} cy={at[1] + Math.sin(ang) * dist * 3} r={7} fill="#fff" opacity={(1 - age / 24) * 0.8} />;
                })}
              </g>
            ) : null}
          </g>
        );
      })}
      {sheen > 0 && sheen < 1 ? <rect x={0} y={0} width={SW} height={SH} fill="url(#sym-sheen)" mask="url(#sym-mask)" opacity={0.8} /> : null}
      {lock > 0.01 ? <path d={SYMBOL_PATH.d} fill="#ffffff" fillRule="evenodd" opacity={lock * 0.55} filter="url(#sym-glow)" /> : null}
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
  const glow = prog(f, S9, LOGO + 40, EASE.linear);
  // the point of light handed over by the clock travels to the symbol centre
  const travel = EASE.inOut(prog(f, S9, S9 + 22, EASE.linear));
  const pointOn = 1 - prog(f, S9 + 20, S9 + 36, EASE.linear);
  const dim = 1 - prog(f, BLACK, END - 6, EASE.inOut);
  // slow push-in for the whole signature (camera breathing in)
  const push = 1 + prog(f, FADE, END, EASE.linear) * 0.06;
  const tilt = (1 - EASE.out(prog(f, S9, LOGO + 60, EASE.linear))) * 10;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{opacity: dim}}>
        <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 40% at 50% ${50 + (symY / L.height) * 100}%, rgba(81,112,255,${0.14 * glow}), transparent 70%)`}} />
        {pointOn > 0 ? (
          <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', pointerEvents: 'none'}}>
            <div style={{width: 14, height: 14, borderRadius: 14, background: '#fff', boxShadow: `0 0 30px 10px ${COLORS.accent}`, opacity: pointOn, transform: `translateY(${travel * symY}px)`}} />
          </AbsoluteFill>
        ) : null}
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
