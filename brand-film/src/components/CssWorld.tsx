import React, {createContext, useContext, useMemo} from 'react';
import {focalToPerspective} from '../config/camera';
import {EFFECTS} from '../config/effects';
import {clamp} from '../utils/math';
import {useLayout} from '../utils/layout';

/**
 * A physical-camera model for DOM content.
 * Units are CSS px, Y points down, the camera looks towards -Z.
 * Interfaces stay razor-sharp vector text while moving through real 3D space
 * with perspective, parallax, depth of field and near-plane fades.
 */
export type CamState = {
  x: number;
  y: number;
  z: number;
  /** degrees */
  yaw?: number;
  pitch?: number;
  roll?: number;
  /** focal length (mm, full-frame equivalent) */
  lens?: number;
  /** focus distance (px from camera) */
  focus?: number;
  /** 0 = pinhole, 1 = default cinematic shallow DOF */
  aperture?: number;
};

type Ctx = {
  cam: Required<CamState>;
  perspective: number;
  offset: [number, number, number];
};
const WorldCtx = createContext<Ctx | null>(null);

const D2R = Math.PI / 180;

/** World point -> camera-space depth (distance in front of the lens). */
const depthOf = (cam: Required<CamState>, x: number, y: number, z: number) => {
  let px = x - cam.x;
  const py = y - cam.y;
  let pz = z - cam.z;
  // rotateY(-yaw)
  const a = -cam.yaw * D2R;
  const rx = px * Math.cos(a) + pz * Math.sin(a);
  const rz = -px * Math.sin(a) + pz * Math.cos(a);
  px = rx;
  pz = rz;
  // rotateX(-pitch)
  const b = -cam.pitch * D2R;
  const z2 = py * Math.sin(b) + pz * Math.cos(b);
  return -z2;
};

export const CssWorld: React.FC<{cam: CamState; children: React.ReactNode; style?: React.CSSProperties}> = ({
  cam,
  children,
  style,
}) => {
  const {short} = useLayout();
  const full: Required<CamState> = {
    yaw: 0,
    pitch: 0,
    roll: 0,
    lens: 35,
    focus: 1400,
    aperture: 1,
    ...cam,
  };
  const perspective = focalToPerspective(full.lens, short);
  const ctx = useMemo(() => ({cam: full, perspective, offset: [0, 0, 0] as [number, number, number]}), [
    full.x,
    full.y,
    full.z,
    full.yaw,
    full.pitch,
    full.roll,
    full.lens,
    full.focus,
    full.aperture,
    perspective,
  ]);
  return (
    <div style={{position: 'absolute', inset: 0, perspective: `${perspective}px`, overflow: 'hidden', ...style}}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 0,
          height: 0,
          transformStyle: 'preserve-3d',
          transform: `translateZ(${perspective}px) rotateZ(${-full.roll}deg) rotateX(${-full.pitch}deg) rotateY(${-full.yaw}deg) translate3d(${-full.x}px, ${-full.y}px, ${-full.z}px)`,
        }}
      >
        <WorldCtx.Provider value={ctx}>{children}</WorldCtx.Provider>
      </div>
    </div>
  );
};

/** Camera basis vectors (CSS space) — place things relative to the lens. */
export const camBasis = (cam: CamState) => {
  const y = ((cam.yaw ?? 0) * Math.PI) / 180;
  const p = ((cam.pitch ?? 0) * Math.PI) / 180;
  const fwd: [number, number, number] = [-Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p)];
  const right: [number, number, number] = [Math.cos(y), 0, -Math.sin(y)];
  // screen-down direction (CSS y points down)
  const down: [number, number, number] = [
    right[1] * fwd[2] - right[2] * fwd[1],
    right[2] * fwd[0] - right[0] * fwd[2],
    right[0] * fwd[1] - right[1] * fwd[0],
  ];
  return {fwd, right, down};
};

export const useWorld = () => {
  const c = useContext(WorldCtx);
  if (!c) throw new Error('useWorld must be used inside <CssWorld>');
  return c;
};

type Transform = {x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number; scale?: number};

const tf = ({x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, scale = 1}: Transform) =>
  `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`;

/** Translation group (rotation is applied visually, depth math uses its origin). */
export const Group: React.FC<Transform & {children: React.ReactNode}> = ({children, ...t}) => {
  const parent = useWorld();
  const ctx = useMemo(
    () => ({...parent, offset: [parent.offset[0] + (t.x ?? 0), parent.offset[1] + (t.y ?? 0), parent.offset[2] + (t.z ?? 0)] as [number, number, number]}),
    [parent, t.x, t.y, t.z],
  );
  return (
    <div style={{position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d', transform: tf(t)}}>
      <WorldCtx.Provider value={ctx}>{children}</WorldCtx.Provider>
    </div>
  );
};

export type PlaneProps = Transform & {
  w: number;
  h: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  opacity?: number;
  /** disable depth-of-field for this plane */
  sharp?: boolean;
  /** extra blur (px), e.g. motion blur */
  blur?: number;
  /** fade out as the plane approaches the lens (fly-through) */
  nearFade?: number;
  /** always face the camera */
  billboard?: boolean;
};

/** A flat element in world space, centred on (x,y,z). */
export const Plane: React.FC<PlaneProps> = ({w, h, children, style, opacity = 1, sharp, blur = 0, nearFade = 260, billboard, ...t}) => {
  const {cam, offset} = useWorld();
  const depth = depthOf(cam, (t.x ?? 0) + offset[0], (t.y ?? 0) + offset[1], (t.z ?? 0) + offset[2]);
  if (depth < 20) return null;
  const coc = sharp ? 0 : cam.aperture * EFFECTS.dof * Math.abs(depth - cam.focus) / depth * 22;
  const b = Math.min(EFFECTS.maxDofBlur, coc) + blur;
  const near = clamp((depth - 40) / nearFade);
  const o = opacity * near;
  if (o <= 0.002) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: -w / 2,
        top: -h / 2,
        width: w,
        height: h,
        transform: billboard
          ? `translate3d(${t.x ?? 0}px, ${t.y ?? 0}px, ${t.z ?? 0}px) rotateY(${cam.yaw}deg) rotateX(${cam.pitch}deg) scale(${t.scale ?? 1})`
          : tf(t),
        opacity: o,
        // planes are one-sided (device back plates only show from behind)
        backfaceVisibility: 'hidden',
        filter: b > 0.35 ? `blur(${b.toFixed(2)}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
