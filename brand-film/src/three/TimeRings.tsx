import React, {useMemo} from 'react';
import * as THREE from 'three';
import {EASE} from '../utils/easing';
import {clamp} from '../utils/math';
import {useInstanced} from './instancing';
import {MAT} from './materials';

/** Concentric timeline rings with engraved ticks, orbiting the dial. */
const Ring: React.FC<{radius: number; ticks: number; tilt: [number, number]; spin: number; reveal: number}> = ({radius, ticks, tilt, spin, reveal}) => {
  const torus = useMemo(() => new THREE.TorusGeometry(radius, 0.018, 8, 360), [radius]);
  const tick = useMemo(() => new THREE.BoxGeometry(0.03, 0.22, 0.03), []);
  const matrices = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    for (let i = 0; i < ticks; i++) {
      const a = (i / ticks) * Math.PI * 2;
      const len = i % 5 === 0 ? 1.8 : 1;
      out.push(
        new THREE.Matrix4()
          .makeRotationZ(-a)
          .multiply(new THREE.Matrix4().makeTranslation(0, radius + 0.16 * len, 0))
          .multiply(new THREE.Matrix4().makeScale(1, len, 1)),
      );
    }
    return out;
  }, [ticks, radius]);
  const inst = useInstanced(tick, MAT.steel(), matrices);
  const s = 0.85 + 0.15 * EASE.out(reveal);
  if (reveal <= 0) return null;
  return (
    <group rotation={[tilt[0], tilt[1], spin]} scale={s}>
      <mesh geometry={torus} material={MAT.steel()} />
      <primitive object={inst} />
    </group>
  );
};

export const TimeRings: React.FC<{f: number; start: number}> = ({f, start}) => {
  const t = Math.max(0, f - start);
  const acc = (k: number) => 0.0004 * k * t * t;
  const r = (d: number) => clamp((f - start - d) / 40);
  return (
    <group position={[0, 0, -0.6]}>
      <Ring radius={5.6} ticks={120} tilt={[0.0, 0.0]} spin={-acc(1)} reveal={r(0)} />
      <Ring radius={7.4} ticks={60} tilt={[0.18, -0.12]} spin={acc(0.6)} reveal={r(40)} />
      <Ring radius={10} ticks={180} tilt={[-0.12, 0.22]} spin={-acc(0.35)} reveal={r(90)} />
      <Ring radius={13.5} ticks={240} tilt={[0.3, 0.1]} spin={acc(0.2)} reveal={r(150)} />
    </group>
  );
};
