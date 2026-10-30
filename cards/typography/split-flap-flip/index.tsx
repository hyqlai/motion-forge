import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

export type SplitFlapFlipProps = {
  text?: string;
  theme?: Theme;
  durationInFrames?: number;
};

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&';
const START = 22;
const STAGGER = 4;
const FLIP = 5;
const NFLIP = 3;
const CELL_W = 118;
const CELL_H = 156;

const rnd = (a: number) => {
  const x = Math.sin(a * 127.3) * 43758.5453;
  return x - Math.floor(x);
};
const garble = (i: number, k: number) =>
  CHARSET[Math.floor(rnd(i * 7.13 + k * 3.71 + 1) * CHARSET.length)];

const FLAP_BG = '#1c1e24';
const FLAP_INK = '#f8fafc';

const Half: React.FC<{ch: string; part: 'top' | 'bottom'; color?: string}> = ({ch, part, color = FLAP_INK}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: part === 'top' ? 0 : CELL_H / 2,
      width: CELL_W,
      height: CELL_H / 2,
      overflow: 'hidden',
      background: FLAP_BG,
      borderRadius: part === 'top' ? '12px 12px 0 0' : '0 0 12px 12px',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: part === 'top' ? 0 : -CELL_H / 2,
        width: CELL_W,
        height: CELL_H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'ui-monospace, "SF Mono", monospace',
        fontWeight: 900,
        fontSize: 100,
        color,
      }}
    >
      {ch}
    </div>
  </div>
);

const FlapCell: React.FC<{target: string; i: number; frame: number; accent?: string}> = ({
  target,
  i,
  frame,
  accent,
}) => {
  if (target === ' ') {
    return <div style={{width: CELL_W * 0.5, height: CELL_H}} />;
  }

  const start = START + i * STAGGER;
  const chars = [garble(i, 0), garble(i, 1), target];
  const flipIdx = Math.max(0, Math.min(NFLIP - 1, Math.floor((frame - start) / FLIP)));
  const inFlip = frame >= start && frame < start + NFLIP * FLIP;
  const settled = frame >= start + NFLIP * FLIP;

  const currentCh = settled ? target : inFlip ? chars[flipIdx] : chars[0];
  const nextCh = settled ? target : inFlip ? chars[Math.min(NFLIP - 1, flipIdx + 1)] : chars[0];

  const p = inFlip
    ? interpolate((frame - start) % FLIP, [0, FLIP], [0, 1], {
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    : 0;

  return (
    <div
      style={{
        position: 'relative',
        width: CELL_W,
        height: CELL_H,
        perspective: 800,
        borderRadius: 12,
        boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
      }}
    >
      {/* 底部静态层：上部露出下一个字，下部展示当前字 */}
      <Half ch={nextCh} part="top" color={settled ? accent : undefined} />
      <Half ch={currentCh} part="bottom" color={settled ? accent : undefined} />

      {/* 翻转上半片（0° -> -90° 翻下） */}
      {p < 0.5 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: CELL_W,
            height: CELL_H / 2,
            transformOrigin: '50% 100%',
            transform: `rotateX(${-p * 180}deg)`,
            backfaceVisibility: 'hidden',
            zIndex: 2,
          }}
        >
          <Half ch={currentCh} part="top" />
          {/* 翻折暗面遮罩 */}
          <div style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', opacity: p * 2}} />
        </div>
      )}

      {/* 翻转下半片（90° -> 0° 盖上） */}
      {p >= 0.5 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: CELL_H / 2,
            width: CELL_W,
            height: CELL_H / 2,
            transformOrigin: '50% 0%',
            transform: `rotateX(${(1 - p) * 180}deg)`,
            backfaceVisibility: 'hidden',
            zIndex: 3,
          }}
        >
          <Half ch={nextCh} part="bottom" color={settled ? accent : undefined} />
          <div style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', opacity: (1 - p) * 2}} />
        </div>
      )}

      {/* 物理翻牌中缝分界发丝线 */}
      <div style={{position: 'absolute', left: 0, top: CELL_H / 2 - 1, width: CELL_W, height: 2, background: '#0a0b0e', zIndex: 10}} />
    </div>
  );
};

export const SplitFlapFlip: React.FC<SplitFlapFlipProps> = ({
  text = 'SHIP FASTER',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);
  const accent = theme?.accent ?? '#ffb703';

  return (
    <AbsoluteFill style={{background: theme?.background ?? '#0b0e14', overflow: 'hidden'}}>
      <div style={{
        width: 1920,
        height: 1080,
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: '50% 50%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 60,
      }}>
        <div style={{fontSize: 24, letterSpacing: 8, color: '#94a3b8', fontWeight: 700}}>DEPARTURE BOARD</div>
        <div style={{display: 'flex', gap: 14}}>
          {text.toUpperCase().split('').map((ch, i) => (
            <FlapCell key={i} target={ch} i={i} frame={frame} accent={accent} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
