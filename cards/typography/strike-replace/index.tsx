import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {lerp, power1Out, power2Out, power3Out, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type StrikeReplaceProps = {
  prefix: string;
  from: string;
  to: string;
  suffix?: string;
  theme: Theme;
  durationInFrames: number;
};

export const StrikeReplace: React.FC<StrikeReplaceProps> = ({prefix, from, to, suffix = '', theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;
  const strike = tween(t, 0.35, 0.15, power3Out);
  const swapAt = 0.6;
  const fromOpacity = 1 - tween(t, swapAt, 0.25, power1Out);
  const toProgress = tween(t, swapAt, 0.25, power2Out);
  const ruler = from.length >= to.length ? from : to;

  return (
    <AbsoluteFill style={{background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily, alignItems: 'center', justifyContent: 'center', padding: 48 * scale}}>
      <div style={{fontSize: 34 * scale, fontWeight: 700, lineHeight: 1.5, whiteSpace: 'nowrap'}}>
        {prefix}
        <span style={{position: 'relative', display: 'inline-block', verticalAlign: 'baseline'}}>
          <span style={{visibility: 'hidden'}}>{ruler}</span>
          <span style={{position: 'absolute', left: '50%', top: 0, opacity: fromOpacity, transform: 'translateX(-50%)', whiteSpace: 'nowrap'}}>
            {from}<span style={{position: 'absolute', left: 0, top: '50%', width: '100%', height: 3 * scale, background: theme.accent, transform: `translateY(-50%) scaleX(${strike})`, transformOrigin: 'left center'}} />
          </span>
          <span style={{position: 'absolute', left: '50%', top: 0, color: theme.accent, opacity: toProgress, transform: `translateX(-50%) translateY(${lerp(8 * scale, 0, toProgress)}px)`, whiteSpace: 'nowrap'}}>{to}</span>
        </span>
        {suffix}
      </div>
    </AbsoluteFill>
  );
};
