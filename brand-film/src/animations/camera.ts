import type {CamState} from '../components/CssWorld';
import {lookAt} from '../three/cameraRig';
import {EASE} from '../utils/easing';
import {clamp, lerp} from '../utils/math';
import {noise1} from '../utils/random';

export type V3 = [number, number, number];
export type CamKey = {
  f: number;
  pos: V3;
  target: V3;
  lens?: number;
  roll?: number;
  /** focus distance override; default = distance to target */
  focus?: number;
  aperture?: number;
  /** easing INTO this key */
  ease?: (t: number) => number;
};

const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * Keyframed physical camera: position + look-at target + lens + focus.
 * Each segment has its own easing (dolly, push-in, pull-back reveal...).
 */
export const camPath = (frame: number, keys: CamKey[], handheld = 0): CamState => {
  let a = keys[0];
  let b = keys[0];
  let t = 0;
  if (frame >= keys[keys.length - 1].f) {
    a = b = keys[keys.length - 1];
  } else if (frame > keys[0].f) {
    for (let i = 0; i < keys.length - 1; i++) {
      if (frame <= keys[i + 1].f) {
        a = keys[i];
        b = keys[i + 1];
        t = (b.ease ?? EASE.inOut)(clamp((frame - a.f) / Math.max(1, b.f - a.f)));
        break;
      }
    }
  }
  const pos = lerp3(a.pos, b.pos, t);
  const target = lerp3(a.target, b.target, t);
  // subtle "operator" breathing — deterministic noise, sub-pixel to a few px
  if (handheld > 0) {
    pos[0] += (noise1(frame / 90, 1) - 0.5) * handheld;
    pos[1] += (noise1(frame / 110, 2) - 0.5) * handheld;
  }
  const {yaw, pitch} = lookAt(pos, target);
  const fa = a.focus ?? dist(a.pos, a.target);
  const fb = b.focus ?? dist(b.pos, b.target);
  return {
    x: pos[0],
    y: pos[1],
    z: pos[2],
    yaw,
    pitch,
    roll: lerp(a.roll ?? 0, b.roll ?? 0, t),
    lens: lerp(a.lens ?? 35, b.lens ?? 35, t),
    focus: lerp(fa, fb, t),
    aperture: lerp(a.aperture ?? 1, b.aperture ?? 1, t),
  };
};

/** Small decaying camera shake for impacts (deterministic). */
export const shake = (frame: number, at: number, amp = 12, decay = 18) => {
  const d = frame - at;
  if (d < 0) return {x: 0, y: 0, r: 0};
  const k = Math.exp(-d / decay) * amp;
  return {x: (noise1(d / 3, 5) - 0.5) * 2 * k, y: (noise1(d / 3, 9) - 0.5) * 2 * k, r: (noise1(d / 4, 13) - 0.5) * k * 0.05};
};

/* ------------------------------------------------------------------------- */
/*  Velocity-continuous camera (cinematic dolly / crane rig)                  */
/* ------------------------------------------------------------------------- */

export type SmoothKey = Omit<CamKey, 'ease'> & {
  /** the rig comes to a full stop on this key (zero velocity) */
  stop?: boolean;
};

/**
 * Cubic Hermite interpolation *in time* with Catmull-Rom tangents computed on
 * the real key spacing: position, look-at target, lens and focus all move with
 * continuous velocity — no speed jumps between segments, natural acceleration
 * from rest and deceleration into rest (first/last key, or `stop` keys).
 */
export const camSmooth = (frame: number, keys: SmoothKey[], handheld = 0): CamState => {
  const n = keys.length;
  const f = Math.min(Math.max(frame, keys[0].f), keys[n - 1].f);
  let i = 0;
  while (i < n - 2 && f > keys[i + 1].f) i++;
  const k0 = keys[i];
  const k1 = keys[Math.min(i + 1, n - 1)];
  const dt = Math.max(1, k1.f - k0.f);
  const u = clamp((f - k0.f) / dt);
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1;
  const h10 = u ** 3 - 2 * u ** 2 + u;
  const h01 = -2 * u ** 3 + 3 * u ** 2;
  const h11 = u ** 3 - u ** 2;
  const tangent = (j: number, get: (k: SmoothKey) => number) => {
    const k = keys[j];
    if (j === 0 || j === n - 1 || k.stop) return 0;
    return (get(keys[j + 1]) - get(keys[j - 1])) / (keys[j + 1].f - keys[j - 1].f);
  };
  const ch = (get: (k: SmoothKey) => number) =>
    h00 * get(k0) + h10 * dt * tangent(i, get) + h01 * get(k1) + h11 * dt * tangent(Math.min(i + 1, n - 1), get);
  const pos: V3 = [ch((k) => k.pos[0]), ch((k) => k.pos[1]), ch((k) => k.pos[2])];
  const target: V3 = [ch((k) => k.target[0]), ch((k) => k.target[1]), ch((k) => k.target[2])];
  if (handheld > 0) {
    pos[0] += (noise1(frame / 90, 1) - 0.5) * handheld;
    pos[1] += (noise1(frame / 110, 2) - 0.5) * handheld;
  }
  const {yaw, pitch} = lookAt(pos, target);
  return {
    x: pos[0],
    y: pos[1],
    z: pos[2],
    yaw,
    pitch,
    roll: ch((k) => k.roll ?? 0),
    lens: ch((k) => k.lens ?? 35),
    focus: ch((k) => k.focus ?? dist(k.pos, k.target)),
    aperture: Math.max(0, ch((k) => k.aperture ?? 1)),
  };
};
