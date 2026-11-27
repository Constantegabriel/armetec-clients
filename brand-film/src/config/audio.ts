import timeline from './timeline.json';

/**
 * Audio routing — no background music in this film.
 * The soundtrack is pure sound design + narration:
 * - sounddesign.wav : ORIGINAL procedural mix of every cue in timeline.json
 *   (`sfx`), synthesized by scripts/generate-audio.py (npm run audio).
 * - narration.wav   : NOT included. Record the voice-over following the
 *   timestamps in timeline.json → `narration`, save it as
 *   public/audio/narration.wav and set `narration.enabled = true`.
 */
export const AUDIO = {
  soundDesign: {enabled: true, file: 'audio/sounddesign.wav', volume: 1, /** gentle ducking under the voice */ duckTo: 0.78},
  narration: {enabled: false, file: 'audio/narration.wav', volume: 1, offsetSeconds: 0},
} as const;

export type SfxCue = {t: number; type: string; gain: number; dur?: number};
export const SFX_CUES = timeline.sfx as SfxCue[];
