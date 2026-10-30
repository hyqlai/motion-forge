import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type CornerBracketFrameProps = {
  title?: string;
  subtitle?: string;
  theme: Theme;
  durationInFrames: number;
};

export const CornerBracketFrame: React.FC<CornerBracketFrameProps> = ({
  title = '本期只讲清楚这一件事',
  subtitle = 'FOCUS FRAMING · 核心论点',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const bracketDur = 0.45;
  const bracketIn = 18 * scale;
  const pBracket = power2Out(clamp01((t - 0.2) / bracketDur));
  const curOffset = lerp(bracketIn, 0, pBracket);

  const textP = power3Out(clamp01((t - 0.4) / 0.5));

  const frameW = 620 * scale;
  const frameH = 260 * scale;
  const L = 22 * scale;

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      <div style={{position: 'relative', width: frameW, height: frameH, display: 'grid', placeItems: 'center'}}>
        {/* 四角 L 取景框 */}
        {/* 左上 */}
        <div style={{
          position: 'absolute',
          left: -curOffset,
          top: -curOffset,
          width: L,
          height: L,
          borderLeft: `3px solid ${theme.accent}`,
          borderTop: `3px solid ${theme.accent}`,
          opacity: pBracket,
        }} />
        {/* 右上 */}
        <div style={{
          position: 'absolute',
          right: -curOffset,
          top: -curOffset,
          width: L,
          height: L,
          borderRight: `3px solid ${theme.accent}`,
          borderTop: `3px solid ${theme.accent}`,
          opacity: pBracket,
        }} />
        {/* 左下 */}
        <div style={{
          position: 'absolute',
          left: -curOffset,
          bottom: -curOffset,
          width: L,
          height: L,
          borderLeft: `3px solid ${theme.accent}`,
          borderBottom: `3px solid ${theme.accent}`,
          opacity: pBracket,
        }} />
        {/* 右下 */}
        <div style={{
          position: 'absolute',
          right: -curOffset,
          bottom: -curOffset,
          width: L,
          height: L,
          borderRight: `3px solid ${theme.accent}`,
          borderBottom: `3px solid ${theme.accent}`,
          opacity: pBracket,
        }} />

        {/* 框内文本 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14 * scale,
          opacity: textP,
          transform: `translateY(${lerp(12 * scale, 0, textP)}px)`,
        }}>
          <div style={{fontSize: 14 * scale, fontWeight: 750, color: theme.accent, letterSpacing: 2 * scale}}>
            {subtitle}
          </div>
          <div style={{fontSize: 38 * scale, fontWeight: 800, whiteSpace: 'nowrap'}}>
            {title}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
