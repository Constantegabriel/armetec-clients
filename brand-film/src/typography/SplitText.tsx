import React from 'react';
import {FONTS} from '../config/theme';
import {EFFECTS} from '../config/effects';

export type CharState = {
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  sx?: number;
  sy?: number;
  opacity?: number;
  blur?: number;
  /** variable font weight */
  weight?: number;
  color?: string;
};

type Props = {
  text: string;
  /** frame-local state per character; `vel` lets callers add motion blur */
  state: (i: number, n: number, ch: string) => CharState;
  /** state one frame earlier — enables velocity-based motion blur */
  prevState?: (i: number, n: number, ch: string) => CharState;
  size: number;
  weight?: number;
  family?: string;
  color?: string;
  tracking?: number;
  style?: React.CSSProperties;
  perspective?: number;
  align?: 'center' | 'left' | 'right';
  lineHeight?: number;
};

/**
 * Character-level kinetic typography. Each glyph is an independent 3D-transformed
 * span; spacing stays typographically correct because glyphs keep their advance.
 */
export const SplitText: React.FC<Props> = ({
  text,
  state,
  prevState,
  size,
  weight = 600,
  family = FONTS.display,
  color = '#F5F5F5',
  tracking = 0,
  style,
  perspective = 1400,
  align = 'center',
  lineHeight = 1,
}) => {
  const chars = Array.from(text);
  const n = chars.length;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end',
        perspective,
        whiteSpace: 'pre',
        fontFamily: family,
        fontSize: size,
        lineHeight,
        letterSpacing: `${tracking}em`,
        color,
        ...style,
      }}
    >
      {chars.map((ch, i) => {
        const s = state(i, n, ch);
        let mb = 0;
        if (prevState && EFFECTS.typeMotionBlur > 0) {
          const p = prevState(i, n, ch);
          const v = Math.hypot((s.x ?? 0) - (p.x ?? 0), (s.y ?? 0) - (p.y ?? 0), ((s.z ?? 0) - (p.z ?? 0)) * 0.3);
          mb = v * EFFECTS.typeMotionBlur;
        }
        const blur = (s.blur ?? 0) + mb;
        const o = s.opacity ?? 1;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              transform: `translate3d(${s.x ?? 0}px, ${s.y ?? 0}px, ${s.z ?? 0}px) rotateX(${s.rx ?? 0}deg) rotateY(${s.ry ?? 0}deg) rotateZ(${s.rz ?? 0}deg) scale(${s.sx ?? 1}, ${s.sy ?? 1})`,
              opacity: o,
              filter: blur > 0.3 ? `blur(${Math.min(blur, 40).toFixed(2)}px)` : undefined,
              fontVariationSettings: `'wght' ${s.weight ?? weight}`,
              fontWeight: s.weight ?? weight,
              color: s.color,
              transformOrigin: '50% 70%',
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};
