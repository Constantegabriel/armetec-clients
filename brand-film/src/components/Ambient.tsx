import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useLayout} from '../utils/layout';
import {hash01, noise1} from '../utils/random';

/**
 * Full-bleed atmosphere: drifting specks of light (dust in a projector beam)
 * with depth-based size/blur/parallax, plus soft edge light. It keeps the
 * platform safe margins alive without placing information in them.
 */
export const AmbientDust: React.FC<{count?: number; opacity?: number}> = ({count = 70, opacity = 1}) => {
  const f = useCurrentFrame();
  const {width, height} = useLayout();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity}}>
      {Array.from({length: count}, (_, i) => {
        const depth = hash01(i, 1); // 0 far … 1 near
        const sp = 0.15 + depth * 0.6;
        const x = (hash01(i, 2) * width + f * sp * (hash01(i, 3) - 0.3) + width) % width;
        const y = (hash01(i, 4) * height - f * sp * 0.6 + height * 4) % height;
        const wob = (noise1(f / 90 + i, 7) - 0.5) * 30;
        const size = 2 + depth * 7;
        const tw = 0.5 + 0.5 * noise1(f / 40 + i * 3, 11);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + wob,
              top: y,
              width: size,
              height: size,
              borderRadius: size,
              background: i % 9 === 0 ? 'rgba(142,160,255,0.9)' : 'rgba(255,255,255,0.85)',
              opacity: (0.08 + depth * 0.22) * tw,
              filter: `blur(${depth > 0.7 ? (depth - 0.7) * 10 : 0.6}px)`,
            }}
          />
        );
      })}
      {/* edge light: keeps the margins from reading as dead black */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 60% 18% at 50% 0%, rgba(160,175,255,0.06), transparent 70%), radial-gradient(ellipse 60% 18% at 50% 100%, rgba(160,175,255,0.07), transparent 70%)',
        }}
      />
    </AbsoluteFill>
  );
};
