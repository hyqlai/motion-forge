import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2Out, power4Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type MotionBlurSlamInProps = {
  theme: Theme;
  durationInFrames: number;
};

export const MotionBlurSlamIn: React.FC<MotionBlurSlamInProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const startDelay = 0.4;
  const fromX = 560 * scale;
  const slam = 0.2;
  const blurMax = 18 * scale;
  const overshoot = 3 * scale;
  const settle = 0.1;

  // 卡片 A
  const pA = power4Out(clamp01((t - startDelay) / slam));
  const blurA = blurMax * Math.pow(1 - clamp01((t - startDelay) / slam), 0.75);
  const xA = t < startDelay + slam
    ? lerp(fromX, -overshoot, pA)
    : lerp(-overshoot, 0, power2Out(clamp01((t - (startDelay + slam)) / settle)));

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        left: 360 * scale,
        top: 90 * scale,
        width: 440 * scale,
        height: 360 * scale,
        background: '#141c2b',
        border: `1px solid ${theme.muted}33`,
        borderRadius: 14 * scale,
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
        transform: `translateX(${xA}px)`,
        filter: blurA > 0.5 ? `blur(${blurA.toFixed(2)}px)` : 'none',
        overflow: 'hidden',
        padding: 24 * scale,
        boxSizing: 'border-box',
        willChange: 'transform, filter',
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: 8 * scale, borderBottom: `1px solid ${theme.muted}22`, paddingBottom: 14 * scale}}>
          <div style={{width: 12 * scale, height: 12 * scale, borderRadius: 3, background: theme.accent}} />
          <div style={{fontSize: 16 * scale, fontWeight: 750}}>核心实证数据切片</div>
        </div>
        <div style={{marginTop: 20 * scale, display: 'flex', flexDirection: 'column', gap: 12 * scale}}>
          <div style={{height: 18 * scale, width: '80%', background: '#223048', borderRadius: 4 * scale}} />
          <div style={{height: 14 * scale, width: '95%', background: '#1c273a', borderRadius: 4 * scale}} />
          <div style={{height: 14 * scale, width: '65%', background: '#1c273a', borderRadius: 4 * scale}} />
          <div style={{height: 120 * scale, background: '#0e1420', borderRadius: 8 * scale, marginTop: 10 * scale, display: 'grid', placeItems: 'center', fontSize: 32 * scale, fontWeight: 800, color: theme.accent}}>
            99.98%
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
