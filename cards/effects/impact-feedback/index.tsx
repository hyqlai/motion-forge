import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {AnimeImpact} from './AnimeImpact';
import {HitCounter} from './HitCounter';
import type {Theme} from '../../../core/schema';

export type ImpactFeedbackStyle = 'anime-impact' | 'hit-counter';

export type ImpactFeedbackProps = {
  style?: ImpactFeedbackStyle;
  theme?: Theme;
  durationInFrames?: number;
};

export const ImpactFeedback: React.FC<ImpactFeedbackProps> = ({style = 'anime-impact'}) => {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  const renderVariant = () => {
    switch (style) {
    case 'anime-impact':
      return <AnimeImpact />;
    case 'hit-counter':
      return <HitCounter />;
    default:
      return <AnimeImpact />;
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
