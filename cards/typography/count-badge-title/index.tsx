import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power1Out, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type CountBadgeTitleProps = {
  count?: string | number;
  suffix?: string;
  subline?: string;
  theme: Theme;
  durationInFrames: number;
  startDelay?: number;
  numIn?: number;
};

export const CountBadgeTitle: React.FC<CountBadgeTitleProps> = ({
  count = '3',
  suffix = '个方法',
  subline = '解决核心问题',
  theme,
  startDelay = 0.40,
  numIn = 0.30,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const hueDur = 0.14;
  const restLag = 0.02;
  const restIn = 0.22;
  const restX = -8 * scale;
  const l2Lag = 0.10;
  const l2In = 0.28;
  const l2Rise = 6 * scale;
  const punchGap = 0.35;
  const punchScale = 1.06;

  const tLand = startDelay + numIn;
  const tRest = tLand + restLag;
  const tL2 = tRest + l2Lag;
  const tPunch = tL2 + l2In + punchGap;
  const tPunchBack = tPunch + 0.04;

  // ① 数字单独入场：从 1.6 倍缩到位
  const numInP = power3Out(clamp01((t - startDelay) / numIn));
  let currentNumScale: number;
  if (t < tPunch) {
    currentNumScale = lerp(1.6, 1, numInP);
  } else if (t < tPunchBack) {
    currentNumScale = lerp(1, punchScale, power2Out(clamp01((t - tPunch) / 0.04)));
  } else {
    currentNumScale = lerp(punchScale, 1, power3Out(clamp01((t - tPunchBack) / 0.13)));
  }

  // ② 落定时刻换色：从前景色平滑过渡到主题强调色
  const hueP = power1Out(clamp01((t - (tLand - hueDur * 0.5)) / hueDur));
  const numColor = hueP >= 1 ? theme.accent : (hueP <= 0 ? theme.foreground : theme.accent);

  // ③ 后缀文字从数字右缘被推出：clip 从左揭示 + x 追赶
  const restP = power3Out(clamp01((t - tRest) / restIn));
  const restClip = lerp(100, 0, restP);
  const currentRestX = lerp(restX, 0, restP);

  // ④ 第二行错峰跟上（淡入 + 轻微上浮）
  const l2P = power3Out(clamp01((t - tL2) / l2In));
  const currentL2Y = lerp(l2Rise, 0, l2P);

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      paddingLeft: 84 * scale,
      overflow: 'hidden',
    }}>
      <div>
        <div style={{display: 'flex', alignItems: 'baseline', whiteSpace: 'nowrap'}}>
          <span style={{
            fontSize: 138 * scale,
            fontWeight: 800,
            lineHeight: 0.92,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
            transformOrigin: '50% 72%',
            display: 'inline-block',
            opacity: numInP,
            color: numColor,
            transform: `scale(${currentNumScale})`,
          }}>
            {count}
          </span>
          <span style={{
            fontSize: 62 * scale,
            fontWeight: 700,
            lineHeight: 1.1,
            marginLeft: 14 * scale,
            display: 'inline-block',
            whiteSpace: 'nowrap',
            clipPath: `inset(0 ${restClip}% 0 0)`,
            transform: `translateX(${currentRestX}px)`,
          }}>
            {suffix}
          </span>
        </div>
        <div style={{
          fontSize: 58 * scale,
          fontWeight: 650,
          lineHeight: 1.2,
          marginTop: 10 * scale,
          whiteSpace: 'nowrap',
          color: theme.muted,
          opacity: l2P,
          transform: `translateY(${currentL2Y}px)`,
        }}>
          {subline}
        </div>
      </div>
    </AbsoluteFill>
  );
};
