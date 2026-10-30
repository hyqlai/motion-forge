import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {camEase, clamp01, lerp} from '../../../core/motion';

export type SlowPullProps = {
  children: React.ReactNode;
  durationInFrames: number;
  zoomFrom?: number;
  startX?: number;
  startY?: number;
  pullDur?: number;
  holdDur?: number;
};

export const SlowPull: React.FC<SlowPullProps> = ({
  children,
  durationInFrames,
  zoomFrom = 1.26,
  startX = 0,
  startY = 0,
  pullDur,
  holdDur,
}) => {
  const frame = useCurrentFrame();
  const ratio = (pullDur && holdDur) ? pullDur / (pullDur + holdDur) : (4.4 / 5.9);
  const pullDuration = durationInFrames * ratio;
  const holdDuration = durationInFrames - pullDuration;
  const total = zoomFrom - 1;
  const endRate = 0.55;
  const rate = total / pullDuration * endRate;
  const remaining = 1 - rate * holdDuration / total;
  const ease = camEase(endRate);
  const main = ease(clamp01(frame / pullDuration));
  const hold = clamp01((frame - pullDuration) / holdDuration);
  const scale = frame < pullDuration
    ? lerp(zoomFrom, zoomFrom - total * remaining, main)
    : lerp(zoomFrom - total * remaining, 1, hold);
  const x = frame < pullDuration ? lerp(startX, startX * (1 - remaining), main) : lerp(startX * (1 - remaining), 0, hold);
  const y = frame < pullDuration ? lerp(startY, startY * (1 - remaining), main) : lerp(startY * (1 - remaining), 0, hold);

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${x}px, ${y}px) scale(${scale})`, transformOrigin: '50% 50%'}}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
