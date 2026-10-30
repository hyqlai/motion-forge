import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThemeSweepToggle} from '../../_shotcraft_demos/interaction/theme-switch-moves/ThemeSweepToggle';
import {PaletteThemeRipple} from '../../_shotcraft_demos/interaction/theme-switch-moves/PaletteThemeRipple';
import type {Theme} from '../../../core/schema';

export type ThemeSwitchMovesStyle = 'theme-sweep-toggle' | 'palette-theme-ripple';

export type ThemeSwitchMovesProps = {
  style?: ThemeSwitchMovesStyle;
  theme?: Theme;
  durationInFrames?: number;
};

export const ThemeSwitchMoves: React.FC<ThemeSwitchMovesProps> = ({style = 'theme-sweep-toggle'}) => {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  const renderVariant = () => {
    switch (style) {
    case 'theme-sweep-toggle':
      return <ThemeSweepToggle />;
    case 'palette-theme-ripple':
      return <PaletteThemeRipple />;
    default:
      return <ThemeSweepToggle />;
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
