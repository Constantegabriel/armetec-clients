import * as THREE from 'three';
import type {CamState} from '../components/CssWorld';
import {focalToFov} from '../config/camera';

/** 1 three.js unit = 100 CSS px. Shared by the WebGL and DOM layers. */
export const PX = 100;

/** Apply a CSS-world camera to a three.js PerspectiveCamera (same lens, same space). */
export const applyCam = (camera: THREE.PerspectiveCamera, cam: CamState, aspect: number) => {
  camera.position.set(cam.x / PX, -cam.y / PX, cam.z / PX);
  const d = Math.PI / 180;
  camera.rotation.set(-(cam.pitch ?? 0) * d, (cam.yaw ?? 0) * d, -(cam.roll ?? 0) * d, 'YXZ');
  camera.fov = focalToFov(cam.lens ?? 35, aspect);
  camera.aspect = aspect;
  camera.near = 0.05;
  camera.far = 400;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
};

/** CSS px position -> three.js vector */
export const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x / PX, -y / PX, z / PX);

/** Yaw/pitch (deg) that aim a camera at `target` from `pos` (CSS px coordinates). */
export const lookAt = (pos: [number, number, number], target: [number, number, number]) => {
  const dx = target[0] - pos[0];
  const dy = target[1] - pos[1];
  const dz = target[2] - pos[2];
  // forward(yaw,pitch) = (-sin yaw·cos pitch, sin pitch, -cos yaw·cos pitch) in CSS space (y down)
  const yaw = (Math.atan2(-dx, -dz) * 180) / Math.PI;
  const pitch = (Math.atan2(dy, Math.hypot(dx, dz)) * 180) / Math.PI;
  return {yaw, pitch};
};
