import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {DiagramCascadeBuild} from './DiagramCascadeBuild';
import {PanelToCanvasMaterialize} from './PanelToCanvasMaterialize';
import type {Theme} from '../../../core/schema';

export type CanvasMaterializeMovesStyle = 'diagram-cascade' | 'panel-to-canvas';

export type CanvasMaterializeMovesProps = {
  style?: CanvasMaterializeMovesStyle;
  theme?: Theme;
  durationInFrames?: number;
};

export const CanvasMaterializeMoves: React.FC<CanvasMaterializeMovesProps> = ({style = 'diagram-cascade'}) => {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  const renderVariant = () => {
    switch (style) {
    case 'diagram-cascade':
      return <DiagramCascadeBuild />;
    case 'panel-to-canvas':
      return <PanelToCanvasMaterialize />;
    default:
      return <DiagramCascadeBuild />;
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
