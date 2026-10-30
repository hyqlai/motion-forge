import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type TrackingInProps = {
  text?: string;
  theme: Theme;
  durationInFrames: number;
};

// Remotion spring 解析解 (damping 18, stiffness 90, mass 1)
const remotionSpring = (damping: number, stiffness: number, mass: number) => {
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const omega0 = Math.sqrt(stiffness / mass);
  const omega1 = omega0 * Math.sqrt(1 - zeta * zeta);
  const decay = zeta * omega0;
  return (t: number) =>
    1 - Math.exp(-decay * t) * ((decay / omega1) * Math.sin(omega1 * t) + Math.cos(omega1 * t));
};

const SPRING = remotionSpring(18, 90, 1);

export const TrackingIn: React.FC<TrackingInProps> = ({
  text = '让每一次运动，都有原因',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const lead = 0.30;
  const springDur = 1.00;
  const fadeDur = 0.50;
  const startTracking = 0.5;
  const endTracking = -0.03;
  const startBlur = 9 * scale;

  // ① 弹簧驱动字距与模糊
  const springT = Math.max(0, t - lead);
  const sP = t < lead ? 0 : clamp01(SPRING(springT));

  const tracking = lerp(startTracking, endTracking, sP);
  const blur = lerp(startBlur, 0, sP);

  // ② 线性淡入
  const opacity = clamp01((t - lead) / fadeDur);

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        fontSize: 66 * scale,
        fontWeight: 800,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        letterSpacing: `${tracking}em`,
        filter: `blur(${blur}px)`,
        opacity,
        willChange: 'letter-spacing, filter, opacity',
      }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};
