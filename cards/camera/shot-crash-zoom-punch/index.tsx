import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {CrashImpactReal} from '../../_shotcraft_demos/camera/crash-zoom-punch/CrashImpactReal';
import {CrashZoomReal} from '../../_shotcraft_demos/camera/crash-zoom-punch/CrashZoomReal';
import type {Theme} from '../../../core/schema';

export type ShotCrashZoomPunchStyle = 'crash-impact' | 'crash-zoom-smooth';

export type ShotCrashZoomPunchProps = {
  style?: ShotCrashZoomPunchStyle;
  theme?: Theme;
  durationInFrames?: number;
};

export const ShotCrashZoomPunch: React.FC<ShotCrashZoomPunchProps> = ({style = 'crash-impact'}) => {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  const renderVariant = () => {
    switch (style) {
    case 'crash-impact':
      return <CrashImpactReal />;
    case 'crash-zoom-smooth':
      return <CrashZoomReal />;
    default:
      return <CrashImpactReal />;
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
