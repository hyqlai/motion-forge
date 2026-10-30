import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ChangelogScrollBrake} from '../../_shotcraft_demos/data/scroll-brake-moves/ChangelogScrollBrake';
import {BrakeReticleLock} from '../../_shotcraft_demos/data/scroll-brake-moves/BrakeReticleLock';
import type {Theme} from '../../../core/schema';

export type ScrollBrakeMovesStyle = 'changelog-scroll-brake' | 'brake-reticle-lock';

export type ScrollBrakeMovesProps = {
  style?: ScrollBrakeMovesStyle;
  theme?: Theme;
  durationInFrames?: number;
};

export const ScrollBrakeMoves: React.FC<ScrollBrakeMovesProps> = ({style = 'changelog-scroll-brake'}) => {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  const renderVariant = () => {
    switch (style) {
    case 'changelog-scroll-brake':
      return <ChangelogScrollBrake />;
    case 'brake-reticle-lock':
      return <BrakeReticleLock />;
    default:
      return <ChangelogScrollBrake />;
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
