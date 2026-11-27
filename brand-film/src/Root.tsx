import React from 'react';
import {Composition} from 'remotion';
import {DURATION_IN_FRAMES, FORMATS, FPS} from './config/video';
import {Film} from './Film';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id={FORMATS.vertical.id}
      component={Film}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={FORMATS.vertical.width}
      height={FORMATS.vertical.height}
    />
    <Composition
      id={FORMATS.horizontal.id}
      component={Film}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={FORMATS.horizontal.width}
      height={FORMATS.horizontal.height}
    />
  </>
);
