import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {BentoLightUp} from '../../_shotcraft_demos/ui-entrance/wall-reveal-moves/BentoLightUp';
import {WireframeDrawOn} from '../../_shotcraft_demos/ui-entrance/wall-reveal-moves/WireframeDrawOn';
import type {Theme} from '../../../core/schema';

export type WallRevealMovesStyle = 'bento-light-up' | 'wireframe-draw-on';

export type WallRevealMovesProps = {
  style?: WallRevealMovesStyle;
  theme?: Theme;
  durationInFrames?: number;
};

export const WallRevealMoves: React.FC<WallRevealMovesProps> = ({style = 'bento-light-up'}) => {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  const renderVariant = () => {
    switch (style) {
    case 'bento-light-up':
      return <BentoLightUp />;
    case 'wireframe-draw-on':
      return <WireframeDrawOn />;
    default:
      return <BentoLightUp />;
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
