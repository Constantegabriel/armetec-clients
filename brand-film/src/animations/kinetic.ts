import {spring} from 'remotion';
import type {CharState} from '../typography/SplitText';
import {EASE} from '../utils/easing';
import {clamp} from '../utils/math';
import {FPS} from '../config/video';

type F = (i: number, n: number, ch: string) => CharState;

const p = (f: number, a: number, d: number, e = EASE.out) => e(clamp((f - a) / d));

/** Glyphs rise out of an invisible baseline mask, rotating up into place. */
export const riseIn = (f: number, start: number, o: {stagger?: number; dur?: number; dist?: number} = {}): F => {
  const {stagger = 2.2, dur = 26, dist = 0.9} = o;
  return (i) => {
    const t = p(f, start + i * stagger, dur);
    return {y: (1 - t) * dist * 100, rx: (1 - t) * -70, opacity: clamp(t * 1.6), blur: (1 - t) * 10};
  };
};

/** Wide-tracked, blurred glyphs collapse into a tight word (focus pull feel). */
export const focusIn = (f: number, start: number, o: {dur?: number; spread?: number; z?: number} = {}): F => {
  const {dur = 34, spread = 0.6, z = 0} = o;
  const t = p(f, start, dur, EASE.out);
  return (i, n) => {
    const c = i - (n - 1) / 2;
    return {x: c * spread * 100 * (1 - t), z: z * (1 - t), opacity: clamp(t * 1.4), blur: (1 - t) * 22};
  };
};

/** Heavy slam: scale-down with physical overshoot (spring), slight blur. */
export const slamIn = (f: number, start: number, o: {from?: number; damping?: number} = {}): F => {
  const {from = 1.9, damping = 13} = o;
  const s = spring({frame: f - start, fps: FPS, config: {damping, mass: 0.9, stiffness: 170}});
  const sc = from + (1 - from) * s;
  const vis = f >= start ? 1 : 0;
  return () => ({sx: sc, sy: sc, opacity: vis * clamp((f - start) / 4), blur: Math.max(0, (sc - 1) * 14)});
};

/** Per-glyph spring drop from above (weighty). */
export const dropIn = (f: number, start: number, o: {stagger?: number; height?: number} = {}): F => {
  const {stagger = 3, height = 260} = o;
  return (i) => {
    const s = spring({frame: f - start - i * stagger, fps: FPS, config: {damping: 11, mass: 1.2, stiffness: 200}});
    return {y: -(1 - s) * height, opacity: f - start - i * stagger >= 0 ? clamp(s * 3) : 0, sy: 1 + (1 - s) * 0.25};
  };
};

/** Exit: glyphs drift up and dissolve with blur. */
export const dissolveOut = (f: number, start: number, o: {stagger?: number; dur?: number; dir?: number} = {}): F => {
  const {stagger = 1.2, dur = 22, dir = -1} = o;
  return (i) => {
    const t = p(f, start + i * stagger, dur, EASE.in);
    return {y: dir * t * 60, opacity: 1 - t, blur: t * 16};
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
    z: (s1.z ?? 0) + (s2.z ?? 0),
    rx: (s1.rx ?? 0) + (s2.rx ?? 0),
    sx: (s1.sx ?? 1) * (s2.sx ?? 1),
    sy: (s1.sy ?? 1) * (s2.sy ?? 1),
    opacity: (s1.opacity ?? 1) * (s2.opacity ?? 1),
    blur: (s1.blur ?? 0) + (s2.blur ?? 0),
    weight: s2.weight ?? s1.weight,
  };
};
