import React, {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

export type TypewriterRevealProps = {
  lines: string[];
  theme: Theme;
  durationInFrames: number;
};

const timesFor = (text: string, seed: string, start: number): number[] => {
  let time = start;
  return Array.from(text).map((_, index) => {
    time += (55 + (random(`${seed}-${index}`) * 2 - 1) * 20) / 1000;
    return time;
  });
};

export const TypewriterReveal: React.FC<TypewriterRevealProps> = ({lines, theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;
  const timing = useMemo(() => {
    const first = timesFor(lines[0] ?? '', 'tw-first', 0.4);
    const firstEnd = first.at(-1) ?? 0.4;
    const secondStart = firstEnd + 0.08 + 3 * 0.5 + 0.4;
    const second = timesFor(lines[1] ?? '', 'tw-second', secondStart);
    return {first, second, firstEnd, secondStart, secondEnd: second.at(-1) ?? secondStart};
  }, [lines]);
  const firstCount = timing.first.filter((time) => t >= time).length;
  const secondCount = timing.second.filter((time) => t >= time).length;
  const blink = (start: number): number => {
    if (t < start || t >= start + 1.5) return 1;
    return (t - start) % 0.5 < 0.25 ? 0 : 1;
  };
  const loopOpacity = t < timing.secondEnd + 0.1 ? 1 : (t - timing.secondEnd) % 0.52 < 0.26 ? 0 : 1;

  return (
    <AbsoluteFill style={{background: theme.background, color: theme.foreground, fontFamily: 'Menlo, Consolas, monospace', justifyContent: 'center', padding: 70 * scale}}>
      <div style={{fontSize: 36 * scale, fontWeight: 700, letterSpacing: 2 * scale, minHeight: 58 * scale}}>
        <span>{(lines[0] ?? '').slice(0, firstCount)}</span>
        {t < timing.secondStart ? <span style={{display: 'inline-block', width: '0.62em', height: '1.05em', background: theme.accent, opacity: blink(timing.firstEnd + 0.08), verticalAlign: 'text-bottom'}} /> : null}
      </div>
      {lines[1] ? <div style={{color: theme.muted, fontSize: 20 * scale, marginTop: 14 * scale, minHeight: 34 * scale}}>
        <span>{lines[1].slice(0, secondCount)}</span>
        {t >= timing.secondStart ? <span style={{display: 'inline-block', width: '0.62em', height: '1.05em', background: theme.accent, opacity: loopOpacity, verticalAlign: 'text-bottom'}} /> : null}
      </div> : null}
    </AbsoluteFill>
  );
};
