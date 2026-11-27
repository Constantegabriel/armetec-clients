import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {EFFECTS} from '../config/effects';
import {hash01} from '../utils/random';

/**
 * Extremely subtle film grain: SVG turbulence with a frame-derived seed
 * (deterministic), blended in overlay. Plus an optical vignette.
 */
export const FilmGrain: React.FC = () => {
  const frame = useCurrentFrame();
  if (EFFECTS.grain <= 0) return null;
  const seed = Math.floor(hash01(Math.floor(frame / 2), 7) * 1000);
  return (
    <AbsoluteFill style={{mixBlendMode: 'overlay', opacity: EFFECTS.grain * 4, pointerEvents: 'none'}}>
      <svg width="100%" height="100%">
        <filter id={`grain-${seed}`} x="0" y="0">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = EFFECTS.vignette}) => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: `radial-gradient(ellipse 75% 65% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);

/** Black overlay helper for dramatic dips (only where narratively intended). */
export const Dip: React.FC<{opacity: number}> = ({opacity}) =>
  opacity <= 0 ? null : <AbsoluteFill style={{background: '#000', opacity, pointerEvents: 'none'}} />;
