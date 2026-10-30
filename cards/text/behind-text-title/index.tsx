import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type BehindTextTitleProps = {
  bgWord?: string;
  frontText?: string;
  theme: Theme;
  durationInFrames: number;
};

export const BehindTextTitle: React.FC<BehindTextTitleProps> = ({
  bgWord = 'CINEMATIC',
  frontText = '真正的深度，在前后层次之间',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const titleP = power3Out(clamp01((t - 0.2) / 0.6));
  const bgScale = lerp(0.92, 1.05, clamp01(t / 3.0));

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      {/* 背后层：超大号穿透大字 */}
      <div style={{
        position: 'absolute',
        fontSize: 160 * scale,
        fontWeight: 900,
        letterSpacing: 8 * scale,
        color: `${theme.muted}18`,
        transform: `scale(${bgScale})`,
        transformOrigin: '50% 50%',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        willChange: 'transform',
      }}>
        {bgWord}
      </div>

      {/* 前景层：主体卡片与正文 */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16 * scale,
        opacity: titleP,
        transform: `translateY(${lerp(20 * scale, 0, titleP)}px)`,
      }}>
        <div style={{
          padding: `${8 * scale}px ${20 * scale}px`,
          background: theme.accent,
          color: '#0c111b',
          borderRadius: 20 * scale,
          fontSize: 14 * scale,
          fontWeight: 800,
          letterSpacing: 2 * scale,
        }}>
          CHAPTER TITLING
        </div>
        <div style={{
          fontSize: 36 * scale,
          fontWeight: 800,
          textAlign: 'center',
          lineHeight: 1.3,
        }}>
          {frontText}
        </div>
      </div>
    </AbsoluteFill>
  );
};
