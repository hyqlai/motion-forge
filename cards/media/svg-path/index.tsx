import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

export type SvgPathProps = {
  title: string;
  steps: string[];
  theme: Theme;
  durationInFrames: number;
};

export const SvgPath: React.FC<SvgPathProps> = ({title, steps, theme, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scale = width / 960;
  const drawEnd = Math.max(1, Math.floor(durationInFrames * 0.65));
  const progress = interpolate(frame, [0, drawEnd], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const points = steps.map((_, index) => ({
    x: 150 + index * (660 / Math.max(1, steps.length - 1)),
    y: 310 + Math.sin(index * 1.7) * 85,
  }));
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <AbsoluteFill style={{background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily}}>
      <div style={{fontSize: 36 * scale, fontWeight: 700, left: 70 * scale, position: 'absolute', top: 55 * scale}}>{title}</div>
      <svg width={width} height={height} viewBox="0 0 960 540" style={{position: 'absolute', inset: 0}}>
        <path d={path} fill="none" stroke={theme.muted} strokeWidth={3} opacity={0.25} />
        <path
          d={path}
          fill="none"
          pathLength={1}
          stroke={theme.accent}
          strokeDasharray={1}
          strokeDashoffset={1 - progress}
          strokeLinecap="round"
          strokeWidth={7}
        />
        {points.map((point, index) => {
          const visible = progress >= index / Math.max(1, steps.length - 1);
          return (
            <g key={steps[index]} opacity={visible ? 1 : 0.18}>
              <circle cx={point.x} cy={point.y} r={17} fill={theme.background} stroke={theme.accent} strokeWidth={6} />
              <text x={point.x} y={point.y + 55} fill={theme.foreground} fontSize={22} textAnchor="middle">{steps[index]}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
