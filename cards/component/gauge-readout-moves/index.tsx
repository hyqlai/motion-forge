import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {TapeScrollFixedPointer} from '../../_shotcraft_demos/data/gauge-readout-moves/TapeScrollFixedPointer';
import {NeedleSweepSelftest} from '../../_shotcraft_demos/data/gauge-readout-moves/NeedleSweepSelftest';
import type {Theme} from '../../../core/schema';

export type GaugeReadoutMovesStyle = 'tape-scroll-fixed-pointer' | 'needle-sweep-selftest';

export type GaugeReadoutMovesProps = {
  style?: GaugeReadoutMovesStyle;
  theme?: Theme;
  durationInFrames?: number;
};

export const GaugeReadoutMoves: React.FC<GaugeReadoutMovesProps> = ({style = 'tape-scroll-fixed-pointer'}) => {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  const renderVariant = () => {
    switch (style) {
    case 'tape-scroll-fixed-pointer':
      return <TapeScrollFixedPointer />;
    case 'needle-sweep-selftest':
      return <NeedleSweepSelftest />;
    default:
      return <TapeScrollFixedPointer />;
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
