import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {TypewriterErrorRetype as ShotcraftDemo} from '../../_shotcraft_demos/typography/typewriter-moves/TypewriterErrorRetype';
import type {Theme} from '../../../core/schema';

export type TypewriterMovesProps = {
  theme?: Theme;
  durationInFrames?: number;
};

export const TypewriterMoves: React.FC<TypewriterMovesProps> = () => {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#0b0e14'}}>
      <div style={{
        width: 1920,
        height: 1080,
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: '50% 50%',
      }}>
        <ShotcraftDemo />
      </div>
    </AbsoluteFill>
  );
};
