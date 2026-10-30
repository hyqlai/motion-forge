import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {lerp, power1InOut, power2In, power2Out, sineInOut, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type PushThroughProps = {
  from: React.ReactNode;
  to: React.ReactNode;
  theme: Theme;
  durationInFrames: number;
};

export const PushThrough: React.FC<PushThroughProps> = ({from, to, theme}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const hold = 0.8;
  const cut = hold + 0.55 - 0.1;
  const settleEnd = cut + 0.6;
  const aScale = t < hold
    ? lerp(1, 1.05, tween(t, 0, hold, sineInOut))
    : lerp(1.05, 1.35, tween(t, hold, 0.55, power2In));
  const aBlur = lerp(0, 7, tween(t, hold, 0.55, power2In));
  const bScale = t < settleEnd
    ? lerp(1.16, 1.03, tween(t, cut, 0.6, power2Out))
    : lerp(1.03, 1.07, tween(t, settleEnd, 0.9, sineInOut));
  const bBlur = lerp(7, 0, tween(t, cut, 0.6, power2Out));

  return (
    <AbsoluteFill style={{background: theme.background, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: '-14%', opacity: 1 - tween(t, cut, 0.45, power1InOut), transform: `scale(${aScale})`, filter: `blur(${aBlur}px)`}}>
        {from}
      </div>
      <div style={{position: 'absolute', inset: '-14%', opacity: tween(t, cut, 0.45, power1InOut), transform: `scale(${bScale})`, filter: `blur(${bBlur}px)`}}>
        {to}
      </div>
    </AbsoluteFill>
  );
};
