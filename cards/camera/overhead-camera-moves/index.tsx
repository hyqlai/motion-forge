import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {OverheadTabletopDrop} from '../../_shotcraft_demos/camera/overhead-camera-moves/OverheadTabletopDrop';
import {TiltReveal} from '../../_shotcraft_demos/camera/overhead-camera-moves/TiltReveal';
import type {Theme} from '../../../core/schema';

export type OverheadCameraMovesStyle = 'overhead-tabletop-drop' | 'tilt-reveal';

export type OverheadCameraMovesProps = {
  style?: OverheadCameraMovesStyle;
  theme?: Theme;
  durationInFrames?: number;
};

export const OverheadCameraMoves: React.FC<OverheadCameraMovesProps> = ({style = 'overhead-tabletop-drop'}) => {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  const renderVariant = () => {
    switch (style) {
    case 'overhead-tabletop-drop':
      return <OverheadTabletopDrop />;
    case 'tilt-reveal':
      return <TiltReveal />;
    default:
      return <OverheadTabletopDrop />;
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
