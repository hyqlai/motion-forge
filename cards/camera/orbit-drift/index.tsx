import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';

export type OrbitDriftProps = {
  children: React.ReactNode;
  durationInFrames: number;
  orbit?: number;
  ampRotY?: number;
  ampRotX?: number;
  baseRotY?: number;
  baseRotX?: number;
};

// 环绕微漂：3D 空间里绕静态内容做小幅椭圆环绕，两轴相位错开 90°，带前后进退与投影跟随
export const OrbitDrift: React.FC<OrbitDriftProps> = ({
  children,
  durationInFrames,
  orbit = 5.6,
  ampRotY = 6.2,
  ampRotX = 3.4,
  baseRotY = -8,
  baseRotX = 2.5,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rawT = frame / fps;
  const TAU = Math.PI * 2;
  const t = Math.min(rawT, (durationInFrames / fps));

  const phaseX = 0.25; // 90° 相位差 ⇒ 椭圆环绕而非斜线单摆
  const phaseZ = 0.6;
  const ampZ = 22;

  const sy = Math.sin((TAU * t) / orbit);
  const sx = Math.sin(TAU * (t / orbit + phaseX));
  const sz = Math.sin(TAU * (t / orbit + phaseZ));

  const rotY = baseRotY + ampRotY * sy;
  const rotX = baseRotX + ampRotX * sx;
  const z = ampZ * sz;

  return (
    <AbsoluteFill style={{
      overflow: 'hidden',
      perspective: '900px',
      perspectiveOrigin: '50% 48%',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        transformStyle: 'preserve-3d',
        transform: `translate3d(0px, 0px, ${z}px) rotateY(${rotY}deg) rotateX(${rotX}deg)`,
        willChange: 'transform',
      }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
