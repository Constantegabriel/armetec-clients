import timeline from './timeline.json';

export const FPS = timeline.fps;
export const DURATION_SECONDS = timeline.durationSeconds;
export const DURATION_IN_FRAMES = Math.round(FPS * DURATION_SECONDS);

export const FORMATS = {
  vertical: {id: 'ArmeTecFilmVertical', width: 1080, height: 1920},
  horizontal: {id: 'ArmeTecFilmHorizontal', width: 1920, height: 1080},
} as const;

/**
 * Instagram Reels / Stories safe zones (px, 1080x1920). Key copy never sits
 * outside these bounds; the horizontal cut uses a classic 5% title-safe.
 */
export const SAFE_AREA = {
  vertical: {top: 250, bottom: 420, left: 72, right: 150},
  horizontal: {top: 60, bottom: 70, left: 100, right: 100},
} as const;
