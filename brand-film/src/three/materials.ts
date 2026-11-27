import * as THREE from 'three';
import {COLORS} from '../config/theme';
import {hash01} from '../utils/random';

/** Circular-grained "côtes circulaires" texture for the watch dial (deterministic). */
const dialTexture = (() => {
  let tex: THREE.CanvasTexture | null = null;
  return () => {
    if (tex) return tex;
    const s = 1024;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d')!;
    g.fillStyle = '#7a7a7a';
    g.fillRect(0, 0, s, s);
    for (let r = 2; r < s * 0.72; r += 1.5) {
      const v = 100 + hash01(Math.floor(r * 3), 11) * 70;
      g.strokeStyle = `rgb(${v},${v},${v})`;
      g.lineWidth = 1;
      g.beginPath();
      g.arc(s / 2, s / 2, r, 0, Math.PI * 2);
      g.stroke();
    }
    tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.NoColorSpace;
    tex.anisotropy = 8;
    return tex;
  };
})();

const cache = new Map<string, THREE.Material>();
const make = <T extends THREE.Material>(key: string, f: () => T): T => {
  if (!cache.has(key)) cache.set(key, f());
  return cache.get(key) as T;
};

export const MAT = {
  /** Dark polished case metal */
  darkMetal: () =>
    make('darkMetal', () => new THREE.MeshPhysicalMaterial({color: '#1d1d20', metalness: 1, roughness: 0.24, clearcoat: 0.4, clearcoatRoughness: 0.2})),
  /** Brushed graphite for dials and plates */
  dial: () =>
    make('dial', () => {
      const t = dialTexture();
      return new THREE.MeshPhysicalMaterial({color: '#0c0c0e', metalness: 0.85, roughness: 0.42, roughnessMap: t, bumpMap: t, bumpScale: 0.6});
    }),
  /** Polished steel highlights (indices, hands) */
  steel: () => make('steel', () => new THREE.MeshPhysicalMaterial({color: '#e4e4e7', metalness: 1, roughness: 0.13})),
  /** Satin light face for readable typography */
  satinWhite: () =>
    make('satinWhite', () => new THREE.MeshPhysicalMaterial({color: '#e9e9ec', metalness: 0.55, roughness: 0.22, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.1, clearcoat: 1, clearcoatRoughness: 0.1})),
  /** Graphite metal for extrusion sides */
  sideMetal: () => make('sideMetal', () => new THREE.MeshPhysicalMaterial({color: '#2a2a2e', metalness: 1, roughness: 0.3})),
  /** Brand accent (seconds hand, key highlights) */
  accent: () =>
    make('accent', () => new THREE.MeshStandardMaterial({color: COLORS.accent, metalness: 0.3, roughness: 0.3, emissive: new THREE.Color(COLORS.accent), emissiveIntensity: 0.8})),
  /** Readable dark-steel face for monumental words */
  graphiteFace: () =>
    make('graphiteFace', () => new THREE.MeshPhysicalMaterial({color: '#8a8a93', metalness: 0.9, roughness: 0.32, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.05, clearcoat: 1, clearcoatRoughness: 0.15})),
  /** Black anodised metal (monumental type) */
  blackMetal: () => make('blackMetal', () => new THREE.MeshPhysicalMaterial({color: '#141416', metalness: 1, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08})),
};
