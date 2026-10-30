import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {LightLeakBurn} from './LightLeakBurn';
import {VersusSlam} from './VersusSlam';
import {InvisibleCut} from './InvisibleCut';
import type {Theme} from '../../../core/schema';

export type TransitionHiddenCutStyle = 'light-leak-burn' | 'versus-slam' | 'invisible-cut';

export type TransitionHiddenCutProps = {
  style?: TransitionHiddenCutStyle;
  theme?: Theme;
  durationInFrames?: number;
};

export const TransitionHiddenCut: React.FC<TransitionHiddenCutProps> = ({style = 'light-leak-burn'}) => {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  const renderVariant = () => {
    switch (style) {
    case 'light-leak-burn':
      return <LightLeakBurn />;
    case 'versus-slam':
      return <VersusSlam />;
    case 'invisible-cut':
      return <InvisibleCut />;
    default:
      return <LightLeakBurn />;
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
