import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, clamp01, lerp, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type ChapterItem = {
  no: string;
  name: string;
  current?: boolean;
};

export type ChapterProgressListProps = {
  chapters?: ChapterItem[];
  theme: Theme;
  durationInFrames: number;
};

const DEFAULT_CHAPTERS: ChapterItem[] = [
  {no: '01', name: '先说结论与主张', current: false},
  {no: '02', name: '底层技术与统一协议', current: true},
  {no: '03', name: '三个最常见的工程坑', current: false},
  {no: '04', name: '全链路自动化出片', current: false},
];

export const ChapterProgressList: React.FC<ChapterProgressListProps> = ({
  chapters = DEFAULT_CHAPTERS,
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const lead = 0.35;
  const rowIn = 0.24;
  const rowStagger = 0.10;
  const rowShift = 24 * scale;
  const hlDelay = 0.06;
  const hlDur = 0.20;
  const hlAdvance = 6 * scale;
  const cornerDur = 0.30;
  const cornerInset = 10 * scale;

  const titleP = power2Out(clamp01((t - lead) / 0.22));

  // 全部到位时刻
  const allArrived = lead + 0.06 + chapters.length * rowStagger + rowIn;
  const hlAt = allArrived + hlDelay;
  const hlP = power2Out(clamp01((t - hlAt) / hlDur));
  const dotP = backOut(2)(clamp01((t - hlAt) / hlDur));

  // 角框
  const cornerP = power2Out(clamp01((t - hlAt) / cornerDur));
  const cornerOffset = lerp(cornerInset, 0, cornerP);

  return (
    <AbsoluteFill style={{
      background: '#090d15',
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      paddingLeft: 120 * scale,
      overflow: 'hidden',
    }}>
      {/* 四角角框封场 */}
      <div style={{
        position: 'absolute',
        left: 80 * scale - cornerOffset,
        right: 80 * scale - cornerOffset,
        top: 60 * scale - cornerOffset,
        bottom: 60 * scale - cornerOffset,
        pointerEvents: 'none',
        opacity: cornerP,
      }}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 20 * scale, height: 20 * scale, borderLeft: `2px solid ${theme.accent}`, borderTop: `2px solid ${theme.accent}`}} />
        <div style={{position: 'absolute', right: 0, top: 0, width: 20 * scale, height: 20 * scale, borderRight: `2px solid ${theme.accent}`, borderTop: `2px solid ${theme.accent}`}} />
        <div style={{position: 'absolute', left: 0, bottom: 0, width: 20 * scale, height: 20 * scale, borderLeft: `2px solid ${theme.accent}`, borderBottom: `2px solid ${theme.accent}`}} />
        <div style={{position: 'absolute', right: 0, bottom: 0, width: 20 * scale, height: 20 * scale, borderRight: `2px solid ${theme.accent}`, borderBottom: `2px solid ${theme.accent}`}} />
      </div>

      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
        {/* 顶部章节标签 */}
        <div style={{
          fontSize: 13 * scale,
          fontWeight: 800,
          letterSpacing: 3 * scale,
          color: theme.accent,
          marginBottom: 24 * scale,
          opacity: titleP,
        }}>
          CHAPTER NAVIGATION
        </div>

        {/* 章节清单 */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 18 * scale}}>
          {chapters.map((c, i) => {
            const rowAt = lead + 0.06 + i * rowStagger;
            const rP = power3Out(clamp01((t - rowAt) / rowIn));
            const isCurr = c.current ?? false;

            const x = lerp(rowShift, 0, rP) + (isCurr ? lerp(0, -hlAdvance, hlP) : 0);
            const color = isCurr && hlP > 0 ? theme.accent : (isCurr ? theme.foreground : theme.muted);

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16 * scale,
                  fontSize: isCurr ? 28 * scale : 24 * scale,
                  fontWeight: isCurr ? 800 : 500,
                  color,
                  opacity: rP,
                  transform: `translateX(${x}px)`,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: 18 * scale,
                  color: isCurr ? theme.accent : theme.muted,
                  width: 32 * scale,
                }}>
                  {c.no}
                </span>

                {isCurr ? (
                  <span style={{
                    width: 8 * scale,
                    height: 8 * scale,
                    borderRadius: '50%',
                    background: theme.accent,
                    transform: `scale(${dotP})`,
                    display: 'inline-block',
                  }} />
                ) : (
                  <span style={{
                    width: 6 * scale,
                    height: 6 * scale,
                    borderRadius: '50%',
                    background: `${theme.muted}55`,
                    display: 'inline-block',
                  }} />
                )}

                <span>{c.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
