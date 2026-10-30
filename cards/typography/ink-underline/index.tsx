import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, power1Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

type Pt = [number, number];

const sampleCubic = (p0: Pt, c1: Pt, c2: Pt, p3: Pt, count: number): Pt[] => {
  const pts: Pt[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const u = 1 - t;
    pts.push([
      u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1],
    ]);
  }
  return pts;
};

const makeRibbonPath = (spine: Pt[], thickness: number, pressure: number, release: number) => {
  const leftBank: Pt[] = [];
  const rightBank: Pt[] = [];
  const N = spine.length;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const halfW = (thickness / 2) * (pressure * (1 - t) + release * t);
    const prev = spine[Math.max(0, i - 1)];
    const next = spine[Math.min(N - 1, i + 1)];
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    leftBank.push([spine[i][0] + nx * halfW, spine[i][1] + ny * halfW]);
    rightBank.push([spine[i][0] - nx * halfW, spine[i][1] - ny * halfW]);
  }
  const d = `M ${leftBank.map((p) => `${p[0]} ${p[1]}`).join(' L ')} L ${rightBank.reverse().map((p) => `${p[0]} ${p[1]}`).join(' L ')} Z`;
  return d;
};

export type InkUnderlineProps = {
  theme: Theme;
  durationInFrames: number;
};

export const InkUnderline: React.FC<InkUnderlineProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const marks = [
    {x1: 280 * scale, x2: 440 * scale, y: 226 * scale, t0: 0.55, dur: 0.50, wobble: 1.1},
    {x1: 320 * scale, x2: 480 * scale, y: 316 * scale, t0: 1.80, dur: 0.42, wobble: -0.9},
  ];

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      paddingLeft: 120 * scale,
      overflow: 'hidden',
    }}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 36 * scale}}>
        <div style={{fontSize: 34 * scale, fontWeight: 650, color: theme.muted}}>
          真正的问题不在于 <b style={{color: theme.foreground}}>成本上涨</b>
        </div>
        <div style={{fontSize: 34 * scale, fontWeight: 650, color: theme.muted}}>
          而在于我们底层的 <b style={{color: theme.accent}}>交付结构</b>
        </div>
      </div>

      <svg viewBox="0 0 960 540" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'}}>
        {marks.map((m, i) => {
          if (t < m.t0) return null;
          const p = power1Out(clamp01((t - m.t0) / m.dur));
          const curX2 = m.x1 + (m.x2 - m.x1) * p;

          const p0: Pt = [m.x1, m.y];
          const p3: Pt = [curX2, m.y];
          const c1: Pt = [m.x1 + (curX2 - m.x1) * 0.3, m.y - m.wobble * 4 * scale];
          const c2: Pt = [m.x1 + (curX2 - m.x1) * 0.7, m.y + m.wobble * 4 * scale];

          const spine = sampleCubic(p0, c1, c2, p3, 32);
          const d = makeRibbonPath(spine, 9 * scale, 1, 0.2);

          return (
            <path
              key={i}
              d={d}
              fill={i === 1 ? theme.accent : '#e06c60'}
              opacity={0.85}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
