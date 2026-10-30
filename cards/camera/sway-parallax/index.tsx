import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp} from '../../../core/motion';

export type SwayParallaxProps = {
  children: React.ReactNode;
  durationInFrames: number;
  distance?: number;
  swayDeg?: number;
};

export const SwayParallax: React.FC<SwayParallaxProps> = ({children, durationInFrames, distance, swayDeg = 3.2}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const travel = distance ?? width * 0.8;
  const total = durationInFrames / fps;
  const accel = Math.min(0.55, total * 0.15);
  const hold = Math.min(1.1, total * 0.2);
  const main = total - accel - hold;
  const accelDistance = travel * 0.08;
  let x: number;
  let rotateY: number;
  let z: number;
  if (t < accel) {
    const progress = 1 - Math.cos(clamp01(t / accel) * Math.PI / 2);
    x = lerp(40, 40 - accelDistance, progress);
    rotateY = lerp(0, swayDeg * 0.45, progress);
    z = lerp(0, 6.3, progress);
  } else if (t < accel + main) {
    const progress = clamp01((t - accel) / main);
    const eased = progress + 0.5 * progress * progress * (1 - progress);
    x = lerp(40 - accelDistance, 40 - travel, eased);
    rotateY = lerp(swayDeg * 0.45, swayDeg, progress);
    z = lerp(6.3, 14, progress);
  } else {
    const progress = clamp01((t - accel - main) / hold);
    x = lerp(40 - travel, 40 - travel * 1.08, progress);
    rotateY = lerp(swayDeg, swayDeg * 0.82, progress);
    z = 14;
  }

  return (
    <AbsoluteFill style={{overflow: 'hidden', perspective: 1200}}>
      <div style={{position: 'absolute', left: 0, top: '50%', width: '188%', height: '80%', marginTop: '-22%', transformStyle: 'preserve-3d', transform: `translate3d(${x}px,0,${z}px) rotateY(${rotateY}deg)`}}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
