import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type AltBlockLinesProps = {
  lines?: [string, string];
  theme: Theme;
  durationInFrames: number;
  lead?: number;
  dur?: number;
  rowStagger?: number;
  textLag?: number;
};

// 双色块对句：色块横向刷开，文字滞后 2 帧紧随 clip-path 揭示，两行错峰展开
export const AltBlockLines: React.FC<AltBlockLinesProps> = ({
  lines = ['先做减法', '再做加法'],
  theme,
  lead = 0.40,
  dur = 0.26,
  rowStagger = 0.12,
  textLag = 0.067,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const rowData = [
    {text: lines[0] ?? '先做减法', isLead: true},
    {text: lines[1] ?? '再做加法', isLead: false},
  ];

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      paddingLeft: 82 * scale,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 16 * scale,
      }}>
        {rowData.map((row, index) => {
          const at = lead + index * rowStagger;
          // ① 色块从左到右展开（power3Out）
          const bgP = power3Out(clamp01((t - at) / dur));
          // ② 文字被块的右缘刷出（同曲线同时长，滞后约 2 帧）
          const txtP = power3Out(clamp01((t - (at + textLag)) / dur));

          const bgStyle: React.CSSProperties = row.isLead
            ? {background: theme.accent}
            : {background: 'rgba(255, 255, 255, 0.08)', border: `1px solid ${theme.muted}55`};

          const textColor = row.isLead ? theme.background : theme.foreground;

          return (
            <span
              key={index}
              style={{
                position: 'relative',
                display: 'inline-block',
                padding: `${12 * scale}px ${26 * scale}px ${14 * scale}px`,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 6 * scale,
                  transformOrigin: '0% 50%',
                  transform: `scaleX(${bgP})`,
                  ...bgStyle,
                }}
              />
              <span
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  fontSize: 64 * scale,
                  fontWeight: 750,
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                  color: textColor,
                  clipPath: `inset(0 ${(1 - txtP) * 100}% 0 0)`,
                }}
              >
                {row.text}
              </span>
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
