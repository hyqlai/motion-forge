import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, cubicBezier, lerp, linear, power1In, power1Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type CaretWipeProps = {
  from?: React.ReactNode;
  to?: React.ReactNode;
  theme: Theme;
  durationInFrames: number;
  holdA?: number;
  wipe?: number;
  dir?: 'right' | 'left';
};

const EASE = cubicBezier(0.65, 0, 0.35, 1);

export const CaretWipe: React.FC<CaretWipeProps> = ({
  from,
  to,
  theme,
  holdA = 0.80,
  wipe = 1.33,
  dir = 'right',
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const goingRight = dir === 'right';

  const caretFade = 0.08;
  const inY = 3;
  const inBlur = 2;
  const outY = -6;
  const outBlur = 4;

  const clipOld = (xPercent: number) =>
    goingRight ? `inset(0 0 0 ${xPercent}%)` : `inset(0 ${100 - xPercent}% 0 0)`;
  const clipNew = (xPercent: number) =>
    goingRight ? `inset(0 ${100 - xPercent}% 0 0)` : `inset(0 0 0 ${xPercent}%)`;

  const x0 = goingRight ? 0 : 100;
  const x1 = goingRight ? 100 : 0;

  // 进度量 x：一条曲线同时驱动裁切边界与光标
  const progress = EASE(clamp01((t - holdA) / wipe));
  const x = lerp(x0, x1, progress);

  // 新场景：沉降 + 解糊（解糊在 80% 进度前收完）
  const currentInY = lerp(inY, 0, progress);
  const currentInBlur = lerp(inBlur, 0, power1Out(clamp01((t - holdA) / (wipe * 0.8))));

  // 旧场景：上浮 + 失焦（起手延后 10%）
  const currentOutY = lerp(0, outY, linear(clamp01((t - holdA) / wipe)));
  const currentOutBlur = lerp(0, outBlur, power1In(clamp01((t - (holdA + wipe * 0.1)) / (wipe * 0.9))));

  // 光标条：两端各 8% 进度淡入淡出
  const fadeDur = wipe * caretFade;
  const caretOpacity = linear(clamp01((t - holdA) / fadeDur)) * (1 - linear(clamp01((t - (holdA + wipe - fadeDur)) / fadeDur)));

  const defaultFrom = (
    <div style={{width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: theme.background, color: theme.muted, fontSize: 56, fontWeight: 800}}>
      旧版本代码与思路
    </div>
  );
  const defaultTo = (
    <div style={{width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#141d2e', color: theme.accent, fontSize: 56, fontWeight: 800}}>
      重写后的新架构
    </div>
  );

  return (
    <AbsoluteFill style={{background: theme.background, overflow: 'hidden'}}>
      {/* 旧场景 */}
      <AbsoluteFill style={{
        clipPath: clipOld(x),
        transform: `translate(0px, ${currentOutY}px)`,
        filter: `blur(${currentOutBlur}px)`,
      }}>
        {from ?? defaultFrom}
      </AbsoluteFill>

      {/* 新场景 */}
      <AbsoluteFill style={{
        clipPath: clipNew(x),
        transform: `translate(0px, ${currentInY}px)`,
        filter: `blur(${currentInBlur}px)`,
      }}>
        {to ?? defaultTo}
      </AbsoluteFill>

      {/* 光标条：高 50%，骑在裁切线上 */}
      <div style={{
        position: 'absolute',
        top: '25%',
        height: '50%',
        width: 4,
        background: theme.accent,
        borderRadius: 4,
        zIndex: 10,
        pointerEvents: 'none',
        left: `${(x / 100) * width - 2}px`,
        opacity: caretOpacity,
        boxShadow: `0 0 12px ${theme.accent}`,
      }} />
    </AbsoluteFill>
  );
};
