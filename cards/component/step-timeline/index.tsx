import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, lerp, power1InOut, power3Out, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type TimelineStep = {kicker: string; title: string};
export type StepTimelineProps = {
  steps: TimelineStep[];
  activeIndex?: number;
  theme: Theme;
  durationInFrames: number;
};

const inverseEase = (value: number): number => value < 0.5 ? Math.sqrt(value / 2) : 1 - Math.sqrt((1 - value) / 2);

export const StepTimeline: React.FC<StepTimelineProps> = ({steps, activeIndex = 0, theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;
  const line = tween(t, 0.4, 0.6, power1InOut);
  const lastEnd = 1.1;
  const ring = tween(t, lastEnd, 0.22, power3Out);

  return (
    <AbsoluteFill style={{background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'relative', width: 520 * scale, height: 300 * scale, marginLeft: 30 * scale}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 2 * scale, height: '100%', background: theme.muted, transform: `scaleY(${line})`, transformOrigin: '50% 0%'}} />
        {steps.map((step, index) => {
          const y = steps.length === 1 ? 0 : index / (steps.length - 1) * 280 * scale;
          const at = 0.4 + 0.6 * inverseEase(index / Math.max(1, steps.length - 1));
          const pop = tween(t, at, 0.18, backOut(1.6));
          const text = tween(t, at + 0.067, 0.26, power3Out);
          const active = index === activeIndex;
          return (
            <React.Fragment key={step.title}>
              <div style={{position: 'absolute', left: -7 * scale, top: y, width: 16 * scale, height: 16 * scale, borderRadius: '50%', background: active ? theme.background : theme.accent, border: `${active ? 3 * ring * scale : 0}px solid ${theme.accent}`, transform: `scale(${active ? lerp(pop, 1.25, ring) : pop})`}} />
              <div style={{position: 'absolute', left: 36 * scale, top: y - 22 * scale, opacity: text, transform: `translateX(${lerp(-8 * scale, 0, text)}px)`}}>
                <div style={{color: theme.muted, fontSize: 14 * scale, letterSpacing: 2 * scale, marginBottom: 5 * scale}}>{step.kicker}</div>
                <div style={{fontSize: 25 * scale, fontWeight: 650, whiteSpace: 'nowrap'}}>{step.title}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
