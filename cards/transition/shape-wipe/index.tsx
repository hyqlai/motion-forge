import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power4In, power4Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type ShapeWipeProps = {
  from?: React.ReactNode;
  to?: React.ReactNode;
  theme: Theme;
  durationInFrames: number;
  holdA?: number;
  wipeDur?: number;
};

// 色块斜切扫屏转场：三层同色系色块斜切错峰扫屏，换内容藏在第二层完全遮挡全屏的瞬间
export const ShapeWipe: React.FC<ShapeWipeProps> = ({
  from,
  to,
  theme,
  holdA = 0.9,
  wipeDur = 0.45,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const layerDelay = 0.07;
  const skew = -12;
  const stretch = 1.22;

  // 换内容藏在遮挡帧里：第二层运动中点 = 它完全盖住全屏的那一帧
  const swapAt = holdA + layerDelay + wipeDur / 2;
  const showToScene = t >= swapAt;

  // 单层扫屏：前半段 power4In 从 -75% 到 0，后半段 power4Out 从 0 到 75%
  const calcLayer = (index: number) => {
    const t0 = holdA + index * layerDelay;
    const half = wipeDur / 2;
    if (t < t0 + half) {
      const p = power4In(clamp01((t - t0) / half));
      return {xp: lerp(-75, 0, p), sx: lerp(1, stretch, p)};
    }
    const p = power4Out(clamp01((t - (t0 + half)) / half));
    return {xp: lerp(0, 75, p), sx: lerp(stretch, 1, p)};
  };

  // 三层色阶：浅 -> 中 -> 主题强调色
  const colors = [
    `${theme.accent}44`,
    `${theme.accent}99`,
    theme.accent,
  ];

  const defaultFrom = (
    <div style={{width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: theme.background, color: theme.muted, fontSize: 56, fontWeight: 800}}>
      01 · 前置铺垫
    </div>
  );
  const defaultTo = (
    <div style={{width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#121a28', color: theme.foreground, fontSize: 56, fontWeight: 800}}>
      02 · 核心高潮
    </div>
  );

  return (
    <AbsoluteFill style={{background: theme.background, overflow: 'hidden'}}>
      {/* 场景 A */}
      <AbsoluteFill style={{opacity: showToScene ? 0 : 1, visibility: showToScene ? 'hidden' : 'visible'}}>
        {from ?? defaultFrom}
      </AbsoluteFill>

      {/* 场景 B */}
      <AbsoluteFill style={{opacity: showToScene ? 1 : 0, visibility: showToScene ? 'visible' : 'hidden'}}>
        {to ?? defaultTo}
      </AbsoluteFill>

      {/* 扫屏色块层：宽 2.6 倍屏宽，错峰高速划过 */}
      {colors.map((color, i) => {
        const {xp, sx} = calcLayer(i);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '-8%',
              height: '116%',
              left: '-80%',
              width: '260%',
              background: color,
              transform: `translate3d(${xp}%, 0px, 0px) skewX(${skew}deg) scaleX(${sx})`,
              willChange: 'transform',
              zIndex: 10 + i,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
