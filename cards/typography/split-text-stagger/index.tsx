import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, clamp01, lerp, power1Out, power2In, power2Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type SplitTextStaggerProps = {
  text?: string;
  sub?: string;
  theme: Theme;
  durationInFrames: number;
};

export const SplitTextStagger: React.FC<SplitTextStaggerProps> = ({
  text = '把复杂的事，讲简单',
  sub = '—— 口播脚本的第一原则',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const chars = Array.from(text);
  const startAt = 0.3;
  const stagger = 0.067;
  const dur = 0.5;
  const over = 1.2;
  const subAt = 1.4;
  const exitAt = 4.4;
  const exitDur = 0.4;

  const totalBaseDur = (chars.length - 1) * stagger + dur;
  const baseLineP = power2Out(clamp01((t - startAt) / totalBaseDur));
  const subP = power1Out(clamp01((t - subAt) / 0.4));
  const exitK = 1 - power2In(clamp01((t - exitAt) / exitDur));

  const totalTextWidth = chars.length * 58 * scale;

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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: exitK,
      }}>
        {/* 标题字行（每个字独立裁切容器） */}
        <div style={{
          display: 'flex',
          gap: 4 * scale,
          fontSize: 58 * scale,
          fontWeight: 800,
          whiteSpace: 'nowrap',
        }}>
          {chars.map((char, i) => {
            const charStart = startAt + i * stagger;
            const p = backOut(over)(clamp01((t - charStart) / dur));
            const y = lerp(115, 0, p);
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  height: 72 * scale,
                  lineHeight: `${72 * scale}px`,
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    transform: `translateY(${y}%)`,
                  }}
                >
                  {char}
                </span>
              </span>
            );
          })}
        </div>

        {/* 底部精细基线 */}
        <div style={{
          width: totalTextWidth,
          height: 3 * scale,
          background: theme.accent,
          marginTop: 8 * scale,
          transformOrigin: 'left center',
          transform: `scaleX(${baseLineP})`,
        }} />

        {/* 副标说明 */}
        <div style={{
          fontSize: 18 * scale,
          fontWeight: 600,
          color: theme.muted,
          marginTop: 20 * scale,
          opacity: subP,
          whiteSpace: 'nowrap',
        }}>
          {sub}
        </div>
      </div>
    </AbsoluteFill>
  );
};
