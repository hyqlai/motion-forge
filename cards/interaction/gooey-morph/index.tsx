import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, cubicBezier, lerp} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type GooeyMorphProps = {
  theme: Theme;
  durationInFrames: number;
};

const TRAVEL_EASE = cubicBezier(0.88, 0.14, 0.12, 0.86);

export const GooeyMorph: React.FC<GooeyMorphProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const count = 4;
  const picW = 106 * scale;
  const picH = picW * 0.755;
  const gap = 8 * scale;
  const travel = 1.0;

  const entryFrom = [
    [300 * scale, 190 * scale],
    [430 * scale, -180 * scale],
    [360 * scale, -195 * scale],
    [500 * scale, 175 * scale],
  ];
  const entryAt = [0.267, 0, 0.133, 0.433];

  const totalW = count * picW + (count - 1) * gap;
  const startX = 480 * scale - totalW / 2;
  const centerY = 270 * scale;

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      <div style={{position: 'absolute', inset: 0}}>
        {Array.from({length: count}).map((_, i) => {
          const t0 = entryAt[i];
          const p = TRAVEL_EASE(clamp01((t - t0) / travel));

          // L 形路径：前半程走 X (0~0.5)，后半程走 Y (0.5~1.0)
          const px = clamp01(p * 2);
          const py = clamp01((p - 0.5) * 2);

          const from = entryFrom[i];
          const curX = lerp(from[0], 0, px);
          const curY = lerp(from[1], 0, py);

          const targetLeft = startX + i * (picW + gap);
          const targetTop = centerY - picH / 2;

          const op = clamp01((t - t0) / 0.15);

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: targetLeft + curX,
                top: targetTop + curY,
                width: picW,
                height: picH,
                borderRadius: 8 * scale,
                background: '#141c2b',
                border: `2px solid ${i === 2 ? theme.accent : `${theme.muted}44`}`,
                boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
                opacity: op,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                padding: 10 * scale,
                boxSizing: 'border-box',
                willChange: 'left, top',
              }}
            >
              <div style={{
                flex: 1,
                background: i === 2 ? theme.accent : '#202b3d',
                borderRadius: 4 * scale,
                display: 'grid',
                placeItems: 'center',
                color: i === 2 ? '#0c111b' : theme.muted,
                fontWeight: 800,
                fontSize: 14 * scale,
              }}>
                0{i + 1}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
