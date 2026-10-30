import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {cubicBezier, lerp, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type CharRiseProps = {
  text: string;
  theme: Theme;
  durationInFrames: number;
};

// 逐字错峰 1 帧（0.033s）—— 错峰极小，整句读作"一股气顶上来"而不是一个个蹦；
// 位移与淡入用两条不同的缓动，这是它比普通上滑淡入更"有骨头"的原因
const CONFIG = {
  lead: 0.30,        // 起手静置：等口播开口
  dur: 0.70,         // 淡入时长 s
  travel: 0.3333,    // 位移时长 s = dur 的 48%
  stagger: 0.0333,   // 逐字错峰 s
  rise: 32,          // 起始下沉 px（比例恒为字号 44%；72px ⇒ 32）
};

const FADE_EASE = cubicBezier(0.2, 0.8, 0.2, 1);      // 淡入：起手快、尾段长缓收
const TRAVEL_EASE = cubicBezier(0.2, 0.8, 0.6, 0.85); // 位移：冲一下就滑到位

export const CharRise: React.FC<CharRiseProps> = ({text, theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;
  // Array.from 按码点切字：中文即逐汉字（标点也算一个字，跟着升起是对的）
  const chars = Array.from(text);

  return (
    <AbsoluteFill style={{background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily, overflow: 'hidden', alignItems: 'center', justifyContent: 'center'}}>
      <span style={{fontSize: 72 * scale, fontWeight: 600, lineHeight: 1.25, letterSpacing: '-0.05em', whiteSpace: 'nowrap'}}>
        {chars.map((char, index) => {
          const at = CONFIG.lead + index * CONFIG.stagger;
          // 轨① 淡入：走满 dur（比位移长一倍，位移先停、淡入后停）
          const fade = tween(t, at, CONFIG.dur, FADE_EASE);
          // 轨② 升起位移：只占前 travel，另一条缓动
          const y = lerp(CONFIG.rise * scale, 0, tween(t, at, CONFIG.travel, TRAVEL_EASE));
          return (
            <span key={index} style={{
              display: 'inline-block', whiteSpace: 'pre', backfaceVisibility: 'hidden',
              transformOrigin: '50% 55%', // 重心略偏下，升起收尾时字不往上飘
              opacity: fade, transform: `translateY(${y}px)`,
            }}>{char}</span>
          );
        })}
      </span>
    </AbsoluteFill>
  );
};
