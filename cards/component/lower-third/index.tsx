import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {power2In, power2Out, power4In, power4Out, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type LowerThirdProps = {
  name: string;
  title: string;
  theme: Theme;
  durationInFrames: number;
};

// 三段接力：色条 scaleX 展开 → 姓名在色条走完 70% 时 clip 揭示 → 头衔延迟 0.15s 跟进；
// 出场反向收回（头衔先收 → 姓名 → 色条），直接淡出会读作素材播完
export const LowerThird: React.FC<LowerThirdProps> = ({name, title, theme, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const t0 = 0.4;
  const barDur = 0.3;
  const nameDur = 0.25;
  const titleLag = 0.15;
  const outDur = 0.3;
  // hold 随时长伸缩：总时长减去入场、出场与尾部余量，剩下的都给停留
  const hold = Math.max(0.6, durationInFrames / fps - t0 - barDur - outDur - 0.56);
  const nameAt = t0 + barDur * 0.7;
  const titleAt = nameAt + titleLag;
  const outAt = t0 + barDur + hold;

  const barScale = t < outAt + 0.16
    ? tween(t, t0, barDur, power4Out)
    : 1 - tween(t, outAt + 0.16, outDur, power4In);
  const nameShown = t < outAt + 0.08
    ? tween(t, nameAt, nameDur, power2Out)
    : 1 - tween(t, outAt + 0.08, outDur * 0.7, power2In);
  const titleShown = t < outAt
    ? tween(t, titleAt, nameDur, power2Out)
    : 1 - tween(t, outAt, outDur * 0.7, power2In);
  const clip = (shown: number) => `inset(0% ${(1 - shown) * 100}% 0% 0%)`;

  return (
    <AbsoluteFill style={{background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 56 * scale, bottom: 64 * scale}}>
        <div style={{
          fontSize: 42 * scale, fontWeight: 800, lineHeight: 1.15,
          letterSpacing: 2 * scale, clipPath: clip(nameShown),
        }}>
          {name}
        </div>
        <div style={{
          height: 7 * scale, width: '100%', background: theme.accent, borderRadius: 2 * scale,
          margin: `${10 * scale}px 0`, transform: `scaleX(${barScale})`, transformOrigin: 'left center',
        }} />
        <div style={{
          fontSize: 19 * scale, color: theme.muted, letterSpacing: 1.5 * scale,
          clipPath: clip(titleShown),
        }}>
          {title}
        </div>
      </div>
    </AbsoluteFill>
  );
};
