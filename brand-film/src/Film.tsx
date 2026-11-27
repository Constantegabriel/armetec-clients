import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Soundtrack} from './audio/Soundtrack';
import {FontLoader} from './components/FontLoader';
import {FilmGrain, Vignette} from './components/PostFX';
import {COLORS} from './config/theme';
import {EFFECTS} from './config/effects';
import {S01S02Time} from './scenes/S01S02Time';
import {S03S04Chaos} from './scenes/S03S04Chaos';
import {S05Platform} from './scenes/S05Platform';
import {S06Digital} from './scenes/S06Digital';
import {S07Results} from './scenes/S07Results';
import {S08Signature} from './scenes/S08Signature';
import {Enter, type EnterType} from './transitions/Enter';
import {Subtitles} from './typography/Subtitles';
import {sec} from './utils/time';

/**
 * The film. Scenes overlap by a few frames where their transitions are
 * designed as continuous moves (match cuts, fly-throughs, morphs).
 */
type Block = {from: number; to: number; C: React.FC<{from: number}>; name: string; enter?: {type: EnterType; frames: number}};

export const BLOCKS: Block[] = [
  {name: '01-02 Tempo', from: 0, to: sec(12.25), C: S01S02Time},
  {name: '03-04 Caos → Crescimento', from: sec(11.75), to: sec(33.3), C: S03S04Chaos, enter: {type: 'push', frames: 30}},
  {name: '05 Plataforma ArmeTec', from: sec(32.9), to: sec(47.05), C: S05Platform, enter: {type: 'dissolve', frames: 24}},
  {name: '06 Presença digital', from: sec(47.0), to: sec(55.3), C: S06Digital},
  {name: '07 Resultados', from: sec(55.0), to: sec(64.6), C: S07Results, enter: {type: 'light', frames: 18}},
  {name: '08 Assinatura', from: sec(64.0), to: sec(70), C: S08Signature, enter: {type: 'dissolve', frames: 36}},
];

export const Film: React.FC<{subtitles?: boolean}> = ({subtitles = EFFECTS.subtitles}) => (
  <FontLoader>
    <AbsoluteFill style={{background: COLORS.black}}>
      {BLOCKS.map(({from, to, C, name, enter}) => (
        <Sequence key={name} name={name} from={from} durationInFrames={to - from}>
          <Enter type={enter?.type ?? 'none'} frames={enter?.frames ?? 0}>
            <C from={from} />
          </Enter>
        </Sequence>
      ))}
      <Vignette />
      <FilmGrain />
      {subtitles ? <Subtitles /> : null}
      <Soundtrack />
    </AbsoluteFill>
  </FontLoader>
);
