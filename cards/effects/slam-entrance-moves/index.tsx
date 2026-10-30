import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ImpactBurstKit} from './ImpactBurstKit';
import {ScoreSlam} from './ScoreSlam';
import {KanadaPerspectiveSnap} from './KanadaPerspectiveSnap';
import type {Theme} from '../../../core/schema';

export type SlamEntranceMovesStyle = 'impact-burst-kit' | 'score-slam' | 'kanada-perspective-snap';

export type SlamEntranceMovesProps = {
  style?: SlamEntranceMovesStyle;
  theme?: Theme;
  durationInFrames?: number;
};

export const SlamEntranceMoves: React.FC<SlamEntranceMovesProps> = ({style = 'impact-burst-kit'}) => {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  const renderVariant = () => {
    switch (style) {
    case 'impact-burst-kit':
      return <ImpactBurstKit />;
    case 'score-slam':
      return <ScoreSlam />;
    case 'kanada-perspective-snap':
      return <KanadaPerspectiveSnap />;
    default:
      return <ImpactBurstKit />;
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
