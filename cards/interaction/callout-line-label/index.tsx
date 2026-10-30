import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, clamp01, lerp, power1Out, power2In, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type CalloutItem = {
  target: {x: number; y: number};
  points: Array<{x: number; y: number}>;
  label: {lines: [string, string]; x: number; y: number; from: 'left' | 'right'};
};

export type CalloutLineLabelProps = {
  callouts?: CalloutItem[];
  theme: Theme;
  durationInFrames: number;
  hold?: number;
  stagger?: number;
};

const DEFAULT_CALLOUTS: CalloutItem[] = [
  {
    target: {x: 422, y: 114},
    points: [{x: 380, y: 156}, {x: 258, y: 156}],
    label: {lines: ['1 英寸大底主摄', '同价位唯一硬件配置'], x: 84, y: 128, from: 'right'},
  },
  {
    target: {x: 588, y: 300},
    points: [{x: 648, y: 240}, {x: 760, y: 240}],
    label: {lines: ['钛合金中框', '整机结构减重 19g'], x: 772, y: 214, from: 'left'},
  },
];

const polyLen = (pts: Array<{x: number; y: number}>) => {
  let len = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    len += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
  }
  return len;
};

export const CalloutLineLabel: React.FC<CalloutLineLabelProps> = ({
  callouts = DEFAULT_CALLOUTS,
  theme,
  hold = 1.6,
  stagger = 0.8,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scaleRatio = width / 960;

  const dotR = 7 * scaleRatio;
  const dotIn = 0.2;
  const lineDraw = 0.4;
  const labelIn = 0.25;
  const out = 0.5;

  const outAt = 0.6 + stagger + dotIn + lineDraw + labelIn + 0.1 + hold;

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      {/* 演示底层产品轮廓 */}
      <div style={{
        position: 'absolute',
        left: 380 * scaleRatio,
        top: 70 * scaleRatio,
        width: 200 * scaleRatio,
        height: 400 * scaleRatio,
        borderRadius: 30 * scaleRatio,
        background: '#141c2b',
        border: `2px solid ${theme.muted}44`,
      }}>
        <div style={{
          position: 'absolute',
          inset: 10 * scaleRatio,
          borderRadius: 22 * scaleRatio,
          background: '#0d131f',
          border: `1px solid ${theme.muted}22`,
        }} />
        <div style={{
          position: 'absolute',
          left: 20 * scaleRatio,
          top: 22 * scaleRatio,
          width: 44 * scaleRatio,
          height: 44 * scaleRatio,
          borderRadius: 12 * scaleRatio,
          background: '#1c263a',
          border: `1px solid ${theme.accent}66`,
        }} />
      </div>

      <svg
        style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}
        viewBox="0 0 960 540"
      >
        {callouts.map((c, i) => {
          const t0 = 0.6 + i * stagger;
          const tOut = outAt + i * 0.15;

          // 1) 圆点 pop + 涟漪
          const dotP = t < tOut + out * 0.56
            ? backOut(2.2)(clamp01((t - t0) / dotIn))
            : 1 - power2In(clamp01((t - (tOut + out * 0.56)) / (out * 0.3)));

          const rippleOn = t >= t0 + 0.05;
          const rippleP = power2Out(clamp01((t - (t0 + 0.05)) / 0.5));

          // 2) 折线生长
          const pts = [c.target, ...c.points];
          const len = polyLen(pts);
          const d = `M ${pts.map((p) => `${p.x} ${p.y}`).join(' L ')}`;
          const tLine = t0 + dotIn;
          const dash = t < tOut + out * 0.24
            ? len * (1 - power2Out(clamp01((t - tLine) / lineDraw)))
            : len * power2In(clamp01((t - (tOut + out * 0.24)) / (out * 0.4)));

          return (
            <g key={i}>
              {rippleOn && (
                <circle
                  cx={c.target.x}
                  cy={c.target.y}
                  r={dotR}
                  fill="none"
                  stroke={theme.accent}
                  strokeWidth={2}
                  opacity={lerp(0.9, 0, rippleP)}
                  transform={`translate(${c.target.x} ${c.target.y}) scale(${lerp(0.4, 3.2, rippleP)}) translate(${-c.target.x} ${-c.target.y})`}
                />
              )}
              <circle
                cx={c.target.x}
                cy={c.target.y}
                r={dotR}
                fill={theme.accent}
                opacity={clamp01(dotP)}
                transform={`translate(${c.target.x} ${c.target.y}) scale(${dotP}) translate(${-c.target.x} ${-c.target.y})`}
              />
              <path
                d={d}
                fill="none"
                stroke={theme.accent}
                strokeWidth={2.5}
                strokeDasharray={len}
                strokeDashoffset={dash}
              />
            </g>
          );
        })}
      </svg>

      {/* 3) 标签 */}
      <div>
        {callouts.map((c, i) => {
          const t0 = 0.6 + i * stagger;
          const tOut = outAt + i * 0.15;
          const tLabel = t0 + dotIn + lineDraw;

          const shown = t < tOut
            ? power3Out(clamp01((t - tLabel) / labelIn))
            : 1 - power2In(clamp01((t - tOut) / (out * 0.4)));

          const clip = c.label.from === 'right'
            ? `inset(0 0 0 ${(1 - shown) * 100}%)`
            : `inset(0 ${(1 - shown) * 100}% 0 0)`;

          const txtOp = power1Out(clamp01((t - (tLabel + 0.1)) / 0.2));

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: c.label.x * scaleRatio,
                top: c.label.y * scaleRatio,
                clipPath: clip,
                padding: `${10 * scaleRatio}px ${16 * scaleRatio}px`,
                background: '#141c2b',
                border: `1px solid ${theme.muted}55`,
                borderRadius: 8 * scaleRatio,
                color: theme.foreground,
                whiteSpace: 'nowrap',
              }}
            >
              <b style={{display: 'block', fontSize: 18 * scaleRatio, opacity: txtOp, color: theme.accent}}>
                {c.label.lines[0]}
              </b>
              <small style={{fontSize: 13 * scaleRatio, color: theme.muted, opacity: txtOp}}>
                {c.label.lines[1]}
              </small>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
