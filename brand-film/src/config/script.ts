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
