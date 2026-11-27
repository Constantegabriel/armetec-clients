import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {EASE} from '../utils/easing';
import {clamp} from '../utils/math';

export type EnterType = 'none' | 'dissolve' | 'push' | 'light';

/**
 * Entrance of a block over the previous one during their overlap. Scenes are
 * built to *match* across the overlap (same motion direction, same grid or
 * object), so the blend reads as one continuous camera move, not a cut.
 */
export const Enter: React.FC<{frames: number; type: EnterType; children: React.ReactNode}> = ({frames, type, children}) => {
  const f = useCurrentFrame();
  if (type === 'none' || frames <= 0 || f >= frames) return <AbsoluteFill>{children}</AbsoluteFill>;
  const t = clamp(f / frames);
  const e = EASE.inOut(t);
  if (type === 'push') {
    // continuing forward motion: incoming world decelerates from a slight overscale
    return (
      <AbsoluteFill style={{opacity: e, transform: `scale(${1.18 - 0.18 * EASE.out(t)})`, filter: t < 0.9 ? `blur(${(1 - t) * 10}px)` : undefined}}>
        {children}
      </AbsoluteFill>
    );
  }
  if (type === 'light') {
    return (
      <AbsoluteFill style={{opacity: e}}>
        {children}
        <AbsoluteFill style={{background: '#fff', mixBlendMode: 'screen', opacity: Math.sin(t * Math.PI) * 0.25}} />
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{opacity: e}}>{children}</AbsoluteFill>;
};
