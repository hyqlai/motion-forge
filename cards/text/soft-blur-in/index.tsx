import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, cubicBezier, lerp} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type SoftBlurInProps = {
  text?: string;
  theme: Theme;
  durationInFrames: number;
};

const EASE = cubicBezier(0.22, 1, 0.36, 1);

export const SoftBlurIn: React.FC<SoftBlurInProps> = ({
  text = '答案往往没那么复杂',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const lead = 0.30;
  const dur = 0.90;
  const travel = 0.30;
  const stagger = 0.0333;
  const blurStart = 12 * scale;
  const rise = 16 * scale;

  const chars = Array.from(text);

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
        fontSize: 64 * scale,
        fontWeight: 750,
        lineHeight: 1.25,
        letterSpacing: '-0.02em',
        whiteSpace: 'nowrap',
      }}>
        {chars.map((char, index) => {
          const at = lead + index * stagger;
          const p = EASE(clamp01((t - at) / dur));
          const pTravel = EASE(clamp01((t - at) / travel));

          const currentBlur = lerp(blurStart, 0, p);
          const currentY = lerp(rise, 0, pTravel);

          return (
            <span
              key={index}
              style={{
                display: 'inline-block',
                whiteSpace: 'pre',
                opacity: p,
                filter: `blur(${currentBlur.toFixed(2)}px)`,
                transform: `translateY(${currentY}px)`,
                transformOrigin: '50% 55%',
                willChange: 'filter, opacity, transform',
              }}
            >
              {char}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
