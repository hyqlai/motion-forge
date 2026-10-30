import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

export type StackRevealProps = {
  title: string;
  items: string[];
  theme: Theme;
  durationInFrames: number;
};

export const StackReveal: React.FC<StackRevealProps> = ({title, items, theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const scale = width / 960;

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      padding: 64 * scale,
      justifyContent: 'center',
    }}>
      <h2 style={{fontSize: 38 * scale, margin: `0 0 ${34 * scale}px`}}>{title}</h2>
      <div style={{display: 'flex', flexDirection: 'column', gap: 14 * scale}}>
        {items.map((item, index) => {
          const enter = spring({
            frame: frame - 8 - index * 10,
            fps,
            config: {damping: 20, stiffness: 150},
          });
          return (
            <div key={item} style={{
              alignItems: 'center',
              background: index === items.length - 1 ? theme.accent : theme.foreground,
              borderRadius: 16 * scale,
              color: index === items.length - 1 ? theme.background : theme.background,
              display: 'flex',
              fontSize: 25 * scale,
              gap: 20 * scale,
              opacity: enter,
              padding: `${18 * scale}px ${24 * scale}px`,
              transform: `translateX(${interpolate(enter, [0, 1], [70 * scale, 0])}px)`,
            }}>
              <span style={{color: index === items.length - 1 ? theme.background : theme.accent, fontWeight: 800}}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>{item}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
