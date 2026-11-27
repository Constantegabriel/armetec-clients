import {Easing} from 'remotion';

/** Cinematic easing curves (camera moves, reveals). */
export const EASE = {
  /** Heavy dolly: slow start, long settle. */
  dolly: Easing.bezier(0.65, 0, 0.18, 1),
  /** Expo out for reveals. */
  out: Easing.bezier(0.16, 1, 0.3, 1),
  /** Soft in-out. */
  inOut: Easing.bezier(0.45, 0, 0.55, 1),
  /** Accelerating exit. */
  in: Easing.bezier(0.55, 0, 0.9, 0.35),
  /** Snappy UI motion. */
  ui: Easing.bezier(0.2, 0.8, 0.2, 1),
  linear: (t: number) => t,
} as const;
