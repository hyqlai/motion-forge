import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power1Out, power2In, power2InOut, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type LineCarryProps = {
  theme: Theme;
  durationInFrames: number;
};

export const LineCarry: React.FC<LineCarryProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const underline = 560 * scale;
  const lineY = 262 * scale;
  const F = {x: 1160 * scale, y: 110 * scale, w: 560 * scale, h: 330 * scale};

  const PTS: [number, number][] = [
    [80 * scale, lineY],
    [80 * scale + underline, lineY],
    [F.x, lineY],
    [F.x, F.y],
    [F.x + F.w, F.y],
    [F.x + F.w, F.y + F.h],
    [F.x, F.y + F.h],
    [F.x, lineY],
  ];

  const SEG = PTS.slice(1).map((p, i) => Math.hypot(p[0] - PTS[i][0], p[1] - PTS[i][1]));
  const TOTAL = SEG.reduce((a, b) => a + b, 0);
  const D = PTS.map((p, i) => (i ? 'L ' : 'M ') + p[0] + ' ' + p[1]).join(' ');

  const titleIn = power3Out(clamp01((t - 0.1) / 0.4));
  const underP = power2Out(clamp01((t - 0.4) / 0.6));
  const camP = power2InOut(clamp01((t - 1.2) / 2.0));
  const camX = lerp(0, 960 * scale, camP);

  // 计算当前生长长度
  let drawnL = 0;
  if (t < 0.4) drawnL = 0;
  else if (t < 1.2) drawnL = lerp(0, underline, underP);
  else drawnL = lerp(underline, TOTAL, camP);

  const dashOffset = Math.max(0, TOTAL - drawnL);

  const bIn = power2Out(clamp01((t - 3.3) / 0.5));
  const exitK = 1 - power2In(clamp01((t - 6.0) / 0.4));

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      {/* 随镜头横移的连续世界 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        transform: `translateX(${-camX}px)`,
        opacity: exitK,
        willChange: 'transform',
      }}>
        {/* A 镜内容（世界坐标 80px） */}
        <div style={{
          position: 'absolute',
          left: 80 * scale,
          top: 150 * scale,
          fontSize: 48 * scale,
          fontWeight: 800,
          opacity: titleIn,
        }}>
          <div>第一章 · 叙事线索</div>
          <div style={{fontSize: 20 * scale, color: theme.muted, fontWeight: 600, marginTop: 12 * scale}}>
            一切从一条纯代码绘制的基准线开始
          </div>
        </div>

        {/* 连续接力折线（下划线 → 冲出 → B 镜画框） */}
        <svg
          style={{position: 'absolute', inset: 0, width: 2000 * scale, height: 540 * scale, pointerEvents: 'none'}}
        >
          <path
            d={D}
            fill="none"
            stroke={theme.accent}
            strokeWidth={3 * scale}
            strokeDasharray={TOTAL}
            strokeDashoffset={dashOffset}
          />
        </svg>

        {/* B 镜内容（框在世界坐标 1160px） */}
        <div style={{
          position: 'absolute',
          left: F.x,
          top: F.y,
          width: F.w,
          height: F.h,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 30 * scale,
          boxSizing: 'border-box',
          opacity: bIn,
        }}>
          <div style={{fontSize: 28 * scale, fontWeight: 800, color: theme.accent, marginBottom: 12 * scale}}>
            第二章 · 画框落定
          </div>
          <div style={{fontSize: 16 * scale, color: theme.muted, textAlign: 'center', lineHeight: 1.6}}>
            线条无痕拐折闭合，无剪辑跳帧，两镜有机自然缝合。
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
