import opentype from 'opentype.js';
import {staticFile} from 'remotion';
import * as THREE from 'three';
import {SVGLoader} from 'three/examples/jsm/loaders/SVGLoader.js';

const fontCache = new Map<string, Promise<opentype.Font>>();
export const loadFont = (file: string) => {
  if (!fontCache.has(file)) {
    fontCache.set(
      file,
      fetch(staticFile(file))
        .then((r) => r.arrayBuffer())
        .then((b) => opentype.parse(b)),
    );
  }
  return fontCache.get(file)!;
};

export type TextOutline = {
  /** SVG path data, origin at the text centre, y down, units = px at `size` */
  d: string;
  width: number;
  height: number;
  /** per-glyph boxes (same centred coordinates) */
  glyphs: Array<{ch: string; x1: number; x2: number; y1: number; y2: number}>;
};

/** Text -> centred outline path (per-glyph, kerned, optional tracking in em). */
export const textOutline = (font: opentype.Font, text: string, size: number, tracking = 0): TextOutline => {
  const glyphs = font.stringToGlyphs(text);
  const scale = size / font.unitsPerEm;
  let x = 0;
  const parts: opentype.Path[] = [];
  glyphs.forEach((g, i) => {
    parts.push(g.getPath(x, 0, size));
    x += (g.advanceWidth ?? 0) * scale;
    if (i < glyphs.length - 1) x += font.getKerningValue(g, glyphs[i + 1]) * scale + tracking * size;
  });
  const path = new opentype.Path();
  parts.forEach((p) => path.extend(p));
  const bb = path.getBoundingBox();
  const cx = (bb.x1 + bb.x2) / 2;
  const cy = (bb.y1 + bb.y2) / 2;
  const chars = Array.from(text);
  const glyphBoxes = parts.map((p, i) => {
    const b = p.getBoundingBox();
    return {ch: chars[i] ?? '', x1: b.x1 - cx, x2: b.x2 - cx, y1: b.y1 - cy, y2: b.y2 - cy};
  });
  path.commands.forEach((c) => {
    const cc = c as unknown as Record<string, number>;
    for (const k of ['x', 'x1', 'x2']) if (k in cc) cc[k] -= cx;
    for (const k of ['y', 'y1', 'y2']) if (k in cc) cc[k] -= cy;
  });
  return {d: path.toPathData(3), width: bb.x2 - bb.x1, height: bb.y2 - bb.y1, glyphs: glyphBoxes};
};

/** SVG path data (y down, px) -> three.js shapes (y up, three units = px/100). */
export const pathToShapes = (d: string, scale = 0.01): THREE.Shape[] => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}" fill="#000" fill-rule="nonzero"/></svg>`;
  const data = new SVGLoader().parse(svg);
  const shapes: THREE.Shape[] = [];
  data.paths.forEach((p) => shapes.push(...SVGLoader.createShapes(p)));
  // flip Y + scale
  const m = new THREE.Matrix3().makeScale(scale, -scale);
  return shapes.map((s) => {
    const pts = s.extractPoints(12);
    const shape = new THREE.Shape(pts.shape.map((v) => v.clone().applyMatrix3(m)));
    pts.holes.forEach((h) => shape.holes.push(new THREE.Path(h.map((v) => v.clone().applyMatrix3(m)))));
    return shape;
  });
};
