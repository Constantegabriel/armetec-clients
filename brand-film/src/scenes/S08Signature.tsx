import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {camPath} from '../animations/camera';
import {LightStreak} from '../components/Light';
import {SYMBOL_PATH, WORDMARK_ARME_PATH, WORDMARK_TEC_PATH} from '../config/brand-paths.generated';
import {BRAND} from '../config/brand';
import {COLORS, FONTS} from '../config/theme';
import {pathToShapes} from '../three/fontShapes';
import {Stage} from '../three/Stage';
import {EASE} from '../utils/easing';
import {useLayout} from '../utils/layout';
import {beat, prog, sec} from '../utils/time';

/**
 * SCENE 08 — signature. Everything dims, a line of light crosses the frame and
 * discovers the official ArmeTec symbol (vectorised from the supplied logo and
 * extruded in brushed metal), then the wordmark is unmasked by the light and
 * the slogan settles. Ends on absolute black.
 */
const FADE = beat('s08_fade');
const LINE = beat('s08_lightLine');
const LOGO = beat('s08_logo');
const SLOGAN = beat('s08_slogan');
const BLACK = beat('s08_black');
const END = sec(70);

const useSymbolGeometry = () =>
  useMemo(() => {
    const shapes = pathToShapes(SYMBOL_PATH.d, 0.01);
    const g = new THREE.ExtrudeGeometry(shapes, {depth: 0.5, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.05, bevelSegments: 5, curveSegments: 24});
    g.computeBoundingBox();
    const bb = g.boundingBox!;
    g.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -(bb.min.z + bb.max.z) / 2);
    g.computeVertexNormals();
    return g;
  }, []);

const symbolMats = (() => {
  let m: [THREE.Material, THREE.Material] | null = null;
  return () =>
    (m ??= [
      new THREE.MeshPhysicalMaterial({color: '#f2f2f5', metalness: 1, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05}),
      new THREE.MeshPhysicalMaterial({color: '#9aa6ff', metalness: 1, roughness: 0.25}),
    ]);
})();

const Symbol3D: React.FC<{f: number; scale: number}> = ({f, scale}) => {
  const geo = useSymbolGeometry();
  const a = prog(f, LINE, LOGO + 50, EASE.out);
  // the symbol settles with a precise, damped quarter-turn of its own orbit (not a spin)
  const rotZ = (1 - EASE.out(prog(f, LINE, LOGO + 70, EASE.linear))) * 0.5;
  const tilt = (1 - a) * 0.9;
  return (
    <mesh geometry={geo} material={symbolMats()} rotation={[tilt * 0.4, -tilt, rotZ]} scale={scale * (0.92 + 0.08 * a)} position={[0, 0, (1 - a) * -2]} />
  );
};

const Wordmark: React.FC<{reveal: number; height: number}> = ({reveal, height}) => {
  const W = WORDMARK_ARME_PATH.width + WORDMARK_TEC_PATH.width;
  const H = WORDMARK_ARME_PATH.height;
  const w = (W / H) * height;
  return (
    <div style={{width: w, height, position: 'relative', clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`}}>
      <svg viewBox={`0 0 ${W} ${H}`} width={w} height={height} style={{overflow: 'visible'}}>
        <defs>
          <linearGradient id="wm-sheen" x1="0" x2="1" y1="0" y2="0">
            <stop offset={Math.max(0, reveal - 0.2)} stopColor="#ffffff" stopOpacity={0} />
            <stop offset={reveal} stopColor="#ffffff" stopOpacity={0.9} />
            <stop offset={Math.min(1, reveal + 0.02)} stopColor="#ffffff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={WORDMARK_ARME_PATH.d} fill={COLORS.white} fillRule="evenodd" />
        <path d={WORDMARK_TEC_PATH.d} fill={BRAND.accent} fillRule="evenodd" transform={`translate(${WORDMARK_ARME_PATH.width},0)`} />
      </svg>
    </div>
  );
};

export const S08Signature: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame() + from;
  const L = useLayout();
  const s = L.u;
  const v = L.vertical;
  const cam = camPath(f, [
    {f: FADE, pos: [180, -80, 1500], target: [0, 0, 0], lens: 50, aperture: 0.3},
    {f: END, pos: [0, 0, 1180], target: [0, 0, 0], lens: 50, aperture: 0.3, ease: EASE.out},
  ]);
  const lightSweep = prog(f, LINE - 4, LOGO + 40, EASE.inOut);
  const dim = 1 - prog(f, BLACK, END - 6, EASE.inOut);
  const wordReveal = EASE.inOut(prog(f, LOGO + 4, LOGO + 44, EASE.linear));
  const sloganIn = prog(f, SLOGAN, SLOGAN + 50, EASE.out);
  const symY = v ? -150 : -150;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{opacity: dim}}>
        <AbsoluteFill style={{transform: `translateY(${symY * s}px)`}}>
          <Stage cam={cam} background="#000" envIntensity={0.25 + lightSweep * 0.5} exposure={1}>
            {/* a single raking light travels across — the symbol is discovered by its reflections */}
            <spotLight position={[-8 + lightSweep * 16, 1.5, 4]} angle={0.5} penumbra={1} intensity={lightSweep > 0 ? 110 : 0} decay={1.3} />
            <directionalLight position={[0, 6, -6]} intensity={1.6} color="#c9d2ff" />
            <pointLight position={[0, 0, 3]} intensity={prog(f, LOGO, LOGO + 60) * 8} color={COLORS.accent} decay={1.5} />
            <Symbol3D f={f} scale={(v ? 0.2 : 0.17)} />
          </Stage>
        </AbsoluteFill>
        <LightStreak progress={EASE.out(prog(f, LINE - 8, LINE + 34, EASE.linear))} fade={1 - prog(f, LOGO + 30, LOGO + 90)} y={(v ? 150 : 140) * s} intensity={1.2} />
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <div style={{position: 'absolute', transform: `translateY(${(v ? 150 : 140) * s}px)`}}>
            <Wordmark reveal={wordReveal} height={(v ? 118 : 120) * s} />
          </div>
          <div
            style={{
              position: 'absolute',
              transform: `translateY(${(v ? 290 : 270) * s}px)`,
              fontFamily: FONTS.sans,
              fontSize: (v ? 38 : 36) * s,
              fontWeight: 400,
              letterSpacing: `${0.16 - sloganIn * 0.1}em`,
              color: COLORS.white,
              opacity: sloganIn * 0.92,
              filter: sloganIn < 0.98 ? `blur(${(1 - sloganIn) * 8}px)` : undefined,
              whiteSpace: 'nowrap',
            }}
          >
            Tecnologia que devolve o seu <span style={{color: COLORS.white, fontWeight: 600}}>tempo</span>.
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
