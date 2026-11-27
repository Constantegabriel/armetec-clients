/** Brand palette. Accent sampled from the official ArmeTec logo ("tec"). */
export const COLORS = {
  black: '#050505',
  graphite: '#111111',
  metal: '#252525',
  white: '#F5F5F5',
  gray: '#A1A1AA',
  dim: '#52525B',
  accent: '#5170FF',
  accentSoft: '#8EA0FF',
  accentDeep: '#2A3FB8',
  success: '#7FD1A8',
  warning: '#E9B872',
  danger: '#E07A7A',
} as const;

export const FONTS = {
  /** Body / UI */
  sans: "'Inter Variable', 'Inter', system-ui, sans-serif",
  /** Display / kinetic typography — Geist (Vercel), clean and high-impact */
  display: "'Geist Variable', 'Inter Variable', sans-serif",
  /** Technical accents (eyebrows, numbers) */
  grotesk: "'Space Grotesk Variable', 'Inter Variable', sans-serif",
  mono: "'JetBrains Mono', 'SFMono-Regular', ui-monospace, monospace",
} as const;

export const FONT_FILES = [
  {family: 'Inter Variable', file: 'fonts/Inter-Variable.woff2', weight: '100 900'},
  {family: 'Geist Variable', file: 'fonts/Geist-Variable.woff2', weight: '100 900'},
  {family: 'Space Grotesk Variable', file: 'fonts/SpaceGrotesk-Variable.woff2', weight: '300 700'},
] as const;

/**
 * Outline source for the particle dissolve (PROBLEMAS → CRESCIMENTO). Same face
 * as the DOM display type, so particles leave/land exactly on the glyphs.
 * (No extruded typography anywhere in the film.)
 */
export const FONT_OUTLINE = 'fonts/Geist-SemiBold.ttf';
