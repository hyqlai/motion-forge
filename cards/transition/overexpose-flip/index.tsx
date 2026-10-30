import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {lerp, power1InOut, power2In, power2Out, sineInOut, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type OverexposeFlipProps = {
  from: React.ReactNode;
  to: React.ReactNode;
  theme: Theme;
  durationInFrames: number;
};

export const OverexposeFlip: React.FC<OverexposeFlipProps> = ({from, to, theme}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cut = 1.25;
  const settleEnd = 1.8;
  const aScale = t < 0.8 ? lerp(1, 1.05, tween(t, 0, 0.8, sineInOut)) : lerp(1.05, 1.5, tween(t, 0.8, 0.55, power2In));
  const aBlur = lerp(0, 4, tween(t, 0.8, 0.55, power2In));
  const flash = t < cut ? lerp(0, 0.5, tween(t, cut - 0.26, 0.26, power2In)) : lerp(0.5, 0, tween(t, cut, 0.42, power2Out));
  const bScale = t < settleEnd ? lerp(1.3, 1.03, tween(t, cut, 0.55, power2Out)) : lerp(1.03, 1.07, tween(t, settleEnd, 0.9, sineInOut));
  const bBlur = lerp(6, 0, tween(t, cut, 0.55, power2Out));

  return (
    <AbsoluteFill style={{background: theme.background, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: '-14%', opacity: 1 - tween(t, cut, 0.4, power1InOut), transform: `scale(${aScale})`, filter: `blur(${aBlur}px)`}}>{from}</div>
      <div style={{position: 'absolute', inset: '-14%', opacity: tween(t, cut, 0.4, power1InOut), transform: `scale(${bScale})`, filter: `blur(${bBlur}px)`}}>{to}</div>
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', opacity: flash, background: 'radial-gradient(ellipse at 50% 46%, rgba(255,255,255,1) 0%, rgba(255,255,255,.7) 45%, rgba(255,255,255,.2) 80%)'}} />
    </AbsoluteFill>
  );
};
