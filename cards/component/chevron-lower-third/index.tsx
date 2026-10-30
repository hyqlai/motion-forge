import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power1Out, power2In, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type ChevronLowerThirdProps = {
  name?: string;
  title?: string;
  theme: Theme;
  durationInFrames: number;
};

export const ChevronLowerThird: React.FC<ChevronLowerThirdProps> = ({
  name = '陆逸凡',
  title = 'AI 视频系统架构师',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const lead = 0.4;
  const nameDur = 0.26;
  const namePush = -26 * scale;
  const chipDur = 0.22;
  const chipGap = 0.1;
  const chipTxtLag = 0.067;
  const chevDur = 0.14;
  const chevStagger = 0.07;
  const chevSlide = 5 * scale;
  const hold = 2.0;
  const outDur = 0.2;

  // ① 姓名行推出
  const pName = power3Out(clamp01((t - lead) / nameDur));
  const curNameX = lerp(namePush, 0, pName);

  // ② 职称 chip 展开
  const tChip = lead + chipGap;
  const pChip = power3Out(clamp01((t - tChip) / chipDur));
  const txtOp = power1Out(clamp01((t - (tChip + chipTxtLag)) / 0.15));

  // ③ 三枚 chevron 扫过点亮
  const tChev = tChip + chipDur;

  // ⑤ 退场
  const tOut = lead + nameDur + hold;
  const pOut = power2In(clamp01((t - tOut) / outDur));
  const exitK = 1 - pOut;

  return (
    <AbsoluteFill style={{
      background: 'transparent',
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      {/* 位于左下安全区 */}
      <div style={{
        position: 'absolute',
        left: 64 * scale,
        bottom: 56 * scale,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        opacity: exitK,
        transform: `scaleX(${exitK})`,
        transformOrigin: 'left center',
        willChange: 'transform, opacity',
      }}>
        {/* 姓名行 */}
        <div style={{
          fontSize: 40 * scale,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: 1,
          opacity: pName,
          transform: `translateX(${curNameX}px)`,
          textShadow: '0 2px 10px rgba(0,0,0,0.6)',
        }}>
          {name}
        </div>

        {/* 职称栏与 chevron 组合 */}
        <div style={{display: 'flex', alignItems: 'center', gap: 12 * scale, marginTop: 12 * scale}}>
          <div style={{
            position: 'relative',
            height: 36 * scale,
            padding: `0 ${16 * scale}px`,
            background: theme.accent,
            borderRadius: 6 * scale,
            transformOrigin: 'left center',
            transform: `scaleX(${pChip})`,
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>
            <span style={{
              fontSize: 16 * scale,
              fontWeight: 750,
              color: '#0c111b',
              whiteSpace: 'nowrap',
              opacity: txtOp,
            }}>
              {title}
            </span>
          </div>

          {/* 三枚动感箭头 */}
          <div style={{display: 'flex', gap: 4 * scale}}>
            {[0, 1, 2].map((i) => {
              const at = tChev + i * chevStagger;
              const p = power2Out(clamp01((t - at) / chevDur));
              const x = lerp(chevSlide, 0, p);
              return (
                <svg
                  key={i}
                  viewBox="0 0 16 24"
                  style={{
                    width: 12 * scale,
                    height: 18 * scale,
                    opacity: p,
                    transform: `translateX(${x}px)`,
                  }}
                >
                  <path d="M 4 4 L 12 12 L 4 20" fill="none" stroke={theme.accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
