/** Global intensity knobs for post effects. 0 disables. */
export const EFFECTS = {
  grain: 0.07,
  vignette: 0.55,
  /** Depth-of-field strength for the CSS 3D camera (blur px multiplier). */
  dof: 1,
  maxDofBlur: 14,
  /** Fake motion blur on kinetic type (px per px/frame of velocity). */
  typeMotionBlur: 0.35,
  /** Bokeh post-process in WebGL scenes. */
  webglDof: true,
} as const;
