import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2In} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type FilmstripConveyorProps = {
  theme: Theme;
  durationInFrames: number;
};

export const FilmstripConveyor: React.FC<FilmstripConveyorProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scaleRatio = width / 960;

  const n = 6;
  const w = 240 * scaleRatio;
  const gap = 24 * scaleRatio;
  const pitch = w + gap;
  const setW = n * pitch;
  const loopDur = 9;
  const v = setW / loopDur;

  const slowIdx = 3;
  const r = 0.25;
  const decel = 0.5;
  const slowDur = 1.4;
  const accel = 0.6;
  const reach = 420 * scaleRatio;

  const dDecel = (v * decel * (1 + r)) / 2;
  const dSlow = v * r * slowDur;
  const dAccel = (v * accel * (1 + r)) / 2;
  const centerX = slowIdx * pitch + w / 2 - 480 * scaleRatio;
  const x0 = Math.max(0, centerX - dDecel);

  const t1 = x0 / v;
  const t2 = t1 + decel;
  const t3 = t2 + slowDur;
  const t4 = t3 + accel;

  const decelEase = (s: number) => (2 / (1 + r)) * s - ((1 - r) / (1 + r)) * s * s;
  const accelEase = (s: number) => ((2 * r) / (1 + r)) * s + ((1 - r) / (1 + r)) * s * s;

  // 五段拼接位移
  let curX = 0;
  if (t < t1) curX = v * t;
  else if (t < t2) curX = x0 + dDecel * decelEase((t - t1) / decel);
  else if (t < t3) curX = x0 + dDecel + v * r * (t - t2);
  else if (t < t4) curX = x0 + dDecel + dSlow + dAccel * accelEase((t - t3) / accel);
  else curX = x0 + dDecel + dSlow + dAccel + v * (t - t4);

  const exitK = 1 - power2In(clamp01((t - 7.5) / 0.4));

  const items = [
    '01 · 需求梳理',
    '02 · 分镜规划',
    '03 · 视觉母题',
    '04 · 关键高光',
    '05 · 代码合成',
    '06 · 交付导出',
    '07 · 持续演进',
    '08 · 质量门禁',
  ];

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* 顶部标题 */}
      <div style={{
        position: 'absolute',
        left: 80 * scaleRatio,
        top: 60 * scaleRatio,
        fontSize: 24 * scaleRatio,
        fontWeight: 750,
        opacity: exitK,
      }}>
        全流程全周期能力巡礼
      </div>

      {/* 传送带容器 */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 150 * scaleRatio,
        height: 260 * scaleRatio,
        width: '100%',
        opacity: exitK,
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          display: 'flex',
          gap: gap,
          transform: `translateX(${-curX}px)`,
          willChange: 'transform',
        }}>
          {items.map((item, i) => {
            const cx = -curX + i * pitch + w / 2;
            const d = Math.min(1, Math.abs(cx - 480 * scaleRatio) / reach);
            const weight = (1 - d) * (1 - d);

            const cardS = lerp(1, 1.08, weight);
            const cardB = lerp(0.5, 1, weight);

            return (
              <div
                key={i}
                style={{
                  width: w,
                  height: 240 * scaleRatio,
                  borderRadius: 14 * scaleRatio,
                  background: '#141c2b',
                  border: `2px solid ${weight > 0.8 ? theme.accent : `${theme.muted}33`}`,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
                  boxSizing: 'border-box',
                  padding: 16 * scaleRatio,
                  display: 'flex',
                  flexDirection: 'column',
                  transform: `scale(${cardS})`,
                  opacity: cardB,
                  transformOrigin: '50% 50%',
                  transition: 'border-color 0.2s',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  flex: 1,
                  borderRadius: 8 * scaleRatio,
                  background: weight > 0.8 ? theme.accent : '#1c273a',
                  color: weight > 0.8 ? '#0c111b' : theme.muted,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 28 * scaleRatio,
                  fontWeight: 900,
                  fontFamily: 'monospace',
                }}>
                  0{i + 1}
                </div>
                <div style={{
                  fontSize: 14 * scaleRatio,
                  fontWeight: 700,
                  marginTop: 10 * scaleRatio,
                  color: weight > 0.8 ? theme.accent : theme.foreground,
                }}>
                  {item}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
