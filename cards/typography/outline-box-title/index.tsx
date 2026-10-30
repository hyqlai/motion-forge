import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power1Out, power2InOut, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type OutlineBoxTitleProps = {
  boxText?: string;
  chipText?: string;
  theme: Theme;
  durationInFrames: number;
};

const BOX_LEN = 880;

export const OutlineBoxTitle: React.FC<OutlineBoxTitleProps> = ({
  boxText = '核心观点',
  chipText = '在这里',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const lead = 0.35;
  const boxDur = 0.45;
  const chipGap = 0.08;
  const chipDur = 0.26;
  const chipTxtLag = 0.08;
  const chevStagger = 0.08;
  const chevDur = 0.22;

  // ① 框选描边
  const boxP = power2InOut(clamp01((t - lead) / boxDur));
  const dashOffset = BOX_LEN * (1 - boxP);

  // ② chip 展开 + 白字滞后
  const chipAt = lead + boxDur + chipGap;
  const chipScaleX = power3Out(clamp01((t - chipAt) / chipDur));
  const chipTxtOpacity = power1Out(clamp01((t - (chipAt + chipTxtLag)) / 0.16));

  // ③ chevron 依次点亮
  const chevAt = chipAt + chipDur + 0.06;

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      paddingLeft: 96 * scale,
      overflow: 'hidden',
    }}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
        {/* 描边框与文字 */}
        <div style={{position: 'relative', width: 356 * scale, height: 104 * scale}}>
          <div style={{
            position: 'absolute',
            left: 30 * scale,
            top: 22 * scale,
            fontSize: 56 * scale,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: 2 * scale,
            whiteSpace: 'nowrap',
          }}>
            {boxText}
          </div>
          <svg viewBox="0 0 356 104" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible'}}>
            <path
              d="M 34 2 H 342 A 14 14 0 0 1 354 16 V 88 A 14 14 0 0 1 342 102 H 14 A 14 14 0 0 1 2 88 V 16 A 14 14 0 0 1 14 2 Z"
              fill="none"
              stroke={theme.accent}
              strokeWidth={4 * scale}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={BOX_LEN}
              strokeDashoffset={dashOffset}
            />
          </svg>
        </div>

        {/* 实色胶囊 chip */}
        <div style={{position: 'relative', marginTop: 22 * scale, height: 66 * scale, width: 260 * scale}}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: theme.accent,
            borderRadius: 12 * scale,
            transformOrigin: 'left center',
            transform: `scaleX(${chipScaleX})`,
          }} />
          <div style={{
            position: 'absolute',
            left: 26 * scale,
            top: 13 * scale,
            fontSize: 40 * scale,
            fontWeight: 800,
            lineHeight: 1,
            color: '#0c111b',
            letterSpacing: 2 * scale,
            whiteSpace: 'nowrap',
            opacity: chipTxtOpacity,
          }}>
            {chipText}
          </div>
        </div>

        {/* 三枚指示箭头 */}
        <div style={{display: 'flex', gap: 10 * scale, marginTop: 36 * scale}}>
          {[0, 1, 2].map((i) => {
            const p = power2Out(clamp01((t - (chevAt + i * chevStagger)) / chevDur));
            return (
              <svg
                key={i}
                viewBox="0 0 26 34"
                style={{
                  width: 26 * scale,
                  height: 34 * scale,
                  opacity: lerp(0.2, 1, p),
                  transform: `translateX(${lerp(12 * scale, 0, p)}px)`,
                }}
              >
                <path d="M 7 5 L 19 17 L 7 29" fill="none" stroke={theme.accent} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
