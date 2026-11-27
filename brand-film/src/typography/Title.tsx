import React from 'react';
import {AbsoluteFill} from 'remotion';
import {combine, dissolveOut, focusIn, riseIn} from '../animations/kinetic';
import {COLORS, FONTS} from '../config/theme';
import {EASE} from '../utils/easing';
import {useLayout} from '../utils/layout';
import {prog} from '../utils/time';
import {SplitText} from './SplitText';

export type TitleLine = {
  text: string;
  /** size in px at 1080 short side */
  size: number;
  weight?: number;
  tracking?: number;
  color?: string;
  mode?: 'rise' | 'focus';
  /** extra delay (frames) */
  delay?: number;
  family?: string;
};

/**
 * Cinematic title block. Contrast is solved by art direction, not outlines:
 * a soft, feathered pool of darkness opens behind the lines just before they
 * arrive (a local "light falloff"), so white type stays legible over moving
 * interfaces. A very slow optical push keeps the block alive while it holds.
 */
export const Title: React.FC<{
  f: number;
  at: number;
  out: number;
  lines: TitleLine[];
  /** vertical anchor */
  anchor?: 'top' | 'center' | 'bottom';
  offset?: number;
  scrim?: number;
  gap?: number;
}> = ({f, at, out, lines, anchor = 'top', offset = 0, scrim = 0.75, gap = 4}) => {
  const L = useLayout();
  const s = L.u;
  if (f < at - 24 || f > out + 40) return null;
  const y =
    anchor === 'top'
      ? -L.height / 2 + L.safe.top + (L.vertical ? 130 : 110) * s + offset
      : anchor === 'bottom'
        ? L.height / 2 - L.safe.bottom - (L.vertical ? 120 : 110) * s + offset
        : L.safeCenterY + offset;
  const pool = prog(f, at - 24, at + 10, EASE.out) * (1 - prog(f, out + 10, out + 40, EASE.inOut));
  const push = 1 + prog(f, at, out + 30, EASE.linear) * 0.035;
  const yPct = 50 + (y / L.height) * 100;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {scrim > 0 ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse ${L.vertical ? 95 : 55}% ${L.vertical ? 15 : 24}% at 50% ${yPct}%, rgba(0,0,0,${0.82 * scrim * pool}) 0%, rgba(0,0,0,${0.5 * scrim * pool}) 45%, rgba(0,0,0,0) 100%)`,
          }}
        />
      ) : null}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{position: 'absolute', transform: `translateY(${y}px) scale(${push})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: gap * s}}>
          {lines.map((l, i) => {
            const t0 = at + (l.delay ?? i * 8);
            const enter = l.mode === 'focus' ? focusIn(f, t0) : riseIn(f, t0, {stagger: 1.6});
            const enterP = l.mode === 'focus' ? focusIn(f - 1, t0) : riseIn(f - 1, t0, {stagger: 1.6});
            return (
              <SplitText
                key={i}
                text={l.text}
                family={l.family ?? FONTS.display}
                size={l.size * s}
                weight={l.weight ?? 700}
                tracking={l.tracking ?? -0.02}
                color={l.color ?? COLORS.white}
                state={combine(enter, dissolveOut(f, out + i * 2))}
                prevState={combine(enterP, dissolveOut(f - 1, out + i * 2))}
              />
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Typical pairing: small spaced eyebrow + heavy key line. */
export const eyebrow = (text: string, size = 34): TitleLine => ({text, size, weight: 400, tracking: 0.32, color: COLORS.gray, mode: 'focus', family: FONTS.sans});
export const keyline = (text: string, size = 104, color?: string): TitleLine => ({text, size, weight: 750, tracking: -0.035, color});
