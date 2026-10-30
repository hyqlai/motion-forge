import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2InOut, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type QuoteBracketPullProps = {
  lines?: string[];
  highlightWord?: string;
  theme: Theme;
  durationInFrames: number;
  lead?: number;
  markDur?: number;
};

export const QuoteBracketPull: React.FC<QuoteBracketPullProps> = ({
  lines = ['真正拉开差距的', '从来不是谁更聪明', '而是谁愿意把简单的事重复做'],
  highlightWord = '重复做',
  theme,
  lead = 0.35,
  markDur = 0.32,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scaleRatio = width / 960;

  const markDx = 30 * scaleRatio;
  const markDy = 14 * scaleRatio;
  const lineDur = 0.30;
  const lineStagger = 0.09;
  const lineRise = 6 * scaleRatio;
  const markerGap = 0.10;
  const markerDur = 0.26;

  // ① 两枚引号向内推入（power3Out）
  const markP = power3Out(clamp01((t - lead) / markDur));
  const markOpacity = lerp(0, 0.9, markP);
  const openX = lerp(-markDx, 0, markP);
  const openY = lerp(-markDy, 0, markP);
  const closeX = lerp(markDx, 0, markP);
  const closeY = lerp(markDy, 0, markP);

  // ② 金句错峰淡入上浮
  const linesAt = lead + markDur * 0.5;

  // ③ 荧光笔扫过
  const markerAt = linesAt + (lines.length - 1) * lineStagger + lineDur + markerGap;
  const markerScaleX = power2InOut(clamp01((t - markerAt) / markerDur));

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
        position: 'relative',
        display: 'inline-block',
        padding: `${20 * scaleRatio}px ${40 * scaleRatio}px`,
      }}>
        {/* 开引号 */}
        <span style={{
          position: 'absolute',
          left: -32 * scaleRatio,
          top: -60 * scaleRatio,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 108 * scaleRatio,
          fontWeight: 700,
          lineHeight: 1,
          color: theme.muted,
          opacity: markOpacity,
          transform: `translate(${openX}px, ${openY}px)`,
          userSelect: 'none',
        }}>
          &ldquo;
        </span>

        {/* 金句内容 */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 12 * scaleRatio}}>
          {lines.map((line, idx) => {
            const p = power2Out(clamp01((t - (linesAt + idx * lineStagger)) / lineDur));
            const y = lerp(lineRise, 0, p);

            // 若当前行包含高亮短语，渲染荧光笔下划线
            const isLast = idx === lines.length - 1;
            const hasHighlight = isLast && highlightWord && line.includes(highlightWord);

            let content: React.ReactNode = line;
            if (hasHighlight) {
              const parts = line.split(highlightWord);
              content = (
                <>
                  {parts[0]}
                  <span style={{position: 'relative', display: 'inline-block'}}>
                    <span style={{position: 'relative', zIndex: 2}}>{highlightWord}</span>
                    <span style={{
                      position: 'absolute',
                      left: -4 * scaleRatio,
                      right: -6 * scaleRatio,
                      bottom: 4 * scaleRatio,
                      height: 14 * scaleRatio,
                      background: theme.accent,
                      opacity: 0.75,
                      borderRadius: `${6 * scaleRatio}px ${3 * scaleRatio}px ${5 * scaleRatio}px ${2 * scaleRatio}px`,
                      transformOrigin: 'left center',
                      transform: `scaleX(${markerScaleX})`,
                      zIndex: 1,
                    }} />
                  </span>
                  {parts[1]}
                </>
              );
            }

            return (
              <div
                key={idx}
                style={{
                  fontSize: 34 * scaleRatio,
                  fontWeight: 650,
                  lineHeight: 1.45,
                  whiteSpace: 'nowrap',
                  opacity: p,
                  transform: `translateY(${y}px)`,
                }}
              >
                {content}
              </div>
            );
          })}
        </div>

        {/* 闭引号 */}
        <span style={{
          position: 'absolute',
          right: -24 * scaleRatio,
          bottom: -80 * scaleRatio,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 108 * scaleRatio,
          fontWeight: 700,
          lineHeight: 1,
          color: theme.muted,
          opacity: markOpacity,
          transform: `translate(${closeX}px, ${closeY}px)`,
          userSelect: 'none',
        }}>
          &rdquo;
        </span>
      </div>
    </AbsoluteFill>
  );
};
