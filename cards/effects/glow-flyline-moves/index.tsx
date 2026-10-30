import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {GlowOrbAmbient} from './GlowOrbAmbient';
import {FlylineArc} from './FlylineArc';
import {OrbFlylineRelay} from './OrbFlylineRelay';
import type {Theme} from '../../../core/schema';

export type GlowFlylineMovesStyle = 'glow-orb-ambient' | 'flyline-arc' | 'orb-flyline-relay';

export type GlowFlylineMovesProps = {
  style?: GlowFlylineMovesStyle;
  theme?: Theme;
  durationInFrames?: number;
};

export const GlowFlylineMoves: React.FC<GlowFlylineMovesProps> = ({style = 'glow-orb-ambient'}) => {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  const renderVariant = () => {
    switch (style) {
    case 'glow-orb-ambient':
      return <GlowOrbAmbient />;
    case 'flyline-arc':
      return <FlylineArc />;
    case 'orb-flyline-relay':
      return <OrbFlylineRelay />;
    default:
      return <GlowOrbAmbient />;
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
