import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {EASE} from '../utils/easing';
import {clamp} from '../utils/math';

export type EnterType = 'none' | 'dissolve' | 'push' | 'light' | 'wipe';

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
  if (type === 'wipe') {
    // lateral camera pass: the new space slides in from the right behind a moving edge of light
    const edge = 100 - e * 100;
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{clipPath: `inset(0 0 0 ${edge}%)`, transform: `translateX(${(1 - e) * 14}%)`}}>{children}</AbsoluteFill>
        <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen'}}>
          <div style={{position: 'absolute', top: 0, bottom: 0, left: `${edge}%`, width: 3, marginLeft: -1.5, background: 'linear-gradient(180deg, transparent, #dfe5ff 30%, #ffffff 50%, #dfe5ff 70%, transparent)', opacity: Math.sin(t * Math.PI), boxShadow: '0 0 40px 8px rgba(81,112,255,0.55)'}} />
        </AbsoluteFill>
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
