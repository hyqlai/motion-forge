import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {AttentionBounce as ShotcraftDemo} from '../../_shotcraft_demos/effects/icon-performance-moves/AttentionBounce';
import type {Theme} from '../../../core/schema';

export type IconPerformanceMovesProps = {
  theme?: Theme;
  durationInFrames?: number;
};

export const IconPerformanceMoves: React.FC<IconPerformanceMovesProps> = () => {
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
