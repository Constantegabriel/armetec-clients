import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useInstanced} from './instancing';
import {MAT} from './materials';

/**
 * Haute-horlogerie skeleton timepiece, built procedurally (1 unit = 100px).
 * Dial radius 4, faces +Z. Layers (back → front):
 *   movement plate · rotating gear train with ruby jewels · open star bridge
 *   (sandblasted, faceted) · inclined rehaut with engraved track and applied
 *   indices · polished case with crenellated bezel · faceted hands.
 * `time` = clock time in seconds.
 */
export type ClockProps = {
  time: number;
  /** seconds-hand step mode (mechanical tick with overshoot) */
  ticking?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
};

const R = 4;

const store = new Map<string, THREE.Material>();
function cached<T extends THREE.Material>(k: string, f: () => T): T {
  if (!store.has(k)) store.set(k, f());
  return store.get(k) as T;
}
const M = {
  sandblast: () => cached('sandblast', () => new THREE.MeshPhysicalMaterial({color: '#232327', metalness: 0.8, roughness: 0.66, clearcoat: 0.15})),
  darkSteel: () => cached('darkSteel', () => new THREE.MeshPhysicalMaterial({color: '#5a5a62', metalness: 1, roughness: 0.28})),
  plate: () => cached('plate', () => new THREE.MeshPhysicalMaterial({color: '#060607', metalness: 0.5, roughness: 0.75})),
  gear: () => cached('gear', () => new THREE.MeshPhysicalMaterial({color: '#6c6c74', metalness: 1, roughness: 0.38})),
  ruby: () =>
    cached('ruby', () => new THREE.MeshPhysicalMaterial({color: '#6d1d55', metalness: 0, roughness: 0.05, clearcoat: 1, emissive: new THREE.Color('#2a0420'), emissiveIntensity: 0.6})),
  rehaut: () => cached('rehaut', () => new THREE.MeshPhysicalMaterial({color: '#26262a', metalness: 0.9, roughness: 0.5})),
  engrave: () => cached('engrave', () => new THREE.MeshStandardMaterial({color: '#050506', metalness: 0.2, roughness: 0.9})),
};

/* ------------------------------- geometry -------------------------------- */

const lathe = (pts: number[][], seg = 256) => {
  const g = new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(r, h)), seg);
  g.rotateX(Math.PI / 2);
  return g;
};

/** Gear wheel with teeth and spoked cut-outs. */
const gearGeometry = (r: number, teeth: number, thick: number, spokes = 4) => {
  const s = new THREE.Shape();
  const tooth = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * tooth;
    const pts: Array<[number, number]> = [
      [r * 0.93, a],
      [r, a + tooth * 0.18],
      [r, a + tooth * 0.5],
      [r * 0.93, a + tooth * 0.68],
    ];
    pts.forEach(([rr, aa], k) => {
      const x = Math.cos(aa) * rr;
      const y = Math.sin(aa) * rr;
      if (i === 0 && k === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    });
  }
  s.closePath();
  for (let k = 0; k < spokes; k++) {
    const a0 = (k / spokes) * Math.PI * 2 + 0.22;
    const a1 = ((k + 1) / spokes) * Math.PI * 2 - 0.22;
    const h = new THREE.Path();
    h.absarc(0, 0, r * 0.78, a0, a1, false);
    h.absarc(0, 0, r * 0.28, a1, a0, true);
    h.closePath();
    s.holes.push(h);
  }
  return new THREE.ExtrudeGeometry(s, {depth: thick, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1, curveSegments: 6});
};

/** Open, faceted star arm (kite with hollow centre). */
const armGeometry = () => {
  const L = 3.35;
  const W = 0.62;
  const s = new THREE.Shape();
  s.moveTo(0, 0.25);
  s.lineTo(W / 2, L * 0.42);
  s.lineTo(0.12, L);
  s.lineTo(-0.12, L);
  s.lineTo(-W / 2, L * 0.42);
  s.closePath();
  const h = new THREE.Path();
  h.moveTo(0, 0.95);
  h.lineTo(-W * 0.26, L * 0.44);
  h.lineTo(-0.05, L * 0.86);
  h.lineTo(0.05, L * 0.86);
  h.lineTo(W * 0.26, L * 0.44);
  h.closePath();
  s.holes.push(h);
  return new THREE.ExtrudeGeometry(s, {depth: 0.16, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.06, bevelSegments: 1});
};

/** Long faceted sword hand (single bevel segment → crisp facets catch light). */
const handGeometry = (length: number, width: number, tail: number, thick: number) => {
  const s = new THREE.Shape();
  s.moveTo(-width * 0.3, -tail);
  s.lineTo(width * 0.3, -tail);
  s.lineTo(width / 2, length * 0.12);
  s.lineTo(width * 0.16, length * 0.92);
  s.lineTo(0, length);
  s.lineTo(-width * 0.16, length * 0.92);
  s.lineTo(-width / 2, length * 0.12);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, {depth: thick, bevelEnabled: true, bevelThickness: thick * 0.9, bevelSize: width * 0.22, bevelSegments: 1});
};

/* -------------------------------- parts ---------------------------------- */

const GEARS = [
  {x: 1.6, y: -1.3, r: 1.25, teeth: 72, speed: 0.6, z: -0.5},
  {x: -1.9, y: -1.1, r: 0.95, teeth: 54, speed: -0.9, z: -0.42},
  {x: -0.6, y: 2.0, r: 1.1, teeth: 60, speed: 0.75, z: -0.46},
  {x: 2.2, y: 1.3, r: 0.7, teeth: 40, speed: -1.4, z: -0.38},
  {x: 0.4, y: -2.6, r: 0.55, teeth: 30, speed: 2.1, z: -0.34},
  {x: -2.6, y: 1.0, r: 0.5, teeth: 28, speed: -2.4, z: -0.36},
];

const Movement: React.FC<{t: number}> = ({t}) => {
  const plate = useMemo(() => new THREE.CircleGeometry(R - 0.2, 128), []);
  const gears = useMemo(() => GEARS.map((g) => gearGeometry(g.r, g.teeth, 0.06, g.r > 0.8 ? 5 : 4)), []);
  const jewel = useMemo(() => new THREE.SphereGeometry(0.075, 32, 16), []);
  const chaton = useMemo(() => new THREE.TorusGeometry(0.1, 0.035, 12, 48), []);
  const jewels: Array<[number, number, number]> = [
    ...GEARS.map((g) => [g.x, g.y, g.z + 0.1] as [number, number, number]),
    [-1.2, -2.4, -0.3],
    [2.6, -0.2, -0.3],
  ];
  return (
    <group>
      <mesh geometry={plate} material={M.plate()} position={[0, 0, -0.62]} receiveShadow />
      {GEARS.map((g, i) => (
        <mesh key={i} geometry={gears[i]} material={M.gear()} position={[g.x, g.y, g.z]} rotation={[0, 0, t * g.speed * 0.2]} castShadow receiveShadow />
      ))}
      {jewels.map((p, i) => (
        <group key={i} position={p}>
          <mesh geometry={chaton} material={MAT.steel()} />
          <mesh geometry={jewel} material={M.ruby()} scale={[1, 1, 0.55]} />
        </group>
      ))}
    </group>
  );
};

const StarBridge: React.FC = () => {
  const arm = useMemo(() => armGeometry(), []);
  const hub = useMemo(() => lathe([[0.0, 0.42], [0.22, 0.42], [0.34, 0.3], [0.42, 0.05], [0.42, -0.05]], 96), []);
  const jewel = useMemo(() => new THREE.SphereGeometry(0.11, 32, 16), []);
  return (
    <group position={[0, 0, -0.05]}>
      {Array.from({length: 5}, (_, i) => (
        <mesh key={i} geometry={arm} material={M.sandblast()} rotation={[0, 0, (i / 5) * Math.PI * 2 + 0.3]} castShadow receiveShadow />
      ))}
      <mesh geometry={hub} material={MAT.steel()} castShadow />
      <mesh geometry={jewel} material={M.ruby()} position={[0, 0, 0.44]} scale={[1, 1, 0.5]} />
    </group>
  );
};

const mkRing = (n: number, r: number, z: number, slope: number, skip?: (i: number) => boolean) => {
  const out: THREE.Matrix4[] = [];
  for (let i = 0; i < n; i++) {
    if (skip?.(i)) continue;
    const a = (i / n) * Math.PI * 2;
    out.push(
      new THREE.Matrix4()
        .makeRotationZ(-a)
        .multiply(new THREE.Matrix4().makeTranslation(0, r, z))
        .multiply(new THREE.Matrix4().makeRotationX(-slope)),
    );
  }
  return out;
};

const Rehaut: React.FC = () => {
  const ring = useMemo(() => lathe([[3.32, 0.02], [3.36, 0.06], [R - 0.02, 0.5], [R + 0.02, 0.52]], 256), []);
  const markGeo = useMemo(() => new THREE.BoxGeometry(0.035, 0.24, 0.02), []);
  const idxGeo = useMemo(() => new THREE.BoxGeometry(0.11, 0.42, 0.09), []);
  const slope = Math.atan2(0.44, R - 3.36);
  const marks = useMemo(() => mkRing(60, 3.66, 0.27, slope, (i) => i % 5 === 0), [slope]);
  const idx = useMemo(() => mkRing(12, 3.62, 0.3, slope), [slope]);
  const mInst = useInstanced(markGeo, M.engrave(), marks);
  const iInst = useInstanced(idxGeo, MAT.steel(), idx, true);
  return (
    <group>
      <mesh geometry={ring} material={M.rehaut()} receiveShadow />
      <primitive object={mInst} />
      <primitive object={iInst} />
    </group>
  );
};

const Case: React.FC = () => {
  const bezel = useMemo(
    () =>
      lathe([
        [R + 0.02, 0.52],
        [R + 0.12, 0.72],
        [R + 0.34, 0.82],
        [R + 0.6, 0.74],
        [R + 0.8, 0.5],
        [R + 0.9, 0.1],
        [R + 0.88, -0.5],
        [R + 0.7, -0.9],
        [R - 0.4, -0.92],
      ]),
    [],
  );
  const notchGeo = useMemo(() => new THREE.BoxGeometry(0.34, 0.5, 0.6), []);
  const notches = useMemo(
    () =>
      Array.from({length: 12}, (_, i) =>
        new THREE.Matrix4().makeRotationZ((i / 12) * Math.PI * 2 + Math.PI / 12).multiply(new THREE.Matrix4().makeTranslation(0, R + 0.82, 0.1)),
      ),
    [],
  );
  const nInst = useInstanced(notchGeo, M.plate(), notches);
  const crystal = useMemo(() => new THREE.CircleGeometry(R + 0.1, 128), []);
  const crystalMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#ffffff', metalness: 0, roughness: 0.02, transparent: true, opacity: 0.05, clearcoat: 1}), []);
  return (
    <group>
      <mesh geometry={bezel} material={MAT.darkMetal()} castShadow receiveShadow />
      <primitive object={nInst} />
      <mesh geometry={crystal} material={crystalMat} position={[0, 0, 0.8]} />
    </group>
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
  const hourHand = useMemo(() => handGeometry(2.3, 0.3, 0.5, 0.05), []);
  const minuteHand = useMemo(() => handGeometry(3.45, 0.24, 0.6, 0.05), []);
  const secondGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(0.022, 4.3, 0.02);
    g.translate(0, 1.45, 0);
    return g;
  }, []);
  const cap = useMemo(() => lathe([[0, 0.16], [0.14, 0.16], [0.2, 0.08], [0.2, 0]], 64), []);

  const sec = ticking ? tickAngle(time) : time;
  const aSec = -(sec / 60) * Math.PI * 2;
  const aMin = -(time / 3600) * Math.PI * 2;
  const aHour = -(time / 43200) * Math.PI * 2;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Movement t={time} />
      <StarBridge />
      <Rehaut />
      <Case />
      <mesh geometry={hourHand} material={M.darkSteel()} rotation={[0, 0, aHour]} position={[0, 0, 0.48]} castShadow />
      <mesh geometry={minuteHand} material={MAT.steel()} rotation={[0, 0, aMin]} position={[0, 0, 0.6]} castShadow />
      <mesh geometry={secondGeo} material={MAT.accent()} rotation={[0, 0, aSec]} position={[0, 0, 0.72]} castShadow />
      <mesh geometry={cap} material={MAT.steel()} position={[0, 0, 0.7]} castShadow />
    </group>
  );
};
