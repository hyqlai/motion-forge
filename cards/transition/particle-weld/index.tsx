import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power1InOut, power1Out, power2In, power2Out, sineInOut} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type ParticleWeldProps = {
  from?: React.ReactNode;
  to?: React.ReactNode;
  theme: Theme;
  durationInFrames: number;
  out?: number;
  gather?: number;
};

// 确定性伪随机
const rnd = (s: number) => {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const ParticleWeld: React.FC<ParticleWeldProps> = ({
  from,
  to,
  theme,
  out = 0.60,
  gather = 0.70,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const hold = 0.80;
  const cutLead = 0.12;
  const count = 18;
  const rise = 200 * scale;
  const sway = 46 * scale;
  const seed = 7;

  const at = hold;
  const cut = at + out - cutLead;

  // 18 颗粒子生成
  const particles = Array.from({length: count}).map((_, i) => {
    const s = seed * 100 + i * 17;
    const r = (k: number) => rnd(s + k);
    return {
      size: (4 + r(1) * 7) * scale,
      left: 480 * scale + (r(2) - 0.5) * 360 * scale,
      top: 270 * scale + (r(3) - 0.5) * 60 * scale,
      delay: r(4) * 0.15,
      r,
    };
  });

  // A 镜缓动
  const aOpacity = t < cut ? 1 : 1 - power1InOut(clamp01((t - cut) / 0.5));
  const aScale = lerp(1, 1.02, sineInOut(clamp01(t / 0.8)));

  const outBigP = power2In(clamp01((t - at) / out));
  const outBigStyle: React.CSSProperties = {
    opacity: 1 - outBigP,
    transform: `translateY(${-14 * scale * outBigP}px) scale(${1 + 0.03 * outBigP})`,
    filter: `blur(${3 * outBigP}px)`,
  };

  // B 镜缓动
  const bOpacity = t < cut ? 0 : power1InOut(clamp01((t - cut) / 0.5));
  const bScale = t < cut ? 1.02 : lerp(1.02, 1.0, power1InOut(clamp01((t - cut) / 0.5)));

  const inBigP = power2Out(clamp01((t - 1.68) / 0.42));
  const inBigStyle: React.CSSProperties = {
    opacity: inBigP,
    transform: `translateY(${16 * scale * (1 - inBigP)}px) scale(${0.94 + 0.06 * inBigP})`,
  };

  const defaultFrom = (
    <div style={{...outBigStyle, fontSize: 64 * scale, fontWeight: 800, color: theme.foreground}}>
      概念解析
    </div>
  );
  const defaultTo = (
    <div style={{...inBigStyle, fontSize: 64 * scale, fontWeight: 800, color: theme.accent}}>
      实证落地
    </div>
  );

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      {/* 场景 A */}
      <AbsoluteFill style={{
        opacity: aOpacity,
        transform: `scale(${aScale})`,
        display: 'grid',
        placeItems: 'center',
      }}>
        {from ?? defaultFrom}
      </AbsoluteFill>

      {/* 场景 B */}
      <AbsoluteFill style={{
        opacity: bOpacity,
        transform: `scale(${bScale})`,
        display: 'grid',
        placeItems: 'center',
      }}>
        {to ?? defaultTo}
      </AbsoluteFill>

      {/* 粒子流 */}
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
        {/* 出场粒子 */}
        {particles.map((p, i) => {
          const t0 = at + p.delay;
          const peak = 0.4 + p.r(5) * 0.45;
          const fadeIn = power1Out(clamp01((t - t0) / 0.12));
          const fadeOut = power1Out(clamp01((t - (t0 + out * 0.55)) / 0.30));
          const fly = power2Out(clamp01((t - t0) / (out + 0.35)));
          const y = -rise * (0.55 + p.r(6) * 0.6) * fly;
          const x = (p.r(7) - 0.5) * 2 * sway * fly;
          return (
            <div
              key={`out-${i}`}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                left: p.left,
                top: p.top,
                borderRadius: '50%',
                background: theme.accent,
                opacity: peak * fadeIn * (1 - fadeOut),
                transform: `translate(${x}px, ${y}px)`,
                boxShadow: `0 0 8px ${theme.accent}`,
              }}
            />
          );
        })}

        {/* 入场粒子（同 seed） */}
        {particles.map((p, i) => {
          const d2 = cut - 0.06 + p.r(8) * 0.20;
          const peak = 0.4 + p.r(5) * 0.45;
          const fadeIn = power1Out(clamp01((t - d2) / 0.12));
          const fadeOut = power1Out(clamp01((t - (d2 + gather - 0.20)) / 0.24));
          const g = power2Out(clamp01((t - d2) / gather));
          const y = rise * (0.5 + p.r(6) * 0.5) * (1 - g);
          const x = (p.r(7) - 0.5) * 2 * sway * (1 - g);
          return (
            <div
              key={`in-${i}`}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                left: p.left,
                top: p.top,
                borderRadius: '50%',
                background: theme.accent,
                opacity: t < d2 ? 0 : peak * fadeIn * (1 - fadeOut),
                transform: `translate(${x}px, ${y}px)`,
                boxShadow: `0 0 8px ${theme.accent}`,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
