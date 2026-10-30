import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, clamp01, lerp, power4Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type KeywordPopHighlightProps = {
  prefix?: string;
  keyword?: string;
  suffix?: string;
  theme: Theme;
  durationInFrames: number;
  delay?: number;
  popScale?: number;
};

export const KeywordPopHighlight: React.FC<KeywordPopHighlightProps> = ({
  prefix = '这家公司一年烧掉',
  keyword = '300个亿',
  suffix = '，还在疯狂扩张',
  theme,
  delay = 0.55,
  popScale = 1.65,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scaleRatio = width / 960;

  const popIn = 0.18;
  const settle = 0.22;
  const restScale = 1.15;
  const shakePx = 7 * scaleRatio;

  // ① 弹出：scale 0→popScale（power4Out）并在 settleAt 回落至 restScale
  const popP = power4Out(clamp01((t - delay) / popIn));
  const settleAt = delay + 0.24;
  const settleP = backOut(2.5)(clamp01((t - settleAt) / settle));

  const scale = t < settleAt
    ? lerp(0, popScale, popP)
    : lerp(popScale, restScale, settleP);

  const rotate = t < settleAt ? lerp(-8, 2, popP) : lerp(2, 0, settleP);
  const opacity = popP;

  // ② 震屏
  const shakeVals = [0, shakePx, -shakePx, shakePx, -shakePx, shakePx, 0];
  let shakeX = 0;
  if (t >= delay && t < delay + 0.24) {
    const seg = ((t - delay) / 0.24) * (shakeVals.length - 1);
    const i = Math.min(shakeVals.length - 2, Math.floor(seg));
    shakeX = lerp(shakeVals[i], shakeVals[i + 1], seg - i);
  }

  return (
    <AbsoluteFill style={{
      background: theme.background,
      overflow: 'hidden',
    }}>
      <AbsoluteFill style={{
        background: theme.background,
        color: theme.foreground,
        fontFamily: theme.fontFamily,
        transform: `translateX(${shakeX}px)`,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 40px',
      }}>
        <div style={{
          fontSize: 40 * scaleRatio,
          fontWeight: 650,
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'baseline',
        }}>
          <span>{prefix}</span>
          <span style={{
            display: 'inline-block',
            position: 'relative',
            margin: '0 0.36em',
            padding: '0.04em 0.22em',
            fontWeight: 800,
            color: '#0c111b',
            background: theme.accent,
            borderRadius: 6 * scaleRatio,
            transformOrigin: '50% 80%',
            opacity,
            transform: `rotate(${rotate}deg) scale(${scale})`,
          }}>
            {keyword}
          </span>
          <span>{suffix}</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
