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
  /** Body / UI / subtitles */
  sans: "'Inter Variable', 'Inter', system-ui, sans-serif",
  /** Display / kinetic type */
  display: "'Space Grotesk Variable', 'Inter Variable', sans-serif",
  mono: "'JetBrains Mono', 'SFMono-Regular', ui-monospace, monospace",
} as const;

export const FONT_FILES = [
  {family: 'Inter Variable', file: 'fonts/Inter-Variable.woff2', weight: '100 900'},
  {family: 'Space Grotesk Variable', file: 'fonts/SpaceGrotesk-Variable.woff2', weight: '300 700'},
] as const;

/** Heavy display face used for the extruded 3D typography (OFL, Inter Display). */
export const FONT_3D = 'fonts/InterDisplay-Black.otf';
/** Refined display face for the monumental words (PROBLEMAS, CRESCIMENTO, CRESCER). */
export const FONT_3D_REFINED = 'fonts/InterDisplay-SemiBold.otf';
