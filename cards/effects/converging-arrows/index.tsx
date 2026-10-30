import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, clamp01, lerp, power2Out, power4Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type ConvergingArrowsProps = {
  textPrefix?: string;
  focusWord?: string;
  theme: Theme;
  durationInFrames: number;
};

export const ConvergingArrows: React.FC<ConvergingArrowsProps> = ({
  textPrefix = '解决复杂系统瓶颈的',
  focusWord = '核心抓手',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const arrowAt = 0.45;
  const arrowDur = 0.22;
  const arrowDist = 80 * scale;

  const arrowP = power4Out(clamp01((t - arrowAt) / arrowDur));
  const curOffset = lerp(arrowDist, 0, arrowP);

  // 夹住瞬间字 punch
  const punchP = backOut(2.0)(clamp01((t - (arrowAt + arrowDur)) / 0.18));
  const wordScale = t >= arrowAt + arrowDur ? lerp(1.12, 1, punchP) : 1;

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 * scale}}>
        <div style={{fontSize: 32 * scale, fontWeight: 650, color: theme.muted}}>
          {textPrefix}
        </div>

        {/* 核心词与两侧夹击箭头 */}
        <div style={{display: 'flex', alignItems: 'center', gap: 20 * scale, position: 'relative'}}>
          {/* 左侧向右指的箭头 */}
          <div style={{
            transform: `translateX(${-curOffset}px)`,
            opacity: arrowP,
            willChange: 'transform',
          }}>
            <svg width={36 * scale} height={36 * scale} viewBox="0 0 24 24">
              <path d="M 4 12 L 20 12 M 14 6 L 20 12 L 14 18" fill="none" stroke={theme.accent} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* 重点词 */}
          <div style={{
            fontSize: 58 * scale,
            fontWeight: 850,
            color: theme.accent,
            padding: `${6 * scale}px ${18 * scale}px`,
            background: `${theme.accent}15`,
            borderRadius: 12 * scale,
            border: `2px solid ${theme.accent}`,
            transform: `scale(${wordScale})`,
            transformOrigin: '50% 50%',
            whiteSpace: 'nowrap',
          }}>
            {focusWord}
          </div>

          {/* 右侧向左指的箭头 */}
          <div style={{
            transform: `translateX(${curOffset}px)`,
            opacity: arrowP,
            willChange: 'transform',
          }}>
            <svg width={36 * scale} height={36 * scale} viewBox="0 0 24 24">
              <path d="M 20 12 L 4 12 M 10 6 L 4 12 L 10 18" fill="none" stroke={theme.accent} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
