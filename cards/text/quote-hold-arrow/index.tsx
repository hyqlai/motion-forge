import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type QuoteHoldArrowProps = {
  lines?: string[];
  theme: Theme;
  durationInFrames: number;
};

const DEFAULT_LINES = [
  '大多数人在追求更多的功能',
  '少数人在思考统一的协议',
  '而真正的壁垒是极致的确定性',
];

export const QuoteHoldArrow: React.FC<QuoteHoldArrowProps> = ({
  lines = DEFAULT_LINES,
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const lead = 0.4;
  const lineDur = 0.28;
  const lineStagger = 0.12;
  const lineRise = 8 * scale;
  const plainHold = 0.34;
  const hlDur = 0.24;
  const punchScale = 1.05;
  const punchDur = 0.17;

  // 末行到达时刻
  const lastLineAt = lead + 2 * lineStagger;
  const lastLineEnd = lastLineAt + lineDur;

  // 高亮框铺开时刻（末行平淡停留之后）
  const hlAt = lastLineEnd + plainHold;
  const pBox = power3Out(clamp01((t - hlAt) / hlDur));

  // 末行 punch
  const punchAt = hlAt + hlDur;
  const pPunch = power2Out(clamp01((t - punchAt) / punchDur));
  const curPunchScale = lerp(punchScale, 1, pPunch);

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      paddingLeft: 100 * scale,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 18 * scale,
      }}>
        {lines.map((line, idx) => {
          const at = lead + idx * lineStagger;
          const p = power2Out(clamp01((t - at) / lineDur));
          const y = lerp(lineRise, 0, p);
          const isLast = idx === lines.length - 1;

          if (isLast) {
            return (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  marginTop: 6 * scale,
                  display: 'inline-block',
                  opacity: p,
                  transform: `translateY(${y}px)`,
                }}
              >
                {/* 中心铺开的高亮底框 */}
                <div style={{
                  position: 'absolute',
                  inset: `${-6 * scale}px ${-14 * scale}px`,
                  background: theme.accent,
                  borderRadius: 8 * scale,
                  transformOrigin: '50% 50%',
                  transform: `scaleX(${pBox})`,
                  zIndex: 0,
                }} />
                {/* 文本 punch */}
                <span style={{
                  position: 'relative',
                  zIndex: 1,
                  fontSize: 36 * scale,
                  fontWeight: 800,
                  color: pBox > 0.5 ? '#0c111b' : theme.foreground,
                  display: 'inline-block',
                  transform: `scale(${curPunchScale})`,
                  transformOrigin: '50% 50%',
                  transition: 'color 0.15s',
                }}>
                  {line}
                </span>
              </div>
            );
          }

          return (
            <div
              key={idx}
              style={{
                fontSize: 32 * scale,
                fontWeight: 650,
                color: theme.muted,
                opacity: p,
                transform: `translateY(${y}px)`,
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
