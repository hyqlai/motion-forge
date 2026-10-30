import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2In, power2InOut, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type SplitCompareProps = {
  before: string;
  after: string;
  labelBefore?: string;
  labelAfter?: string;
  theme: Theme;
  durationInFrames: number;
};

const power3InOut = (value: number): number => value < 0.5 ? 8 * value ** 4 : 1 - (-2 * value + 2) ** 4 / 2;
const source = (value: string): string => /^(https?:|data:|blob:)/.test(value) ? value : staticFile(value);

export const SplitCompare: React.FC<SplitCompareProps> = ({
  before,
  after,
  labelBefore = '之前',
  labelAfter = '之后',
  theme,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;
  const exit = Math.max(7.5, (durationInFrames - 14) / fps);
  let progress = 100;
  progress = lerp(progress, 50, tween(t, 0.6, 1.4, power3InOut));
  progress = lerp(progress, 42, tween(t, 3.5, 0.45, power2InOut));
  progress = lerp(progress, 50, tween(t, 4, 0.45, power2InOut));
  progress = lerp(progress, 8, tween(t, 4.5, 1, power3InOut));
  progress = lerp(progress, 50, tween(t, 7, 1, power3InOut));
  const push = lerp(1, 1.04, clamp01(t / exit));
  const paneOpacity = 1 - tween(t, exit + 0.08, 0.4, power2In);
  const dividerOpacity = 1 - tween(t, exit + 0.04, 0.4, power2In);
  const labelOpacity = 1 - tween(t, exit, 0.4, power2In);
  const pane = (src: string, grayscale: boolean) => (
    <div style={{position: 'absolute', inset: 0, transform: `scale(${push})`, filter: grayscale ? 'saturate(.35) brightness(.82)' : undefined}}>
      <Img src={source(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </div>
  );

  return (
    <AbsoluteFill style={{background: theme.background, overflow: 'hidden', fontFamily: theme.fontFamily}}>
      <div style={{position: 'absolute', inset: 0, opacity: paneOpacity}}>{pane(after, before === after)}</div>
      <div style={{position: 'absolute', inset: 0, opacity: paneOpacity, clipPath: `inset(0 ${100 - progress}% 0 0)`}}>{pane(before, before === after)}</div>
      <div style={{position: 'absolute', top: 0, bottom: 0, left: `${progress}%`, width: 3 * scale, marginLeft: -1.5 * scale, background: '#fff', boxShadow: '0 0 18px rgba(0,0,0,.6)', opacity: dividerOpacity}}>
        <div style={{position: 'absolute', top: '50%', left: '50%', width: 46 * scale, height: 46 * scale, margin: `${-23 * scale}px 0 0 ${-23 * scale}px`, borderRadius: '50%', background: '#fff', color: '#1d1d1f', display: 'grid', placeItems: 'center', fontSize: 22 * scale}}>↔</div>
      </div>
      <div style={{position: 'absolute', left: 42 * scale, top: 42 * scale, background: 'rgba(0,0,0,.5)', color: '#fff', padding: 10 * scale, borderRadius: 20 * scale, fontSize: 18 * scale, opacity: labelOpacity, visibility: progress >= 40 ? 'visible' : 'hidden'}}>{labelBefore}</div>
      <div style={{position: 'absolute', right: 42 * scale, top: 42 * scale, background: 'rgba(0,0,0,.5)', color: '#fff', padding: 10 * scale, borderRadius: 20 * scale, fontSize: 18 * scale, opacity: labelOpacity, visibility: 100 - progress >= 40 ? 'visible' : 'hidden'}}>{labelAfter}</div>
    </AbsoluteFill>
  );
};
