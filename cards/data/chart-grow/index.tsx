import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, lerp, power2Out, power3Out, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type ChartColumn = {label: string; value: number; hot?: boolean};
export type ChartGrowProps = {
  title: string;
  columns: ChartColumn[];
  maxValue?: number;
  theme: Theme;
  durationInFrames: number;
};

export const ChartGrow: React.FC<ChartGrowProps> = ({title, columns, maxValue, theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;
  const maximum = maxValue ?? Math.max(...columns.map((column) => column.value), 1);
  const axis = tween(t, 0.2, 0.3, power2Out);
  const lastTop = 0.55 + (columns.length - 1) * 0.13 + 0.5;
  const punch = t < lastTop + 0.08
    ? lerp(1, 1.03, tween(t, lastTop, 0.08, power2Out))
    : lerp(1.03, 1, tween(t, lastTop + 0.08, 0.22, backOut(3)));

  return (
    <AbsoluteFill style={{background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily, padding: 60 * scale}}>
      <div style={{fontSize: 24 * scale, fontWeight: 700, opacity: axis}}>{title}</div>
      <div style={{position: 'absolute', left: 90 * scale, right: 90 * scale, top: 125 * scale, bottom: 75 * scale, borderLeft: `2px solid ${theme.muted}`, borderBottom: `2px solid ${theme.muted}`, opacity: axis, transform: `scale(${punch})`}}>
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingLeft: 25 * scale}}>
          {columns.map((column, index) => {
            const height = column.value / maximum * 100;
            const at = 0.55 + index * 0.13;
            const progress = tween(t, at, 0.5, power3Out);
            const labelProgress = tween(t, at + 0.36, 0.25, backOut(2));
            const hot = column.hot ?? index === columns.length - 1;
            return (
              <div key={column.label} style={{position: 'relative', width: 68 * scale, height: '100%', display: 'flex', justifyContent: 'flex-end'}}>
                <div style={{width: '100%', height: `${height}%`, background: hot ? theme.accent : theme.muted, borderRadius: '5px 5px 0 0', transform: `scaleY(${progress})`, transformOrigin: '50% 100%'}} />
                <div style={{position: 'absolute', bottom: `calc(${height}% + ${8 * scale}px)`, left: 0, right: 0, textAlign: 'center', color: hot ? theme.accent : theme.foreground, fontSize: 19 * scale, fontWeight: 800, opacity: Math.min(1, labelProgress), transform: `scale(${lerp(0.4, 1, labelProgress)})`}}>{column.value}</div>
                <div style={{position: 'absolute', bottom: -30 * scale, left: 0, right: 0, textAlign: 'center', color: theme.muted, fontSize: 15 * scale}}>{column.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
