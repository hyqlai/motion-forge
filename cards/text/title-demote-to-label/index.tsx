import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power1Out, power2In, power2InOut, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type TitleDemoteToLabelProps = {
  title?: string;
  items?: string[];
  theme: Theme;
  durationInFrames: number;
};

const DEFAULT_ITEMS = [
  '第一步：确立不可妥协的视觉母题',
  '第二步：统一渲染协议与时间线解耦',
  '第三步：全自动生成与零差异审查',
];

export const TitleDemoteToLabel: React.FC<TitleDemoteToLabelProps> = ({
  title = '全流程代码化落地法则',
  items = DEFAULT_ITEMS,
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const startAt = 0.20;
  const reveal = 0.40;
  const stand = 0.70;
  const demote = 0.67;
  const endScale = 0.4;
  const from = {x: 480 * scale, y: 270 * scale};
  const to = {x: 80 * scale, y: 72 * scale};
  const growDelay = 0.40;
  const stagger = 0.55;
  const growDur = 0.50;
  const rise = 28 * scale;
  const exitAt = 5.50;

  const tDemote = startAt + reveal + stand;
  const tGrow = tDemote + growDelay;

  // 标题显影
  const revP = power3Out(clamp01((t - startAt) / reveal));
  const blur = lerp(12 * scale, 0, revP);

  // 降格补间：同一条 power2InOut
  const dP = power2InOut(clamp01((t - tDemote) / demote));
  const curScale = lerp(1, endScale, dP);
  const curX = lerp(from.x, to.x, dP);
  const curY = lerp(from.y, to.y, dP);
  // 居中修正量随补间同步归零
  const anchorOffset = lerp(-50, 0, dP);

  const exitK = 1 - power2In(clamp01((t - exitAt) / 0.4));

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      {/* 标题（从居中大字降格为左上角常驻路标） */}
      <div style={{
        position: 'absolute',
        left: curX,
        top: curY,
        fontSize: 56 * scale,
        fontWeight: 800,
        color: dP > 0.8 ? theme.accent : theme.foreground,
        whiteSpace: 'nowrap',
        transformOrigin: '0% 50%',
        transform: `translate(${anchorOffset}%, -50%) scale(${curScale})`,
        filter: blur > 0.5 ? `blur(${blur.toFixed(2)}px)` : 'none',
        opacity: revP * exitK,
        willChange: 'transform, filter',
        zIndex: 10,
        transition: 'color 0.2s',
      }}>
        {title}
      </div>

      {/* 下方内容块错峰生长 */}
      <div style={{
        position: 'absolute',
        left: 80 * scale,
        top: 140 * scale,
        width: 800 * scale,
        display: 'flex',
        flexDirection: 'column',
        gap: 20 * scale,
        opacity: exitK,
      }}>
        {items.map((it, idx) => {
          const at = tGrow + idx * stagger;
          const p = power3Out(clamp01((t - at) / growDur));
          const y = lerp(rise, 0, p);
          const clipRight = lerp(65, 0, p);

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16 * scale,
                height: 64 * scale,
                fontSize: 24 * scale,
                fontWeight: 650,
                opacity: p,
                transform: `translateY(${y}px)`,
                clipPath: `inset(0 ${clipRight}% 0 0)`,
                willChange: 'transform, clip-path',
              }}
            >
              <div style={{
                width: 6 * scale,
                height: 38 * scale,
                borderRadius: 3 * scale,
                background: theme.accent,
                flexShrink: 0,
              }} />
              <div style={{
                background: '#141c2b',
                border: `1px solid ${theme.muted}33`,
                borderRadius: 12 * scale,
                padding: `0 ${22 * scale}px`,
                height: 64 * scale,
                lineHeight: `${64 * scale}px`,
                whiteSpace: 'nowrap',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}>
                {it}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
