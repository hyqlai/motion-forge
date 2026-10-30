import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {lerp, power2In, power2Out, power3Out, sineInOut, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type InfoTermCardProps = {
  term: string;
  termEn?: string;
  desc: string;
  icon?: string;
  /** 卡片停靠侧：默认右侧，人物在右时传 left */
  side?: 'left' | 'right';
  theme: Theme;
  durationInFrames: number;
};

// yoyo tween 进度：往返半周期 plays 次，偶数趟正放、奇数趟倒放
const yoyoProgress = (time: number, start: number, half: number, plays: number): number => {
  if (time <= start) return 0;
  const cycle = (time - start) / half;
  if (cycle >= plays) return plays % 2 === 1 ? 1 : 0;
  const leg = Math.floor(cycle);
  const progress = cycle - leg;
  return leg % 2 === 1 ? 1 - progress : progress;
};

const CONFIG = {
  slideIn: 0.35,     // 入场耗时 s（power3.out）
  overshootPx: 12,   // 入场过冲距离：0 就没有"弹"感
  floatPx: 6,        // 悬浮幅度 ±px：>10 像漂走
  floatPeriod: 2.8,  // 悬浮周期 s（一个来回）
  slideOut: 0.25,    // 出场原路滑出
  iconTilt: 8,       // 图标微转角度 °
};

export const InfoTermCard: React.FC<InfoTermCardProps> = ({
  term,
  termEn,
  desc,
  icon = '¥',
  side = 'right',
  theme,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;
  const offX = 480 * scale * (side === 'right' ? 1 : -1);

  // x：滑入 → 过冲回稳 → 停留后原路滑出；停留段随镜头时长伸缩
  const duration = durationInFrames / fps;
  const outAt = Math.max(CONFIG.slideIn + 0.16 + 0.5, duration - CONFIG.slideOut);
  const x = t < CONFIG.slideIn
    ? lerp(offX, -Math.sign(offX) * CONFIG.overshootPx * scale, tween(t, 0, CONFIG.slideIn, power3Out))
    : t < outAt
      ? lerp(-Math.sign(offX) * CONFIG.overshootPx * scale, 0, tween(t, CONFIG.slideIn, 0.16, power2Out))
      : lerp(0, offX, tween(t, outAt, CONFIG.slideOut, power2In));

  // 落位后：y 正弦浮动营造"悬浮"，图标跟着微转
  const floatStart = CONFIG.slideIn + 0.16 + 0.05;
  const floatProgress = sineInOut(yoyoProgress(t, floatStart, CONFIG.floatPeriod / 2, 4));
  const y = CONFIG.floatPx * scale * floatProgress;
  const iconRotation = CONFIG.iconTilt * floatProgress;

  const card = (
    <div style={{
      position: 'absolute',
      [side]: 56 * scale,
      top: '36%',
      width: 330 * scale,
      display: 'flex',
      gap: 14 * scale,
      alignItems: 'flex-start',
      padding: `${20 * scale}px ${22 * scale}px`,
      borderRadius: 16 * scale,
      background: theme.background,
      border: `1px solid ${theme.muted}55`,
      boxShadow: '0 10px 24px rgba(0, 0, 0, 0.28)',
      color: theme.foreground,
      transform: `translate(${x}px, ${y}px)`,
    }}>
      <div style={{
        flex: '0 0 auto',
        width: 46 * scale,
        height: 46 * scale,
        borderRadius: '50%',
        background: `${theme.accent}1f`,
        border: `1px solid ${theme.accent}55`,
        color: theme.accent,
        fontSize: 22 * scale,
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `rotate(${iconRotation}deg)`,
      }}>{icon}</div>
      <div>
        <div style={{fontSize: 20 * scale, fontWeight: 700, marginBottom: 6 * scale}}>
          {term}
          {termEn ? <small style={{fontSize: 13 * scale, fontWeight: 600, color: theme.muted, marginLeft: 6 * scale}}>{termEn}</small> : null}
        </div>
        <div style={{fontSize: 14 * scale, lineHeight: 1.55, color: theme.muted}}>{desc}</div>
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily, overflow: 'hidden'}}>
      {card}
    </AbsoluteFill>
  );
};
