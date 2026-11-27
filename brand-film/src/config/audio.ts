import timeline from './timeline.json';

/**
 * Audio routing. All files live in public/audio.
 * - score.wav + sfx/*.wav are ORIGINAL, procedurally synthesized by
 *   scripts/generate-audio.py (npm run audio) from timeline.json.
 * - narration.wav is NOT included: record the professional voice-over, drop it
 *   at public/audio/narration.wav and set `narration.enabled = true`.
 *   (Or replace score.wav with a licensed track keeping the same filename.)
 */
export const AUDIO = {
  music: {enabled: true, file: 'audio/score.wav', volume: 0.9, /** ducking while narration plays */ duckTo: 0.55},
  sfx: {enabled: true, folder: 'audio/sfx', volume: 0.85},
  narration: {enabled: false, file: 'audio/narration.wav', volume: 1, offsetSeconds: 0},
} as const;

export type SfxType =
  | 'tick'
  | 'impact'
  | 'sub-hit'
  | 'whoosh'
  | 'reverse-whoosh'
  | 'click'
  | 'ui'
  | 'mechanical'
  | 'riser'
  | 'logo';

export const SFX_CUES = timeline.sfx as Array<{t: number; type: SfxType; gain: number}>;
