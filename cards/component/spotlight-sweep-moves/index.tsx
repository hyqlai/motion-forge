import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {GlowWakeSleepPanel} from '../../_shotcraft_demos/effects/spotlight-sweep-moves/GlowWakeSleepPanel';
import {SlideSpotlightPan} from '../../_shotcraft_demos/effects/spotlight-sweep-moves/SlideSpotlightPan';
import {CornerSpotlightReveal} from '../../_shotcraft_demos/effects/spotlight-sweep-moves/CornerSpotlightReveal';
import type {Theme} from '../../../core/schema';

export type SpotlightSweepMovesStyle = 'glow-wake-sleep-panel' | 'slide-spotlight-pan' | 'corner-spotlight-reveal';

export type SpotlightSweepMovesProps = {
  style?: SpotlightSweepMovesStyle;
  theme?: Theme;
  durationInFrames?: number;
};

export const SpotlightSweepMoves: React.FC<SpotlightSweepMovesProps> = ({style = 'glow-wake-sleep-panel'}) => {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  const renderVariant = () => {
    switch (style) {
    case 'glow-wake-sleep-panel':
      return <GlowWakeSleepPanel />;
    case 'slide-spotlight-pan':
      return <SlideSpotlightPan />;
    case 'corner-spotlight-reveal':
      return <CornerSpotlightReveal />;
    default:
      return <GlowWakeSleepPanel />;
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
