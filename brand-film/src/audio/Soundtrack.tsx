import React from 'react';
import {Audio, Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';
import {AUDIO} from '../config/audio';
import {NARRATION} from '../config/script';

/**
 * Sound design bed (all cues pre-mixed, sample-accurate) + narration.
 * When narration is enabled, the sound design dips slightly under each line.
 */
export const Soundtrack: React.FC = () => {
  const {fps, durationInFrames} = useVideoConfig();
  const volume = (f: number) => {
    const t = f / fps;
    let duck = 1;
    if (AUDIO.narration.enabled) {
      for (const l of NARRATION) {
        const k = interpolate(t, [l.start - 0.2, l.start, l.end, l.end + 0.3], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        duck = Math.min(duck, 1 - k * (1 - AUDIO.soundDesign.duckTo));
      }
    }
    const tail = interpolate(f, [durationInFrames - 12, durationInFrames - 1], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return AUDIO.soundDesign.volume * duck * tail;
  };
  return (
    <>
      {AUDIO.soundDesign.enabled ? <Audio src={staticFile(AUDIO.soundDesign.file)} volume={volume} /> : null}
      {AUDIO.narration.enabled ? (
        <Sequence from={Math.round(AUDIO.narration.offsetSeconds * fps)} name="narration" layout="none">
          <Audio src={staticFile(AUDIO.narration.file)} volume={AUDIO.narration.volume} />
        </Sequence>
      ) : null}
    </>
  );
};
