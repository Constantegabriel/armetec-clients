import React from 'react';
import {Audio, Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';
import {AUDIO, SFX_CUES} from '../config/audio';
import {NARRATION} from '../config/script';

/** Music volume curve: fades + ducking under each narration line. */
const useMusicVolume = () => {
  const {fps, durationInFrames} = useVideoConfig();
  return (f: number) => {
    const t = f / fps;
    let duck = 1;
    if (AUDIO.narration.enabled) {
      for (const l of NARRATION) {
        const k = interpolate(t, [l.start - 0.25, l.start, l.end, l.end + 0.35], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        duck = Math.min(duck, 1 - k * (1 - AUDIO.music.duckTo));
      }
    }
    const fadeOut = interpolate(f, [durationInFrames - 20, durationInFrames - 1], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return AUDIO.music.volume * duck * fadeOut;
  };
};

export const Soundtrack: React.FC = () => {
  const {fps} = useVideoConfig();
  const musicVolume = useMusicVolume();
  return (
    <>
      {AUDIO.music.enabled ? <Audio src={staticFile(AUDIO.music.file)} volume={musicVolume} /> : null}
      {AUDIO.sfx.enabled
        ? SFX_CUES.map((c, i) => (
            <Sequence key={i} from={Math.round(c.t * fps)} name={`sfx:${c.type}`} layout="none">
              <Audio src={staticFile(`${AUDIO.sfx.folder}/${c.type}.wav`)} volume={c.gain * AUDIO.sfx.volume} />
            </Sequence>
          ))
        : null}
      {AUDIO.narration.enabled ? (
        <Sequence from={Math.round(AUDIO.narration.offsetSeconds * fps)} name="narration" layout="none">
          <Audio src={staticFile(AUDIO.narration.file)} volume={AUDIO.narration.volume} />
        </Sequence>
      ) : null}
    </>
  );
};
