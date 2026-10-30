import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {BulletTimeFreezeOrbit} from '../../_shotcraft_demos/camera/tension-camera-moves/BulletTimeFreezeOrbit';
import {PullBackIsolation} from '../../_shotcraft_demos/camera/tension-camera-moves/PullBackIsolation';
import type {Theme} from '../../../core/schema';

export type TensionCameraMovesStyle = 'bullet-time-freeze-orbit' | 'pull-back-isolation';

export type TensionCameraMovesProps = {
  style?: TensionCameraMovesStyle;
  theme?: Theme;
  durationInFrames?: number;
};

export const TensionCameraMoves: React.FC<TensionCameraMovesProps> = ({style = 'bullet-time-freeze-orbit'}) => {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  const renderVariant = () => {
    switch (style) {
    case 'bullet-time-freeze-orbit':
      return <BulletTimeFreezeOrbit />;
    case 'pull-back-isolation':
      return <PullBackIsolation />;
    default:
      return <BulletTimeFreezeOrbit />;
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
