import {FONT_OUTLINE} from '../config/theme';
import {useAsset} from '../utils/useAsset';
import {loadFont, textOutline, type TextOutline} from './fontShapes';

/**
 * Glyph outlines of display words (same face as the DOM type). Used only to
 * sample particles that dissolve / re-form words — never for 3D extrusion.
 */
export const useOutlines = (texts: string[], size: number, tracking = 0, font = FONT_OUTLINE) =>
  useAsset<TextOutline[]>(`outlines:${font}:${texts.join('|')}:${size}:${tracking}`, async () => {
    const f = await loadFont(font);
    return texts.map((t) => textOutline(f, t, size, tracking));
  });
