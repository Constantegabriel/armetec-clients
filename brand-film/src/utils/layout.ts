import {useVideoConfig} from 'remotion';
import {SAFE_AREA} from '../config/video';

/**
 * Responsive helpers so every scene frames both 9:16 and 16:9.
 * `u` = 1 unit = 1px on the short side of 1080.
 */
export const useLayout = () => {
  const {width, height} = useVideoConfig();
  const vertical = height > width;
  const short = Math.min(width, height);
  const u = short / 1080;
  const safe = vertical ? SAFE_AREA.vertical : SAFE_AREA.horizontal;
  /** Usable width for headline type. */
  const typeWidth = width - safe.left - safe.right;
  /** Vertical centre of the safe zone (offset from frame centre, px). */
  const safeCenterY = (safe.top - safe.bottom) / 2;
  return {width, height, vertical, u, short, safe, typeWidth, safeCenterY, aspect: width / height};
};
export type Layout = ReturnType<typeof useLayout>;
