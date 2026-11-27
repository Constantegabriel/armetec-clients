import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONTS} from '../config/theme';
import {NARRATION, wordsOf} from '../config/script';
import {useLayout} from '../utils/layout';

/**
 * Discreet, complete narration subtitles — synchronized word by word.
 * Kept separate from the kinetic typography (toggle via EFFECTS.subtitles or
 * the `subtitles` input prop). Sits inside the Instagram safe area.
 */
export const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = useLayout();
  const t = frame / fps;
  const line = NARRATION.find((l) => t >= l.start - 0.15 && t <= l.end + 0.5);
  if (!line) return null;
  const words = wordsOf(line);
  const o = interpolate(t, [line.start - 0.15, line.start, line.end + 0.3, line.end + 0.5], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bottom = L.vertical ? L.safe.bottom - 40 : 56;
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', pointerEvents: 'none'}}>
      <div
        style={{
          marginBottom: bottom,
          maxWidth: L.vertical ? 860 : 1300,
          textAlign: 'center',
          fontFamily: FONTS.sans,
          fontSize: (L.vertical ? 33 : 30) * L.u,
          lineHeight: 1.35,
          fontWeight: 500,
          color: COLORS.white,
          opacity: o,
          padding: `${10 * L.u}px ${22 * L.u}px`,
          borderRadius: 14,
          background: 'rgba(5,5,5,0.42)',
          textShadow: '0 1px 12px rgba(0,0,0,0.6)',
        }}
      >
        {words.map((w, i) => {
          const on = interpolate(t, [w.start - 0.06, w.start + 0.08], [0.38, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <span key={i} style={{opacity: on}}>
              {w.text}
              {i < words.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
