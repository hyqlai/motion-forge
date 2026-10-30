import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, lerp, power2In, power2Out, power3Out, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type QuoteCardProps = {
  lines: string[];
  keywords?: string[];
  source?: string;
  theme: Theme;
  durationInFrames: number;
  children?: React.ReactNode;
};

const highlight = (line: string, keywords: string[], accent: string): React.ReactNode => {
  const keyword = keywords.find((item) => item && line.includes(item));
  if (!keyword) return line;
  const [before, after] = line.split(keyword, 2);
  return <>{before}<span style={{color: accent, fontSize: '1.2em'}}>{keyword}</span>{after}</>;
};

export const QuoteCard: React.FC<QuoteCardProps> = ({
  lines,
  keywords = [],
  source,
  theme,
  durationInFrames,
  children,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const outAt = Math.max(1.5, (durationInFrames - Math.round(0.3 * fps)) / fps);
  const outProgress = tween(t, outAt, 0.3, power2In);
  const panelOpacity = t < outAt
    ? lerp(0, 1, tween(t, 0.15, 0.25, power2Out))
    : 1 - outProgress;
  const scale = width / 960;

  return (
    <AbsoluteFill style={{background: theme.background, overflow: 'hidden', fontFamily: theme.fontFamily}}>
      {children}
      <div style={{
        position: 'absolute', inset: 0, background: theme.background, color: theme.foreground,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        gap: 22 * scale, padding: `0 ${32 * scale}px`, opacity: panelOpacity,
        transform: `translateY(${lerp(0, 40 * scale, outProgress)}px)`,
      }}>
        {lines.map((line, index) => {
          const progress = tween(t, 0.35 + index * 0.15, 0.4, power3Out);
          return (
            <div key={`${line}-${index}`} style={{
              fontSize: 42 * scale, fontWeight: 800, lineHeight: 1.25, letterSpacing: 2 * scale,
              textAlign: 'center', opacity: progress,
              transform: `translateY(${lerp(30 * scale, 0, progress)}px)`,
            }}>{highlight(line, keywords, theme.accent)}</div>
          );
        })}
        {source ? <div style={{color: theme.muted, fontSize: 16 * scale, letterSpacing: 3 * scale, opacity: tween(t, 1.1, 0.3, power2Out)}}>{source}</div> : null}
      </div>
    </AbsoluteFill>
  );
};
