import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useInstanced} from './instancing';
import {MAT} from './materials';

/**
 * Minimal luxury timepiece, built procedurally (1 unit = 100px).
 * Dial radius 4, faces +Z. `time` = clock time in seconds.
 */
export type ClockProps = {
  time: number;
  /** seconds-hand step mode (mechanical tick with overshoot) */
  ticking?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  /** 0..1: dims indices/hands (used while the light reveal happens) */
  presence?: number;
};

const R = 4;

const useCaseGeometry = () =>
  useMemo(() => {
    const prof = [
      [R - 0.02, -0.02],
      [R + 0.02, 0.18],
      [R + 0.12, 0.34],
      [R + 0.3, 0.38],
      [R + 0.46, 0.33],
      [R + 0.58, 0.16],
      [R + 0.62, -0.1],
      [R + 0.6, -0.6],
      [R - 0.3, -0.62],
    ].map(([r, h]) => new THREE.Vector2(r, h));
    const g = new THREE.LatheGeometry(prof, 256);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);

/** Tapered hand outline extruded with a soft bevel. */
const handGeometry = (length: number, width: number, tail: number, thick: number) => {
  const s = new THREE.Shape();
  s.moveTo(-width * 0.35, -tail);
  s.lineTo(width * 0.35, -tail);
  s.lineTo(width / 2, 0);
  s.lineTo(width * 0.18, length);
  s.lineTo(0, length + width * 0.25);
  s.lineTo(-width * 0.18, length);
  s.lineTo(-width / 2, 0);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {depth: thick, bevelEnabled: true, bevelThickness: thick * 0.35, bevelSize: width * 0.12, bevelSegments: 4});
  return g;
};

const Indices: React.FC = () => {
  const {minute, hour} = useMemo(() => {
    const minute: THREE.Matrix4[] = [];
    const hour: THREE.Matrix4[] = [];
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const m = new THREE.Matrix4().makeRotationZ(-a);
      if (i % 5 === 0) {
        const r = 3.28;
        if (i === 0) {
          hour.push(m.clone().multiply(new THREE.Matrix4().makeTranslation(-0.11, r, 0.06)));
          hour.push(m.clone().multiply(new THREE.Matrix4().makeTranslation(0.11, r, 0.06)));
        } else {
          hour.push(m.clone().multiply(new THREE.Matrix4().makeTranslation(0, r, 0.06)));
        }
      } else {
        minute.push(m.clone().multiply(new THREE.Matrix4().makeTranslation(0, 3.78, 0.02)));
      }
    }
    return {minute, hour};
  }, []);
  const minGeo = useMemo(() => new THREE.BoxGeometry(0.025, 0.2, 0.03), []);
  const hourGeo = useMemo(() => new THREE.BoxGeometry(0.1, 0.62, 0.1), []);
  const minInst = useInstanced(minGeo, MAT.steel(), minute, true);
  const hourInst = useInstanced(hourGeo, MAT.steel(), hour, true);
  return (
    <>
      <primitive object={minInst} />
      <primitive object={hourInst} />
    </>
  );
};

/** Mechanical seconds: snaps each second with a damped overshoot. */
const tickAngle = (t: number) => {
  const s = Math.floor(t);
  const f = t - s;
  const k = f < 0.12 ? 1 - Math.pow(1 - f / 0.12, 3) : 1;
  const overshoot = f < 0.4 ? Math.sin(Math.min(1, f / 0.4) * Math.PI) * 0.08 * (1 - f / 0.4) : 0;
  return s + k + overshoot;
};

export const Clock3D: React.FC<ClockProps> = ({time, ticking = false, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1}) => {
  const caseGeo = useCaseGeometry();
  const dialGeo = useMemo(() => new THREE.CircleGeometry(R + 0.05, 256), []);
  const hourHand = useMemo(() => handGeometry(2.15, 0.2, 0.45, 0.05), []);
  const minuteHand = useMemo(() => handGeometry(3.2, 0.15, 0.5, 0.05), []);
  const secondGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(0.035, 4.3, 0.03);
    g.translate(0, 1.45, 0);
    return g;
  }, []);
  const capGeo = useMemo(() => new THREE.CylinderGeometry(0.17, 0.19, 0.12, 64).rotateX(Math.PI / 2), []);
  const capAccent = useMemo(() => new THREE.CylinderGeometry(0.08, 0.08, 0.14, 48).rotateX(Math.PI / 2), []);
  const ring = useMemo(() => new THREE.RingGeometry(R - 0.32, R - 0.3, 256), []);

  const sec = ticking ? tickAngle(time) : time;
  const aSec = -(sec / 60) * Math.PI * 2;
  const aMin = -(time / 3600) * Math.PI * 2;
  const aHour = -(time / 43200) * Math.PI * 2;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={caseGeo} material={MAT.darkMetal()} castShadow receiveShadow />
      <mesh geometry={dialGeo} material={MAT.dial()} receiveShadow />
      <mesh geometry={ring} position={[0, 0, 0.005]} material={MAT.steel()} />
      <Indices />
      <mesh geometry={hourHand} material={MAT.steel()} rotation={[0, 0, aHour]} position={[0, 0, 0.1]} castShadow />
      <mesh geometry={minuteHand} material={MAT.steel()} rotation={[0, 0, aMin]} position={[0, 0, 0.2]} castShadow />
      <mesh geometry={secondGeo} material={MAT.accent()} rotation={[0, 0, aSec]} position={[0, 0, 0.3]} castShadow />
      <mesh geometry={capGeo} material={MAT.steel()} position={[0, 0, 0.3]} castShadow />
      <mesh geometry={capAccent} material={MAT.accent()} position={[0, 0, 0.33]} />
    </group>
  );
};
