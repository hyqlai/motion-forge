import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2Out, sineInOut} from '../../../core/motion';

export type Tilt3dPageProps = {
  children: React.ReactNode;
  durationInFrames: number;
};

export const Tilt3dPage: React.FC<Tilt3dPageProps> = ({children}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const startHold = 0.5;
  const tiltDur = 1.5;
  const holdDur = 3.0;

  let rotY = 0;
  let rotX = 0;
  let s = 1;
  let shOp = 0.05;
  let shX = 0;
  let shY = 0;

  if (t < startHold) {
    rotY = 0;
    rotX = 0;
    s = 1;
  } else if (t < startHold + tiltDur) {
    const p = power2Out(clamp01((t - startHold) / tiltDur));
    rotY = lerp(0, -19, p);
    rotX = lerp(0, 4.5, p);
    s = lerp(1, 0.94, p);
    shOp = lerp(0.05, 0.19, p);
    shX = lerp(0, 26 * scale, p);
    shY = lerp(0, 15 * scale, p);
  } else {
    const p = sineInOut(clamp01((t - (startHold + tiltDur)) / holdDur));
    rotY = lerp(-19, -22.5, p);
    rotX = lerp(4.5, 3.2, p);
    s = 0.94;
    shOp = 0.19;
    shX = lerp(26 * scale, 33 * scale, p);
    shY = lerp(15 * scale, 12 * scale, p);
  }

  return (
    <AbsoluteFill style={{
      overflow: 'hidden',
      perspective: '1000px',
      perspectiveOrigin: '50% 46%',
    }}>
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 792 * scale,
        height: 452 * scale,
        margin: `${-226 * scale}px 0 0 ${-396 * scale}px`,
        transformStyle: 'preserve-3d',
        transform: `rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${s})`,
        willChange: 'transform',
      }}>
        {/* 动态透视投影层 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 14 * scale,
          background: '#000',
          filter: `blur(${26 * scale}px)`,
          opacity: shOp,
          transform: `translate3d(${shX}px, ${shY}px, -40px)`,
        }} />

        {/* 页面内容本体 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 14 * scale,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};
