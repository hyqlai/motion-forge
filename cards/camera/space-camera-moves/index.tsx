import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {DroneDiveLanding} from '../../_shotcraft_demos/camera/space-camera-moves/DroneDiveLanding';
import {ExplodedView} from '../../_shotcraft_demos/camera/space-camera-moves/ExplodedView';
import type {Theme} from '../../../core/schema';

export type SpaceCameraMovesStyle = 'drone-dive-landing' | 'exploded-view';

export type SpaceCameraMovesProps = {
  style?: SpaceCameraMovesStyle;
  theme?: Theme;
  durationInFrames?: number;
};

export const SpaceCameraMoves: React.FC<SpaceCameraMovesProps> = ({style = 'drone-dive-landing'}) => {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  const renderVariant = () => {
    switch (style) {
    case 'drone-dive-landing':
      return <DroneDiveLanding />;
    case 'exploded-view':
      return <ExplodedView />;
    default:
      return <DroneDiveLanding />;
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
