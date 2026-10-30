import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {lerp, power2InOut, power2Out, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type HighlighterSweepProps = {
  heading: string;
  lines: string[];
  highlightIndex: number;
  theme: Theme;
  durationInFrames: number;
};

export const HighlighterSweep: React.FC<HighlighterSweepProps> = ({
  heading,
  lines,
  highlightIndex,
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;
  const sweep = tween(t, 0.7, 0.6, power2InOut);
  const dim = lerp(1, 0.4, tween(t, 0.7, 0.45, power2Out));
  const lift = tween(t, 1.3, 0.3, power2Out);

  return (
    <AbsoluteFill style={{background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: 700 * scale, padding: 32 * scale, border: `1px solid ${theme.muted}`, borderRadius: 8 * scale}}>
        <div style={{color: theme.muted, fontSize: 13 * scale, letterSpacing: 3 * scale, borderBottom: `1px solid ${theme.muted}`, paddingBottom: 10 * scale, marginBottom: 18 * scale}}>{heading}</div>
        {lines.map((line, index) => index === highlightIndex ? (
          <div key={line} style={{
            position: 'relative', display: 'inline-block', fontSize: 22 * scale, lineHeight: 1.9, fontWeight: 700,
            transform: `translateY(${lerp(0, -2 * scale, lift)}px) scale(${lerp(1, 1.03, lift)})`, transformOrigin: 'left center',
          }}>
            <span style={{
              position: 'absolute', left: -6 * scale, right: -8 * scale, top: 2, bottom: 0,
              background: theme.accent, opacity: 0.55, mixBlendMode: 'multiply',
              borderRadius: '12px 5px 10px 4px / 7px 12px 5px 10px',
              transform: `scaleX(${sweep})`, transformOrigin: 'left center',
            }} />
            <span style={{position: 'relative'}}>{line}</span>
          </div>
        ) : (
          <div key={line} style={{fontSize: 21 * scale, lineHeight: 1.9, opacity: dim}}>{line}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
