import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, linear, power1In, power2InOut, power2Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type CountdownArcScatterProps = {
  numbers?: number[];
  pick?: number;
  words?: string[];
  theme: Theme;
  durationInFrames: number;
  sweep?: number;
};

export const CountdownArcScatter: React.FC<CountdownArcScatterProps> = ({
  numbers = [11, 10, 9, 8, 7, 6, 5, 4, 3],
  pick = 5,
  words = ['分钟', '搭好', '创作系统'],
  theme,
  sweep = 0.57,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const pickIdx = Math.max(0, numbers.indexOf(pick));

  const step = 24;
  const R = 150 * scale;
  const sweepFrom = 96;
  const sweepAt = 0.3;
  const outAt = 0.85;
  const outDur = 0.3;
  const handAt = 0.87;
  const handDur = 0.3;
  const wordsAt = 0.95;
  const wordStagger = 0.15;
  const wordDur = 0.35;
  const accentAt = 1.75;
  const accentDur = 0.25;

  const target = {x: -120 * scale, y: -68 * scale};

  const rot = lerp(sweepFrom, 0, power2Out(clamp01((t - sweepAt) / sweep)));
  const out = power1In(clamp01((t - outAt) / outDur));
  const hand = power2InOut(clamp01((t - handAt) / handDur));

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      {/* 枢轴旋转中心 (480, 318) */}
      <div style={{position: 'absolute', left: 480 * scale, top: 318 * scale}}>
        {/* 数字弧 */}
        {numbers.map((n, i) => {
          const pa = (i - pickIdx) * step + rot;
          const a = (pa * Math.PI) / 180;
          let x = Math.sin(a) * R;
          let y = -Math.cos(a) * R;
          let r = pa;
          let op = clamp01((70 - Math.abs(pa)) / 22);
          let filter = 'none';

          if (i === pickIdx) {
            x = lerp(x, target.x, hand);
            y = lerp(y, target.y, hand);
            r = r * (1 - hand);
            op = Math.max(op, hand);
          } else {
            op *= 1 - out;
            filter = `blur(${(out * 3).toFixed(2)}px)`;
          }

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                transform: `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${r}deg)`,
                opacity: op,
                filter,
                fontSize: 48 * scale,
                fontWeight: 800,
                color: i === pickIdx ? theme.accent : theme.muted,
                fontFamily: 'monospace',
                userSelect: 'none',
              }}
            >
              {n}
            </div>
          );
        })}

        {/* 差速刻度 */}
        {Array.from({length: 15}, (_, k) => {
          const pa = (k - 7) * 12 + rot * 0.35;
          const a = (pa * Math.PI) / 180;
          const rr = R + 38 * scale;
          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 2 * scale,
                height: 8 * scale,
                background: theme.muted,
                transform: `translate(${Math.sin(a) * rr}px, ${-Math.cos(a) * rr}px) rotate(${pa}deg)`,
                opacity: clamp01((80 - Math.abs(pa)) / 20) * 0.8 * (1 - out),
              }}
            />
          );
        })}
      </div>

      {/* 标题展开层 */}
      <div style={{
        position: 'absolute',
        left: 480 * scale + target.x + 36 * scale,
        top: 318 * scale + target.y - 24 * scale,
        display: 'flex',
        alignItems: 'baseline',
        fontSize: 44 * scale,
        fontWeight: 750,
      }}>
        {words.map((w, i) => {
          const k = power2Out(clamp01((t - (wordsAt + i * wordStagger)) / wordDur));
          const isLast = i === words.length - 1;
          const accP = clamp01((t - accentAt) / accentDur);
          const color = isLast && accP > 0 ? theme.accent : theme.foreground;

          return (
            <span
              key={i}
              style={{
                marginRight: 8 * scale,
                opacity: k,
                filter: `blur(${lerp(6, 0, k).toFixed(2)}px)`,
                color,
                transition: 'color 0.2s',
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
