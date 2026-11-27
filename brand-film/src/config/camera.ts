/** Lens presets (focal length in mm, full-frame 36x24 equivalent). */
export const LENS = {
  wide: 24,
  standard35: 35,
  normal50: 50,
  portrait85: 85,
  macro100: 100,
} as const;

/**
 * Converts focal length to the vertical FOV (degrees) for three.js.
 * The 24mm sensor side is mapped to the frame's *short* side so the vertical
 * (9:16) and horizontal (16:9) cuts keep the same subject framing.
 */
export const focalToFov = (mm: number, aspect: number) => {
  const shortHalf = Math.atan(24 / (2 * mm));
  const vertical = aspect >= 1 ? shortHalf : Math.atan(Math.tan(shortHalf) / aspect);
  return (2 * vertical * 180) / Math.PI;
};

/** Same lens model in CSS pixels: distance (px) of the eye to the screen plane. */
export const focalToPerspective = (mm: number, shortSidePx: number) => (shortSidePx / 2) / Math.tan(Math.atan(24 / (2 * mm)));
