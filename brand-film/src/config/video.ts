import timeline from './timeline.json';

export const FPS = timeline.fps;
export const DURATION_SECONDS = timeline.durationSeconds;
export const DURATION_IN_FRAMES = Math.round(FPS * DURATION_SECONDS);

export const FORMATS = {
  vertical: {id: 'ArmeTecFilmVertical', width: 1080, height: 1920},
  horizontal: {id: 'ArmeTecFilmHorizontal', width: 1920, height: 1080},
} as const;

/**
 * Instagram Reels safe zones (px, 1080x1920): top bar, bottom caption band and
 * the right-hand action column (lower half). Key copy and UI never sit in these
 * margins, but the frame is always full-bleed: atmosphere and scenery extend
 * into them (see components/Ambient.tsx). The horizontal cut uses 5% title-safe.
 */
export const SAFE_AREA = {
  vertical: {top: 250, bottom: 420, left: 72, right: 180},
  horizontal: {top: 60, bottom: 70, left: 100, right: 100},
} as const;
