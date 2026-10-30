import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, clamp01, lerp, power1Out, power2In, power2Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type InfoCardAssembleProps = {
  theme: Theme;
  durationInFrames: number;
};

export const InfoCardAssemble: React.FC<InfoCardAssembleProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const D = 5.0;
  const F = (f: number) => (f / 60) * D;

  const fieldDur = 0.5;
  const riseY = 6 * scale;
  const popFrom = 0.4;
  const hlDur = 0.17;
  const push = 1.06;
  const pushEnd = 0.75 * D;
  const exitAt = 6.4;
  const exitDur = 0.4;

  // 整卡微推
  const cardScale = t < pushEnd ? lerp(1, push, power1Out(clamp01(t / pushEnd))) : push;
  const exitK = 1 - power2In(clamp01((t - exitAt) / exitDur));

  // 字段时钟
  const imgP = power2Out(clamp01((t - F(0)) / fieldDur));
  const titleP = power2Out(clamp01((t - F(4)) / fieldDur));
  const pill0P = backOut(1.7)(clamp01((t - F(8)) / fieldDur));
  const pill1P = backOut(1.7)(clamp01((t - F(10)) / fieldDur));
  const pill2P = backOut(1.7)(clamp01((t - F(12)) / fieldDur));
  const priceP = power2Out(clamp01((t - F(16)) / fieldDur));

  const l0P = power2Out(clamp01((t - F(30)) / fieldDur));
  const l1P = power2Out(clamp01((t - F(32)) / fieldDur));
  const l2P = power2Out(clamp01((t - F(34)) / fieldDur));

  const hl0P = power2Out(clamp01((t - F(34)) / hlDur));
  const hl1P = power2Out(clamp01((t - F(36)) / hlDur));

  const sw0P = backOut(1.7)(clamp01((t - F(40)) / fieldDur));
  const sw1P = backOut(1.7)(clamp01((t - F(42)) / fieldDur));
  const sw2P = backOut(1.7)(clamp01((t - F(44)) / fieldDur));

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
        position: 'absolute',
        left: 270 * scale,
        top: 40 * scale,
        width: 420 * scale,
        height: 460 * scale,
        background: '#141c2b',
        border: `1px solid ${theme.muted}33`,
        borderRadius: 18 * scale,
        padding: 18 * scale,
        boxSizing: 'border-box',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        transformOrigin: '50% 50%',
        transform: `scale(${cardScale})`,
        opacity: exitK,
      }}>
        {/* 图片封面 */}
        <div style={{
          position: 'relative',
          height: 150 * scale,
          borderRadius: 10 * scale,
          background: 'linear-gradient(135deg, #1e2b42 0%, #151d2e 100%)',
          overflow: 'hidden',
          opacity: imgP,
          transform: `translateY(${lerp(riseY, 0, imgP)}px)`,
          display: 'grid',
          placeItems: 'center',
          color: theme.accent,
          fontSize: 28 * scale,
          fontWeight: 800,
        }}>
          MOTION FORGE
        </div>

        {/* 标题 */}
        <div style={{
          fontSize: 22 * scale,
          fontWeight: 750,
          marginTop: 14 * scale,
          opacity: titleP,
          transform: `translateY(${lerp(riseY, 0, titleP)}px)`,
        }}>
          视频动效工程化指南 · 2026版
        </div>

        {/* 三标签 */}
        <div style={{display: 'flex', gap: 8 * scale, marginTop: 10 * scale}}>
          {['Remotion', '纯代码', '零录屏'].map((tag, i) => {
            const p = i === 0 ? pill0P : i === 1 ? pill1P : pill2P;
            return (
              <span
                key={i}
                style={{
                  fontSize: 12 * scale,
                  fontWeight: 650,
                  padding: `${3 * scale}px ${10 * scale}px`,
                  borderRadius: 999,
                  background: '#1d273a',
                  color: theme.muted,
                  opacity: Math.min(1, p),
                  transform: `scale(${lerp(popFrom, 1, p)})`,
                  transformOrigin: '50% 50%',
                }}
              >
                {tag}
              </span>
            );
          })}
        </div>

        {/* 价格/版本行 */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10 * scale,
          marginTop: 12 * scale,
          opacity: priceP,
          transform: `translateY(${lerp(riseY, 0, priceP)}px)`,
        }}>
          <span style={{fontSize: 26 * scale, fontWeight: 800, color: theme.accent, fontFamily: 'monospace'}}>
            v1.0.0 Ready
          </span>
          <span style={{fontSize: 12 * scale, color: theme.muted}}>全量开源规范</span>
        </div>

        {/* 结构化要点行 */}
        <div style={{marginTop: 12 * scale, display: 'flex', flexDirection: 'column', gap: 6 * scale}}>
          <div style={{fontSize: 14 * scale, opacity: l0P, position: 'relative'}}>
            <span>· 全量 252 张工业级动效卡规范</span>
          </div>
          <div style={{fontSize: 14 * scale, opacity: l1P, position: 'relative', display: 'inline-block'}}>
            <span style={{position: 'relative', zIndex: 1}}>· 纯 React + SVG + Three.js 确定性计算</span>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: `${theme.accent}22`,
              borderRadius: 3 * scale,
              transformOrigin: '0 50%',
              transform: `scaleX(${hl0P})`,
              zIndex: 0,
            }} />
          </div>
          <div style={{fontSize: 14 * scale, opacity: l2P, position: 'relative', display: 'inline-block'}}>
            <span style={{position: 'relative', zIndex: 1}}>· 毫秒级多端时间线与关键节拍参数化</span>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: `${theme.accent}22`,
              borderRadius: 3 * scale,
              transformOrigin: '0 50%',
              transform: `scaleX(${hl1P})`,
              zIndex: 0,
            }} />
          </div>
        </div>

        {/* 色卡点亮 */}
        <div style={{display: 'flex', gap: 8 * scale, marginTop: 14 * scale}}>
          {['#ffb703', '#4ecb71', '#38bdf8'].map((c, i) => {
            const p = i === 0 ? sw0P : i === 1 ? sw1P : sw2P;
            return (
              <i
                key={i}
                style={{
                  display: 'block',
                  width: 20 * scale,
                  height: 20 * scale,
                  borderRadius: 6 * scale,
                  background: c,
                  opacity: Math.min(1, p),
                  transform: `scale(${lerp(popFrom, 1, p)})`,
                }}
              />
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
