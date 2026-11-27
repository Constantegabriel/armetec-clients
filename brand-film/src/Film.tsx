import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Soundtrack} from './audio/Soundtrack';
import {AmbientDust} from './components/Ambient';
import {FontLoader} from './components/FontLoader';
import {FilmGrain, Vignette} from './components/PostFX';
import {COLORS} from './config/theme';
import {S01S02Time} from './scenes/S01S02Time';
import {S03aSheets} from './scenes/S03aSheets';
import {S03bSearch} from './scenes/S03bSearch';
import {S03cRepeat} from './scenes/S03cRepeat';
import {S03dS04Turn} from './scenes/S03dS04Turn';
import {S05Platform} from './scenes/S05Platform';
import {S06S07Connected} from './scenes/S06S07Connected';
import {S08Results} from './scenes/S08Results';
import {S09Signature} from './scenes/S09Signature';
import {Enter, type EnterType} from './transitions/Enter';
import {sec} from './utils/time';

/**
 * The film. Blocks overlap where their transitions are designed as continuous
 * moves (camera-through, match cuts, object continuity). No subtitles: the only
 * on-screen words are the art-directed kinetic typography.
 */
type Block = {from: number; to: number; C: React.FC<{from: number}>; name: string; enter?: {type: EnterType; frames: number}};

export const BLOCKS: Block[] = [
  {name: '01-02 Tempo', from: 0, to: sec(12.2), C: S01S02Time},
  {name: '03a Planilhas', from: sec(11.75), to: sec(16.75), C: S03aSheets, enter: {type: 'dissolve', frames: 26}},
  {name: '03b Procurando informações', from: sec(16.4), to: sec(22.25), C: S03bSearch, enter: {type: 'push', frames: 22}},
  {name: '03c Repetindo tarefas', from: sec(21.85), to: sec(27.75), C: S03cRepeat, enter: {type: 'push', frames: 22}},
  {name: '03d-04 Automáticos → Crescimento', from: sec(27.45), to: sec(39.8), C: S03dS04Turn, enter: {type: 'push', frames: 22}},
  {name: '05 Plataforma ArmeTec', from: sec(39.4), to: sec(53.9), C: S05Platform, enter: {type: 'dissolve', frames: 24}},
  {name: '06-07 Relatórios no WhatsApp + Mobilidade', from: sec(53.4), to: sec(84.3), C: S06S07Connected, enter: {type: 'dissolve', frames: 24}},
  {name: '08 Resultados', from: sec(84.0), to: sec(93.6), C: S08Results, enter: {type: 'light', frames: 18}},
  {name: '09 Assinatura', from: sec(93.0), to: sec(99), C: S09Signature, enter: {type: 'dissolve', frames: 36}},
];

export const Film: React.FC = () => (
  <FontLoader>
    <AbsoluteFill style={{background: COLORS.black}}>
      {BLOCKS.map(({from, to, C, name, enter}) => (
        <Sequence key={name} name={name} from={from} durationInFrames={to - from}>
          <Enter type={enter?.type ?? 'none'} frames={enter?.frames ?? 0}>
            <C from={from} />
          </Enter>
        </Sequence>
      ))}
      <AmbientDust />
      <Vignette />
      <FilmGrain />
      <Soundtrack />
    </AbsoluteFill>
  </FontLoader>
);
