import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {UnitDotSwarmRegroupV2} from '../../_shotcraft_demos/data/chart-live-moves/UnitDotSwarmRegroupV2';
import {AxisRescaleShockV2} from '../../_shotcraft_demos/data/chart-live-moves/AxisRescaleShockV2';
import {OscilloscopeStreamV2} from '../../_shotcraft_demos/data/chart-live-moves/OscilloscopeStreamV2';
import type {Theme} from '../../../core/schema';

export type ChartLiveMovesStyle = 'unit-dot-swarm-regroup' | 'axis-rescale-shock' | 'oscilloscope-stream';

export type ChartLiveMovesProps = {
  style?: ChartLiveMovesStyle;
  theme?: Theme;
  durationInFrames?: number;
};

export const ChartLiveMoves: React.FC<ChartLiveMovesProps> = ({style = 'unit-dot-swarm-regroup'}) => {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  const renderVariant = () => {
    switch (style) {
    case 'unit-dot-swarm-regroup':
      return <UnitDotSwarmRegroupV2 />;
    case 'axis-rescale-shock':
      return <AxisRescaleShockV2 />;
    case 'oscilloscope-stream':
      return <OscilloscopeStreamV2 />;
    default:
      return <UnitDotSwarmRegroupV2 />;
    }
  };

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
        {renderVariant()}
      </div>
    </AbsoluteFill>
  );
};
