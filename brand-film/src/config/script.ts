import timeline from './timeline.json';
import {FPS} from './video';

export type NarrationLine = (typeof timeline.narration)[number];
export const NARRATION = timeline.narration;
export const SCENES = timeline.scenes;
export type SceneId = (typeof timeline.scenes)[number]['id'];

export const sceneFrames = (id: SceneId) => {
  const s = SCENES.find((x) => x.id === id)!;
  return {from: Math.round(s.start * FPS), to: Math.round(s.end * FPS), duration: Math.round((s.end - s.start) * FPS)};
};

export type TimedWord = {text: string; start: number; end: number; line: string};

/**
 * Word-level timing for subtitles. Words share the phrase duration weighted by
 * length (+ a small constant per word, a decent proxy for syllable time).
 * Replace with forced-alignment output once the final narration is recorded.
 */
export const wordsOf = (line: NarrationLine): TimedWord[] => {
  const words = line.text.split(/\s+/);
  const weights = words.map((w) => w.replace(/[^\p{L}]/gu, '').length + 2.5);
  const total = weights.reduce((a, b) => a + b, 0);
  let t = line.start;
  return words.map((w, i) => {
    const d = ((line.end - line.start) * weights[i]) / total;
    const word = {text: w, start: t, end: t + d, line: line.id};
    t += d;
    return word;
  });
};
