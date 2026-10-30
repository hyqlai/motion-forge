import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2In, power3Out, power4Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type SpeedSlabTitleProps = {
  mainTitle?: string;
  subTitle?: string;
  theme: Theme;
  durationInFrames: number;
};

export const SpeedSlabTitle: React.FC<SpeedSlabTitleProps> = ({
  mainTitle = '视频生产效率',
  subTitle = '提升 10 倍',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const lead = 0.40;
  const l1Dur = 0.18;
  const l1ScaleInit = 1.04;
  const gap = 0.08;
  const slabFrom = -580 * scale;
  const slabDur = 0.28;
  const lagPx = 40 * scale;
  const lagDur = 0.34;

  const lineLens = [42 * scale, 30 * scale, 22 * scale];
  const lineTops = [0.24, 0.50, 0.76];
  const lineStagger = 0.067;
  const lineOpen = 0.09;
  const lineFade = 0.20;

  // ① 主标题硬现
  const l1P = power3Out(clamp01((t - lead) / l1Dur));
  const l1Scale = lerp(l1ScaleInit, 1, l1P);

  // ② 色块冲入
  const slabAt = lead + l1Dur + gap;
  const slabP = power4Out(clamp01((t - slabAt) / slabDur));
  const slabX = lerp(slabFrom, 0, slabP);

  // ④ 白字反向补偿追赶
  const lagP = power3Out(clamp01((t - slabAt) / lagDur));
  const textX = lerp(lagPx, 0, lagP);

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      paddingLeft: 84 * scale,
      overflow: 'hidden',
    }}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative'}}>
        {/* 主标题 */}
        <div style={{
          fontSize: 72 * scale,
          fontWeight: 800,
          lineHeight: 1.06,
          whiteSpace: 'nowrap',
          transformOrigin: '0% 50%',
          opacity: l1P,
          transform: `scale(${l1Scale})`,
        }}>
          {mainTitle}
        </div>

        {/* 速度色块层 */}
        <div style={{
          position: 'relative',
          marginTop: 18 * scale,
          marginLeft: -16 * scale,
          transform: `translateX(${slabX}px) rotate(-3deg)`,
          transformOrigin: '0% 50%',
        }}>
          {/* 三道拖尾速度线 */}
          <div style={{position: 'absolute', right: '100%', top: 0, bottom: 0, width: 60 * scale, pointerEvents: 'none'}}>
            {lineLens.map((len, i) => {
              const lineT0 = slabAt + slabDur + i * lineStagger;
              const openP = power4Out(clamp01((t - lineT0) / lineOpen));
              const fadeP = power2In(clamp01((t - (lineT0 + lineOpen)) / lineFade));
              const op = t >= lineT0 ? (1 - fadeP) : 0;

              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    right: 6 * scale,
                    top: `${lineTops[i] * 100}%`,
                    width: len,
                    height: 3 * scale,
                    background: theme.accent,
                    transformOrigin: 'right center',
                    transform: `scaleX(${openP})`,
                    opacity: op,
                  }}
                />
              );
            })}
          </div>

          {/* 冲刺实心色块 */}
          <div style={{
            position: 'relative',
            display: 'inline-block',
            padding: `${12 * scale}px ${28 * scale}px ${14 * scale}px`,
            background: theme.accent,
            borderRadius: 8 * scale,
            overflow: 'hidden',
          }}>
            <div style={{
              fontSize: 74 * scale,
              fontWeight: 850,
              lineHeight: 1.06,
              color: '#0c111b',
              whiteSpace: 'nowrap',
              transform: `translateX(${textX}px)`,
            }}>
              {subTitle}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
