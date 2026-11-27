import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {COLORS} from '../config/theme';
import {EASE} from '../utils/easing';
import {clamp, lerp} from '../utils/math';
import {hash01} from '../utils/random';
import type {TextOutline} from './fontShapes';

/**
 * Samples N points inside an outline (the exact same path used for the extruded
 * mesh) so geometry can dissolve into segments and re-form as another word.
 */
export const sampleOutline = (o: TextOutline, n: number, salt: number): Array<[number, number]> => {
  const pad = 4;
  const W = Math.ceil(o.width + pad * 2);
  const H = Math.ceil(o.height + pad * 2);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.translate(W / 2, H / 2);
  g.fillStyle = '#fff';
  g.fill(new Path2D(o.d));
  const data = g.getImageData(0, 0, W, H).data;
  const inside: Array<[number, number]> = [];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4] > 128) inside.push([x - W / 2, y - H / 2]);
  const out: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) out.push(inside[Math.floor(hash01(i, salt) * inside.length)] ?? [0, 0]);
  // sort left→right so the reorganisation reads as a wave
  return out.sort((a, b) => a[0] - b[0]);
};

type Props = {
  from: TextOutline;
  to: TextOutline;
  /** 0 = on `from`, 1 = on `to` */
  t: number;
  /** 0..1 outward burst amount (peaks mid-way) */
  count?: number;
  fromScale?: number;
  toScale?: number;
  depth?: number;
  visible: boolean;
};

export const ParticleMorph: React.FC<Props> = ({from, to, t, count = 2400, fromScale = 1, toScale = 1, depth = 120, visible}) => {
  const a = useMemo(() => sampleOutline(from, count, 3), [from, count]);
  const b = useMemo(() => sampleOutline(to, count, 7), [to, count]);
  const mesh = useMemo(() => {
    const geo = new THREE.BoxGeometry(0.16, 0.05, 0.22);
    const mat = new THREE.MeshPhysicalMaterial({color: '#dcdce2', metalness: 1, roughness: 0.18});
    const m = new THREE.InstancedMesh(geo, mat, count);
    m.frustumCulled = false;
    const accent = new THREE.Color(COLORS.accent);
    const steel = new THREE.Color('#e4e4e7');
    for (let i = 0; i < count; i++) m.setColorAt(i, hash01(i, 21) < 0.14 ? accent : steel);
    m.instanceColor!.needsUpdate = true;
    return m;
  }, [count]);

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const r = (k: number) => hash01(i, k);
      // wave: left particles leave first
      const delay = (i / count) * 0.35;
      const k = clamp((t - delay) / 0.65);
      const e = EASE.inOut(k);
      const burst = Math.sin(k * Math.PI);
      const ax = a[i][0] * fromScale;
      const ay = a[i][1] * fromScale;
      const az = (r(1) - 0.5) * depth;
      const bx = b[i][0] * toScale;
      const by = b[i][1] * toScale;
      const bz = (r(2) - 0.5) * depth * 0.6;
      const ang = r(3) * Math.PI * 2;
      const rad = 120 + r(4) * 520;
      const x = lerp(ax, bx, e) + Math.cos(ang) * rad * burst;
      const y = lerp(ay, by, e) + Math.sin(ang) * rad * burst * 0.7;
      const z = lerp(az, bz, e) + (r(5) - 0.3) * 900 * burst;
      o.position.set(x / 100, -y / 100, z / 100);
      o.rotation.set(r(6) * 6 * burst + e * 0, r(7) * 6 * burst, (r(8) - 0.5) * 3 * burst);
      const s = 0.6 + 0.6 * r(9);
      o.scale.set(s, s, s);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  return <primitive object={mesh} visible={visible} />;
};
