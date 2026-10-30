import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, power2InOut, power2Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type ScribbleAnnotationProps = {
  theme: Theme;
  durationInFrames: number;
};

const STROKES = [
  {
    t0: 0.50, dur: 0.55, ease: power2InOut, len: 534.56,
    d: "M 153.3 180.3 C 154.5 179.1 157.1 175.3 160.1 173 C 163.1 170.8 167.1 168.7 171.2 166.8 C 175.4 165 180.3 163.5 185.1 162.1 C 190 160.6 195 158.7 200.3 158 C 205.6 157.2 211.6 157.4 216.9 157.6 C 222.3 157.8 227.3 158.7 232.3 159.3 C 237.3 159.9 242.7 160.3 247.1 161.4 C 251.5 162.6 255.1 164.4 258.8 166.1 C 262.5 167.7 266 169.5 269.3 171.4 C 272.6 173.3 276.8 175.2 278.7 177.6 C 280.6 179.9 280.5 182.8 280.6 185.5 C 280.7 188.2 280.1 190.9 279.1 193.5 C 278 196.2 276.8 199 274.2 201.4 C 271.6 203.8 267 205.9 263.4 208 C 259.9 210.1 256.6 212.3 252.8 214.3 C 248.9 216.3 244.8 218.5 240.1 220 C 235.3 221.4 229.7 222.2 224.3 223.1 C 218.9 224 213.3 225.1 207.8 225.4 C 202.3 225.7 196.3 225.7 191.2 225 C 186.1 224.2 181.8 222.4 177.3 221.1 C 172.8 219.8 168.1 218.8 164.2 217.2 C 160.3 215.6 156.7 213.7 153.9 211.7 C 151 209.6 149.5 207.2 147.4 204.8 C 145.2 202.5 142 200.2 140.9 197.6 C 139.8 195.1 139.9 192.1 140.9 189.4 C 142 186.7 144.9 184 147.2 181.5 C 149.5 178.9 151.5 176.1 154.9 173.9 C 158.4 171.6 163.2 169.7 167.6 168 C 172.1 166.2 177 165 181.8 163.4 C 186.6 161.9 191.1 159.8 196.3 158.7 C 201.4 157.6 207.3 157.1 212.9 156.8 C 218.5 156.5 224.1 156.6 229.6 156.8 C 235.2 157.1 241.3 157.2 246.1 158.4 C 250.8 159.5 254.6 161.7 258.3 163.6 C 261.9 165.4 264.9 167.5 268 169.5 C 271 171.6 274.7 173.5 276.6 175.9 C 278.6 178.2 278.9 180.9 279.7 183.6 C 280.6 186.2 281.6 188.8 281.6 191.6 C 281.5 194.3 281.6 197.4 279.7 200 C 277.7 202.7 273.4 205.1 269.9 207.5 C 266.3 209.8 262.6 212.1 258.4 214.1 C 254.1 216.1 246.7 218.5 244.3 219.4",
  },
  {
    t0: 1.60, dur: 0.40, ease: power2Out, len: 318.25,
    d: "M 164.6 302.9 C 169.9 302.9 185.8 302.9 196.4 303.2 C 207 303.5 217.6 304.7 228.2 304.8 C 238.8 304.9 249.4 303.9 260 303.8 C 270.6 303.7 281.2 304 291.8 304.3 C 302.4 304.6 313 305.5 323.6 305.5 C 334.2 305.6 344.8 304.5 355.4 304.5 C 366 304.4 376.6 305 387.2 305.1 C 397.8 305.2 408.4 305.5 419 305 C 429.6 304.6 440.2 303.2 450.8 302.6 C 461.4 301.9 477.3 301.5 482.6 301.2",
  },
  {
    t0: 2.55, dur: 0.35, ease: power2InOut, len: 203.19,
    d: "M 435 452 C 497.7 478 564.4 432.3 631 418",
  },
  {
    t0: 2.90, dur: 0.15, ease: power2Out, len: 61.0,
    d: "M 599.9 410.3 L 631 418 L 609.5 437.4",
  },
];

export const ScribbleAnnotation: React.FC<ScribbleAnnotationProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      {/* 假商品卡界面 */}
      <div style={{
        position: 'absolute',
        left: 130 * scale,
        top: 55 * scale,
        width: 700 * scale,
        height: 430 * scale,
        border: `1px solid ${theme.muted}33`,
        borderRadius: 8 * scale,
        padding: `${26 * scale}px ${30 * scale}px`,
        background: '#141c2b',
      }}>
        <div style={{height: 14 * scale, width: '40%', background: '#202b3d', borderRadius: 7 * scale, marginBottom: 14 * scale}} />
        <h3 style={{fontSize: 24 * scale, fontWeight: 700, margin: `0 0 ${18 * scale}px`}}>高端机械腕表 · 定制限量款</h3>
        <div style={{fontSize: 42 * scale, fontWeight: 800, margin: `${10 * scale}px 0 ${22 * scale}px`, color: theme.accent}}>
          ¥ 1,299 <small style={{fontSize: 20 * scale, color: theme.muted, textDecoration: 'line-through', marginLeft: 26 * scale}}>¥ 4,999</small>
        </div>
        <div style={{fontSize: 16 * scale, color: theme.muted, lineHeight: 1.6}}>
          含终身保修服务 · 支持 7 天无理由退换 · 顺丰特快顺畅直达
        </div>
        <div style={{position: 'absolute', right: 30 * scale, bottom: 26 * scale, padding: `${12 * scale}px ${28 * scale}px`, borderRadius: 8 * scale, background: theme.accent, color: '#0c111b', fontWeight: 800, fontSize: 16 * scale}}>
          立即抢购
        </div>
      </div>

      {/* SVG 涂鸦标注层 */}
      <svg viewBox="0 0 960 540" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'}}>
        {STROKES.map((s, i) => {
          const p = s.ease(clamp01((t - s.t0) / s.dur));
          const offset = s.len * (1 - p);
          const color = i === 1 ? '#4ecb71' : theme.accent;
          return (
            <path
              key={i}
              d={s.d}
              fill="none"
              stroke={color}
              strokeWidth={5 * scale}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={s.len}
              strokeDashoffset={offset}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
