import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {lerp, linear, power2Out, power3In, power4Out, sineInOut, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type BlackSlamProps = {
  from: React.ReactNode;
  to: React.ReactNode;
  theme: Theme;
  durationInFrames: number;
};

// 由底色亮度决定重音层极性：深底用白色径向过曝（峰值 0.6），浅底用暗压（峰值 0.34）
const isDarkBackground = (color: string): boolean => {
  const hex = color.replace('#', '');
  if (hex.length < 6) return false;
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5;
};

// 全片唯一的一次硬切：出场侧定格一拍做预备（末段不加相机键），重音冲顶后 hardOut 直接消失；
// 入场侧满亮直切且同帧自带运动——三段递减震位 + 从 1.10 后拉刹住，随后慢漂交班
export const BlackSlam: React.FC<BlackSlamProps> = ({from, to, theme, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const hold = 0.8;
  const freeze = 0.34;
  const punch = 0.12;
  const kick = 0.5;
  const kickScale = 1.1;
  const shake = 9 * scale;
  const cut = hold + punch;
  const kickEnd = cut + kick;
  // 结尾慢漂时长随时长伸缩，保底 0.6s
  const holdEnd = Math.max(0.6, durationInFrames / fps - kickEnd);

  const dark = isDarkBackground(theme.background);
  const peak = dark ? 0.6 : 0.34;
  const flash = dark
    ? 'radial-gradient(ellipse at 50% 46%, rgba(255,255,255,1) 0%, rgba(255,255,255,.55) 45%, rgba(255,255,255,.2) 80%)'
    : 'radial-gradient(ellipse at 50% 46%, rgba(20,20,24,1) 0%, rgba(20,20,24,.55) 45%, rgba(20,20,24,.2) 80%)';

  // A：前段慢推 1→1.06，末段定格（不加键 = 定格），切点 hardOut
  const aScale = lerp(1, 1.06, tween(t, 0, hold - freeze, sineInOut));
  const aOpacity = t < cut ? 1 : 0;

  // 重音层：切点前 power3In 冲顶，切点后 power2Out 回落
  const flashOpacity = t < cut
    ? lerp(0, peak, tween(t, hold, punch, power3In))
    : lerp(peak, 0, tween(t, cut, 0.2, power2Out));

  // B：满亮直切 + 震一拍（+9 → −4.95 → +2.52 → 0，前两段线性、末段 power2Out）+ 后拉刹住
  const bOpacity = t < cut ? 0 : 1;
  let bX = 0;
  if (t >= cut && t < cut + 0.06) bX = lerp(shake, -shake * 0.55, tween(t, cut, 0.06, linear));
  else if (t >= cut + 0.06 && t < cut + 0.12) bX = lerp(-shake * 0.55, shake * 0.28, tween(t, cut + 0.06, 0.06, linear));
  else if (t >= cut + 0.12 && t < cut + 0.2) bX = lerp(shake * 0.28, 0, tween(t, cut + 0.12, 0.08, power2Out));
  else if (t >= kickEnd) bX = lerp(0, 10 * scale, tween(t, kickEnd, holdEnd, sineInOut));
  const bScale = t < kickEnd
    ? lerp(kickScale, 1, tween(t, cut, kick, power4Out))
    : lerp(1, 1.03, tween(t, kickEnd, holdEnd, sineInOut));

  return (
    <AbsoluteFill style={{background: theme.background, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: '-14%', opacity: aOpacity, transform: `scale(${aScale})`}}>
        {from}
      </div>
      <div style={{position: 'absolute', inset: '-14%', opacity: bOpacity, transform: `translate(${bX}px, 0px) scale(${bScale})`}}>
        {to}
      </div>
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: flash, opacity: flashOpacity}} />
    </AbsoluteFill>
  );
};
