import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {SpotlightSweepReveal} from './SpotlightSweepReveal';
import {SheenSweepRetry} from './SheenSweepRetry';
import type {Theme} from '../../../core/schema';

export type LightPlayMovesStyle = 'spotlight-sweep' | 'sheen-sweep';

export type LightPlayMovesProps = {
  style?: LightPlayMovesStyle;
  theme?: Theme;
  durationInFrames?: number;
};

export const LightPlayMoves: React.FC<LightPlayMovesProps> = ({style = 'spotlight-sweep'}) => {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  const renderVariant = () => {
    switch (style) {
    case 'spotlight-sweep':
      return <SpotlightSweepReveal />;
    case 'sheen-sweep':
      return <SheenSweepRetry />;
    default:
      return <SpotlightSweepReveal />;
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
