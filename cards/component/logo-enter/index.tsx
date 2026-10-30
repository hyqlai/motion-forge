import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, clamp01, lerp, power2InOut, power3Out, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type LogoEnterProps = {
  brand: string;
  tagline?: string;
  logo?: React.ReactNode;
  theme: Theme;
  durationInFrames: number;
};

export const LogoEnter: React.FC<LogoEnterProps> = ({brand, tagline, logo, theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;
  const badge = tween(t, 0.35, 0.6, backOut(1.1));
  const brandProgress = tween(t, 0.583, 0.45, power3Out);
  const tagProgress = tween(t, 0.816, 0.45, power3Out);
  const ringLength = 2 * Math.PI * 62 + 3;
  const ringOffset = lerp(ringLength, 0, tween(t, 0.583, 0.7, power2InOut));

  return (
    <AbsoluteFill style={{background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 26 * scale}}>
        <div style={{position: 'relative', width: 128 * scale, height: 128 * scale, display: 'grid', placeItems: 'center'}}>
          <div style={{width: 118 * scale, height: 118 * scale, borderRadius: '50%', background: theme.accent, display: 'grid', placeItems: 'center', color: theme.background, fontSize: 42 * scale, fontWeight: 900, opacity: clamp01(badge), transform: `translateY(${lerp(22 * scale, 0, badge)}px) scale(${lerp(0.5, 1, badge)})`}}>
            {logo ?? brand.slice(0, 1)}
          </div>
          <svg viewBox="0 0 128 128" style={{position: 'absolute', inset: 0, transform: 'rotate(-90deg)'}}>
            <circle cx="64" cy="64" r="62" fill="none" stroke={theme.foreground} strokeWidth={2} strokeDasharray={ringLength} strokeDashoffset={ringOffset} />
          </svg>
        </div>
        <div>
          <div style={{fontSize: 46 * scale, fontWeight: 800, whiteSpace: 'nowrap', opacity: brandProgress, transform: `translateX(${lerp(-20 * scale, 0, brandProgress)}px)`}}>{brand}</div>
          {tagline ? <div style={{color: theme.muted, fontSize: 17 * scale, letterSpacing: 4 * scale, marginTop: 8 * scale, opacity: tagProgress, transform: `translateX(${lerp(-20 * scale, 0, tagProgress)}px)`}}>{tagline}</div> : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
