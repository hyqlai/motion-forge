import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {lerp, power1Out, power3Out, sineInOut, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type WhipPanProps = {
  from: React.ReactNode;
  to: React.ReactNode;
  theme: Theme;
  durationInFrames: number;
};

const power3In = (value: number): number => value ** 4;
const sineOut = (value: number): number => Math.sin(value * Math.PI / 2);

export const WhipPan: React.FC<WhipPanProps> = ({from, to, theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const cut = 0.8 + 0.42 - 0.06;
  const brakeEnd = cut + 0.35;
  const distance = width * 0.58;
  const aX = lerp(0, -distance, tween(t, 0.8, 0.42, power3In));
  const aRotation = lerp(0, -1.4, tween(t, 0.8, 0.42, power3In));
  const aBlur = lerp(0, 8, tween(t, 0.8, 0.42, power3In));
  const aScale = lerp(1, 1.04, tween(t, 0, 0.8, sineInOut));
  const bX = lerp(distance, 0, tween(t, cut, 0.35, power3Out));
  const bBlur = lerp(8, 0, tween(t, cut, 0.35, power3Out));
  const bRotation = t < brakeEnd
    ? lerp(1.4, 0.42, tween(t, cut, 0.35, power3Out))
    : lerp(0.42, 0, tween(t, brakeEnd, 0.5, sineOut));
  const bScale = t < brakeEnd
    ? lerp(1.06, 1.02, tween(t, cut, 0.35, power3Out))
    : lerp(1.02, 1.06, tween(t, brakeEnd, 0.9, sineInOut));

  return (
    <AbsoluteFill style={{background: theme.background, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: '-14%', opacity: 1 - tween(t, cut, 0.3, power1Out), filter: `blur(${aBlur}px)`, transform: `translateX(${aX}px) rotate(${aRotation}deg) scale(${aScale})`}}>{from}</div>
      <div style={{position: 'absolute', inset: '-14%', opacity: tween(t, cut, 0.12, power1Out), filter: `blur(${bBlur}px)`, transform: `translateX(${bX}px) rotate(${bRotation}deg) scale(${bScale})`}}>{to}</div>
    </AbsoluteFill>
  );
};
