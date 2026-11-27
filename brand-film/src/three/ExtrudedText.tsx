import React, {useMemo} from 'react';
import * as THREE from 'three';
import {FONT_3D} from '../config/theme';
import {useAsset} from '../utils/useAsset';
import {loadFont, pathToShapes, textOutline, type TextOutline} from './fontShapes';

export const useOutline = (text: string, size: number, tracking = 0, font = FONT_3D) =>
  useAsset<TextOutline>(`outline:${font}:${text}:${size}:${tracking}`, async () =>
    textOutline(await loadFont(font), text, size, tracking),
  );

/** Load several outlines at once (call OUTSIDE the <Stage>, then mount the stage when ready). */
export const useOutlines = (texts: string[], size: number, tracking = 0, font = FONT_3D) =>
  useAsset<TextOutline[]>(`outlines:${font}:${texts.join('|')}:${size}:${tracking}`, async () => {
    const f = await loadFont(font);
    return texts.map((t) => textOutline(f, t, size, tracking));
  });

export type ExtrudeOpts = {depth: number; bevel?: number; bevelSegments?: number; curveSegments?: number};

export const useExtruded = (outline: TextOutline | null, {depth, bevel = 0, bevelSegments = 3, curveSegments = 10}: ExtrudeOpts) =>
  useMemo(() => {
    if (!outline) return null;
    const shapes = pathToShapes(outline.d);
    const g = new THREE.ExtrudeGeometry(shapes, {
      depth: depth / 100,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel / 100,
      bevelSize: bevel / 100,
      bevelSegments,
      curveSegments,
    });
    g.translate(0, 0, -depth / 200);
    g.computeVertexNormals();
    return g;
  }, [outline, depth, bevel, bevelSegments, curveSegments]);

type Props = {
  outline: TextOutline;
  depth: number;
  bevel?: number;
  /** [face material, side material] */
  materials: [THREE.Material, THREE.Material];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
};

/** Extruded, bevelled 3D typography (position in CSS px, y down). */
export const ExtrudedText: React.FC<Props> = ({
  outline,
  depth,
  bevel = 0,
  materials,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  castShadow,
  receiveShadow,
}) => {
  const geo = useExtruded(outline, {depth, bevel});
  if (!geo) return null;
  return (
    <mesh
      geometry={geo}
      material={materials}
      position={[position[0] / 100, -position[1] / 100, position[2] / 100]}
      rotation={rotation}
      scale={scale}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  );
};
