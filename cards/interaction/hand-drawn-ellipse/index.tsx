import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type HandDrawnEllipseProps = {
  leadText?: string;
  highlightText?: string;
  theme: Theme;
  durationInFrames: number;
  startDelay?: number;
  draw?: number;
};

// 来源精确测算的歪椭圆路径（长短轴比 3.4:1，逆时针 1.08 圈交叉）
const ELLIPSE = {
  len: 471.44,
  d: "M 87.36 276.83 C 86.25 277.69 82.76 280.26 80.69 281.96 C 78.63 283.66 76.87 285.31 74.99 287.03 C 73.1 288.75 70.44 290.53 69.41 292.28 C 68.38 294.03 68.07 295.87 68.79 297.55 C 69.51 299.22 71.78 300.78 73.72 302.33 C 75.67 303.88 77.77 305.41 80.48 306.84 C 83.2 308.27 85.99 309.8 90.01 310.9 C 94.04 312 99.4 312.8 104.63 313.44 C 109.86 314.09 115.87 314.33 121.39 314.77 C 126.92 315.2 132.14 315.71 137.77 316.04 C 143.41 316.37 149.21 316.76 155.19 316.74 C 161.17 316.72 167.51 316.31 173.65 315.9 C 179.79 315.49 185.82 314.88 192.02 314.3 C 198.21 313.72 204.75 313.27 210.82 312.43 C 216.9 311.59 223.26 310.56 228.47 309.26 C 233.68 307.97 237.96 306.25 242.07 304.66 C 246.18 303.08 249.63 301.4 253.14 299.74 C 256.64 298.08 260.5 296.45 263.1 294.72 C 265.69 292.99 267.6 291.15 268.7 289.38 C 269.79 287.61 269.38 285.86 269.65 284.11 C 269.92 282.37 270.31 280.66 270.33 278.9 C 270.36 277.14 270.98 275.24 269.81 273.56 C 268.64 271.88 266.27 270.25 263.32 268.84 C 260.37 267.43 256.08 266.27 252.12 265.08 C 248.16 263.89 244.21 262.67 239.58 261.69 C 234.96 260.7 229.97 259.7 224.36 259.18 C 218.75 258.65 212.11 258.59 205.92 258.54 C 199.73 258.5 193.39 258.79 187.19 258.89 C 180.99 259 174.96 258.93 168.72 259.16 C 162.48 259.4 155.92 259.67 149.73 260.3 C 143.54 260.92 137.5 261.96 131.58 262.93 C 125.65 263.9 119.96 264.99 114.18 266.13 C 108.4 267.26 102.05 268.35 96.9 269.75 C 91.74 271.15 86.83 272.82 83.23 274.54 C 79.64 276.26 77.59 278.23 75.32 280.07 C 73.04 281.91 71.26 283.73 69.59 285.56 C 67.92 287.39 66.03 290.14 65.32 291.06",
};

export const HandDrawnEllipse: React.FC<HandDrawnEllipseProps> = ({
  leadText = '要求可以再高一点，但对自己',
  highlightText = '更松弛一点',
  theme,
  startDelay = 0.42,
  draw = 0.50,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const punchGap = 0.06;
  const punchScale = 1.06;
  const punchDur = 0.22;

  // ① 一笔：单条 path 恒定线宽，dashoffset 描绘（起笔快收笔缓）
  const v = power2Out(clamp01((t - startDelay) / draw));
  const L = ELLIPSE.len;

  // ② 圈到位之后（+punchGap）短语才 punch 一拍（1.06→1）
  const punchAt = startDelay + draw + punchGap;
  const wordScale = t < punchAt
    ? 1
    : lerp(punchScale, 1, power3Out(clamp01((t - punchAt) / punchDur)));

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        left: 100 * scale,
        right: 410 * scale,
        top: '50%',
        transform: 'translateY(-50%)',
      }}>
        <div style={{fontSize: 28 * scale, lineHeight: 2.4, color: theme.muted, whiteSpace: 'nowrap'}}>
          {leadText}
        </div>
        <div style={{fontSize: 28 * scale, lineHeight: 2.4, whiteSpace: 'nowrap'}}>
          <span style={{
            display: 'inline-block',
            fontWeight: 700,
            color: theme.foreground,
            transform: `scale(${wordScale})`,
            transformOrigin: '50% 55%',
          }}>
            {highlightText}
          </span>
        </div>
      </div>

      <svg
        style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}
        viewBox="0 0 960 540"
      >
        <path
          d={ELLIPSE.d}
          fill="none"
          stroke={theme.accent}
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${L.toFixed(2)} ${(L + 4).toFixed(2)}`}
          strokeDashoffset={Math.max(0, L * (1 - v)).toFixed(2)}
        />
      </svg>
    </AbsoluteFill>
  );
};
