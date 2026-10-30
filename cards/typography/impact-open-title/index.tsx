import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power1Out, power2Out, power3Out, power4Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type ImpactOpenTitleProps = {
  mainText?: string;
  accentWord?: string;
  subtitle?: string;
  theme: Theme;
  durationInFrames: number;
};

export const ImpactOpenTitle: React.FC<ImpactOpenTitleProps> = ({
  mainText = '三秒抓住',
  accentWord = '核心重点',
  subtitle = 'OPENING HOOK · 认知颠覆',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const lead = 0.40;
  const slamDur = 0.20;
  const slamScale = 1.08;
  const wordDelay = 0.10;
  const wordPunch = 0.167;
  const wordScale = 1.15;
  const cornerDur = 0.30;
  const cornerIn = 12 * scale;
  const dotsGap = 0.10;
  const dotsDur = 0.40;
  const subDur = 0.28;
  const subRise = 8 * scale;

  // ① 整句砸出
  const slamP = power4Out(clamp01((t - lead) / slamDur));
  const currentSlamScale = lerp(slamScale, 1, slamP);

  // ①续 末词换色 + punch
  const wordAt = lead + slamDur + wordDelay;
  const wordP = power3Out(clamp01((t - wordAt) / wordPunch));
  const currentWordScale = lerp(wordScale, 1, wordP);
  const wordColor = t >= wordAt ? theme.accent : theme.foreground;

  // ② 四角 L 角框从外向内收 12px
  const cornerP = power2Out(clamp01((t - lead) / cornerDur));
  const cornerOffset = lerp(cornerIn, 0, cornerP);

  // ③ 点阵淡入
  const dotsAt = lead + cornerDur + dotsGap;
  const dotsOp = lerp(0, 0.4, power1Out(clamp01((t - dotsAt) / dotsDur)));

  // ④ 副题淡入上浮
  const subAt = dotsAt + 0.16;
  const subP = power2Out(clamp01((t - subAt) / subDur));

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      {/* 点阵装饰背景 */}
      <div style={{
        position: 'absolute',
        width: 600 * scale,
        height: 280 * scale,
        backgroundImage: `radial-gradient(${theme.muted}55 1.5px, transparent 1.6px)`,
        backgroundSize: `${20 * scale}px ${20 * scale}px`,
        opacity: dotsOp,
        pointerEvents: 'none',
      }} />

      {/* 四角 L 角框 */}
      <div style={{
        position: 'absolute',
        width: 640 * scale,
        height: 300 * scale,
        pointerEvents: 'none',
      }}>
        {/* 左上 */}
        <div style={{
          position: 'absolute',
          left: -cornerOffset,
          top: -cornerOffset,
          width: 24 * scale,
          height: 24 * scale,
          borderLeft: `3px solid ${theme.accent}`,
          borderTop: `3px solid ${theme.accent}`,
          opacity: cornerP,
        }} />
        {/* 右上 */}
        <div style={{
          position: 'absolute',
          right: -cornerOffset,
          top: -cornerOffset,
          width: 24 * scale,
          height: 24 * scale,
          borderRight: `3px solid ${theme.accent}`,
          borderTop: `3px solid ${theme.accent}`,
          opacity: cornerP,
        }} />
        {/* 左下 */}
        <div style={{
          position: 'absolute',
          left: -cornerOffset,
          bottom: -cornerOffset,
          width: 24 * scale,
          height: 24 * scale,
          borderLeft: `3px solid ${theme.accent}`,
          borderBottom: `3px solid ${theme.accent}`,
          opacity: cornerP,
        }} />
        {/* 右下 */}
        <div style={{
          position: 'absolute',
          right: -cornerOffset,
          bottom: -cornerOffset,
          width: 24 * scale,
          height: 24 * scale,
          borderRight: `3px solid ${theme.accent}`,
          borderBottom: `3px solid ${theme.accent}`,
          opacity: cornerP,
        }} />
      </div>

      {/* 标题中心区 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 2,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          fontSize: 68 * scale,
          fontWeight: 850,
          whiteSpace: 'nowrap',
          opacity: slamP,
          transform: `scale(${currentSlamScale})`,
        }}>
          <span>{mainText}</span>
          <span style={{
            marginLeft: 14 * scale,
            color: wordColor,
            transform: `scale(${currentWordScale})`,
            display: 'inline-block',
            transformOrigin: '50% 60%',
          }}>
            {accentWord}
          </span>
        </div>

        <div style={{
          fontSize: 16 * scale,
          fontWeight: 700,
          letterSpacing: 4 * scale,
          color: theme.muted,
          marginTop: 24 * scale,
          opacity: subP,
          transform: `translateY(${lerp(subRise, 0, subP)}px)`,
          whiteSpace: 'nowrap',
        }}>
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
