import {spring} from 'remotion';
import type {CharState} from '../typography/SplitText';
import {EASE} from '../utils/easing';
import {clamp} from '../utils/math';
import {FPS} from '../config/video';

type F = (i: number, n: number, ch: string) => CharState;

const p = (f: number, a: number, d: number, e = EASE.out) => e(clamp((f - a) / d));

/**
 * Film-title reveal: glyphs slide up from behind an invisible baseline mask,
 * resolving from a soft focus. Long expo ease, gentle stagger.
 */
export const riseIn = (f: number, start: number, o: {stagger?: number; dur?: number; dist?: number} = {}): F => {
  const {stagger = 1.8, dur = 38} = o;
  return (i) => {
    const t = p(f, start + i * stagger, dur);
    return {yEm: (1 - t) * 1.05, opacity: clamp(t * 2.2), blur: (1 - t) * 3};
  };
};

/** Lens focus-pull: the word resolves from a soft, slightly wider, larger blur. */
export const focusIn = (f: number, start: number, o: {dur?: number; spread?: number; z?: number} = {}): F => {
  const {dur = 52, spread = 0.25, z = 0} = o;
  const t = p(f, start, dur, EASE.out);
  return (i, n) => {
    const c = i - (n - 1) / 2;
    return {x: c * spread * 40 * (1 - t), z: z * (1 - t), sx: 1 + (1 - t) * 0.06, sy: 1 + (1 - t) * 0.06, opacity: clamp(t * 1.5), blur: (1 - t) * 14};
  };
};

/** Heavy slam: scale-down with physical overshoot (spring), slight blur. */
export const slamIn = (f: number, start: number, o: {from?: number; damping?: number} = {}): F => {
  const {from = 1.35, damping = 24} = o;
  const s = spring({frame: f - start, fps: FPS, config: {damping, mass: 0.9, stiffness: 170}});
  const sc = from + (1 - from) * s;
  const vis = f >= start ? 1 : 0;
  return () => ({sx: sc, sy: sc, opacity: vis * clamp((f - start) / 8), blur: Math.max(0, (sc - 1) * 22)});
};

/** Per-glyph spring drop from above (weighty). */
export const dropIn = (f: number, start: number, o: {stagger?: number; height?: number} = {}): F => {
  const {stagger = 3, height = 260} = o;
  return (i) => {
    const s = spring({frame: f - start - i * stagger, fps: FPS, config: {damping: 11, mass: 1.2, stiffness: 200}});
    return {y: -(1 - s) * height, opacity: f - start - i * stagger >= 0 ? clamp(s * 3) : 0, sy: 1 + (1 - s) * 0.25};
  };
};

/** Exit: the line drifts up a touch, defocuses and fades (no hard cut). */
export const dissolveOut = (f: number, start: number, o: {stagger?: number; dur?: number; dir?: number} = {}): F => {
  const {stagger = 0.8, dur = 26, dir = -1} = o;
  return (i) => {
    const t = p(f, start + i * stagger, dur, EASE.inOut);
    return {y: dir * t * 18, opacity: 1 - t, blur: t * 10, sx: 1 + t * 0.03, sy: 1 + t * 0.03};
  };
};

/** Compose an entrance and an exit. */
export const combine = (a: F, b: F): F => (i, n, ch) => {
  const s1 = a(i, n, ch);
  const s2 = b(i, n, ch);
  return {
    ...s1,
    ...s2,
    x: (s1.x ?? 0) + (s2.x ?? 0),
    y: (s1.y ?? 0) + (s2.y ?? 0),
    yEm: s1.yEm !== undefined || s2.yEm !== undefined ? (s1.yEm ?? 0) + (s2.yEm ?? 0) : undefined,
    z: (s1.z ?? 0) + (s2.z ?? 0),
    rx: (s1.rx ?? 0) + (s2.rx ?? 0),
    sx: (s1.sx ?? 1) * (s2.sx ?? 1),
    sy: (s1.sy ?? 1) * (s2.sy ?? 1),
    opacity: (s1.opacity ?? 1) * (s2.opacity ?? 1),
    blur: (s1.blur ?? 0) + (s2.blur ?? 0),
    weight: s2.weight ?? s1.weight,
  };
};
