import {interpolate} from 'remotion';
import timeline from '../config/timeline.json';
import {FPS} from '../config/video';
import {EASE} from './easing';

export const sec = (s: number) => Math.round(s * FPS);
export type BeatName = keyof typeof timeline.beats;
/** Absolute frame of a named beat. */
export const beat = (name: BeatName) => sec(timeline.beats[name]);

type Ease = (t: number) => number;
/** 0→1 progress between two absolute frames. */
export const prog = (frame: number, from: number, to: number, ease: Ease = EASE.inOut) =>
  interpolate(frame, [from, to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

/** Keyframed value: [[frame, value], ...] with per-segment easing. */
export const keys = (frame: number, kf: Array<[number, number]>, ease: Ease = EASE.inOut) => {
  if (frame <= kf[0][0]) return kf[0][1];
  for (let i = 0; i < kf.length - 1; i++) {
    const [f0, v0] = kf[i];
    const [f1, v1] = kf[i + 1];
    if (frame <= f1) return v0 + (v1 - v0) * ease(Math.min(1, Math.max(0, (frame - f0) / Math.max(1, f1 - f0))));
  }
  return kf[kf.length - 1][1];
};

/** Absolute frame where a scene (timeline.json → scenes) ends. */
export const sceneEnd = (id: (typeof timeline.scenes)[number]['id']) => sec(timeline.scenes.find((s) => s.id === id)!.end);
