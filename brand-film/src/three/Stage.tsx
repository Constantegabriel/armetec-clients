import {useThree, useFrame} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {BokehPass} from 'three/examples/jsm/postprocessing/BokehPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import type {CamState} from '../components/CssWorld';
import {EFFECTS} from '../config/effects';
import {useLayout} from '../utils/layout';
import {applyCam, PX} from './cameraRig';

/** Drives the R3F default camera from a CSS-world camera state. */
const CamDriver: React.FC<{cam: CamState}> = ({cam}) => {
  const {camera, size} = useThree();
  useLayoutEffect(() => {
    applyCam(camera as THREE.PerspectiveCamera, cam, size.width / size.height);
  });
  return null;
};

/** Studio reflections: procedural room environment (no external HDR needed). */
const StudioEnvironment: React.FC<{intensity: number}> = ({intensity}) => {
  const {gl, scene} = useThree();
  const env = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return tex;
  }, [gl]);
  useLayoutEffect(() => {
    scene.environment = env;
    scene.environmentIntensity = intensity;
  });
  return null;
};

/** Cinematic depth of field (bokeh) as a post pass. */
const DepthOfField: React.FC<{focus: number; aperture: number; maxBlur: number}> = ({focus, aperture, maxBlur}) => {
  const {gl, scene, camera, size} = useThree();
  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new BokehPass(scene, camera, {focus: 10, aperture: 0.002, maxblur: 0.01}));
    c.addPass(new OutputPass());
    return c;
  }, [gl, scene, camera]);
  useLayoutEffect(() => {
    composer.setPixelRatio(1);
    composer.setSize(size.width, size.height);
  }, [composer, size.width, size.height]);
  useLayoutEffect(() => {
    const bokeh = composer.passes[1] as BokehPass;
    const u = (bokeh as unknown as {uniforms: Record<string, {value: number}>}).uniforms;
    u.focus.value = focus / PX;
    u.aperture.value = aperture;
    u.maxblur.value = maxBlur;
  });
  useFrame(() => {
    composer.render();
  }, 1);
  return null;
};

export type StageProps = {
  cam: CamState;
  children: React.ReactNode;
  /** scene background; null = transparent canvas (composited over the DOM) */
  background?: string | null;
  fog?: {color: string; near: number; far: number} | null;
  envIntensity?: number;
  exposure?: number;
  /** bokeh DOF; aperture ~ 0.0005..0.01 */
  dof?: {aperture: number; maxBlur?: number} | null;
  style?: React.CSSProperties;
};

const SceneSetup: React.FC<{background: string | null; fog: StageProps['fog']}> = ({background, fog}) => {
  const {scene} = useThree();
  useLayoutEffect(() => {
    scene.background = background ? new THREE.Color(background) : null;
    scene.fog = fog ? new THREE.Fog(fog.color, fog.near / PX, fog.far / PX) : null;
  }, [scene, background, fog?.color, fog?.near, fog?.far]);
  return null;
};

export const Stage: React.FC<StageProps> = ({
  cam,
  children,
  background = '#050505',
  fog = null,
  envIntensity = 0.6,
  exposure = 1,
  dof = null,
  style,
}) => {
  const {width, height} = useLayout();
  const useDof = !!dof && EFFECTS.webglDof && !!background;
  return (
    <ThreeCanvas
      width={width}
      height={height}
      style={{position: 'absolute', inset: 0, ...style}}
      dpr={1}
      shadows
      gl={{
        antialias: true,
        alpha: !background,
        preserveDrawingBuffer: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: exposure,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
    >
      <SceneSetup background={background} fog={fog} />
      <CamDriver cam={cam} />
      <StudioEnvironment intensity={envIntensity} />
      {children}
      {useDof ? <DepthOfField focus={cam.focus ?? 1400} aperture={dof!.aperture} maxBlur={dof!.maxBlur ?? 0.012} /> : null}
    </ThreeCanvas>
  );
};
