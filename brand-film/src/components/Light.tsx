import React from 'react';
import {AbsoluteFill} from 'remotion';
import {COLORS} from '../config/theme';

/**
 * Anamorphic line of light: a razor core with a soft bloom, growing from the
 * centre. Used as the opening reveal and the logo signature.
 */
export const LightStreak: React.FC<{progress: number; fade?: number; y?: number; color?: string; thickness?: number; intensity?: number}> = ({
  progress,
  fade = 1,
  y = 0,
  color = '#dfe5ff',
  thickness = 2,
  intensity = 1,
}) => {
  if (progress <= 0 || fade <= 0) return null;
  const w = progress * 110;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', mixBlendMode: 'screen', pointerEvents: 'none', opacity: fade * intensity}}>
      <div style={{position: 'absolute', top: `calc(50% + ${y}px)`, left: `${50 - w / 2}%`, width: `${w}%`, height: 0}}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: -60,
            height: 120,
            background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${COLORS.accent}55, transparent 70%)`,
            filter: 'blur(12px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: -thickness * 4,
            height: thickness * 8,
            background: `linear-gradient(90deg, transparent, ${color}66 20%, ${color}cc 50%, ${color}66 80%, transparent)`,
            filter: 'blur(4px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: -thickness / 2,
            height: thickness,
            background: `linear-gradient(90deg, transparent, ${color} 30%, #ffffff 50%, ${color} 70%, transparent)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

/** Soft volumetric shafts (screen blend) — cheap, cinematic atmosphere. */
export const VolumetricBeams: React.FC<{opacity?: number; angle?: number; color?: string; offset?: number}> = ({
  opacity = 0.5,
  angle = -24,
  color = '#9fb0ff',
  offset = 0,
}) => (
  <AbsoluteFill style={{mixBlendMode: 'screen', opacity, pointerEvents: 'none', overflow: 'hidden'}}>
    {[0, 1, 2, 3].map((i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: `${-20 + i * 28 + offset}%`,
          top: '-30%',
          width: `${8 + (i % 2) * 10}%`,
          height: '160%',
          transform: `rotate(${angle}deg)`,
          background: `linear-gradient(180deg, ${color}00, ${color}${i % 2 ? '18' : '2a'} 40%, ${color}00)`,
          filter: 'blur(40px)',
        }}
      />
    ))}
  </AbsoluteFill>
);
