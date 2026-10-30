import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

export type PopupBookRiseProps = {
  theme?: Theme;
  durationInFrames?: number;
};

const FPS = 30;
const HOLD = 14;
const STAGGER = 7;
const RISE_DUR = 34;

const AREA_X = 220 + 36;
const AREA_Y = 72 + 36;
const AREA_W = 1920 - 220 - 72;
const AREA_H = 1080 - 72 - 72;
const GAP = 28;
const CELL_W = (AREA_W - 2 * GAP) / 3;
const CELL_H = (AREA_H - GAP) / 2;

const PageCard: React.FC<{i: number; frame: number; accent: string}> = ({i, frame, accent}) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const order = row === 0 ? col : 3 + col;
  const start = HOLD + order * STAGGER;

  const s = spring({
    frame: frame - start,
    fps: FPS,
    config: {damping: 11, stiffness: 130, mass: 0.9},
    durationInFrames: RISE_DUR,
    durationRestThreshold: 0.0001,
  });

  const rx = interpolate(s, [0, 1], [0, -90]);
  const lie = 1 - Math.min(Math.abs(rx) / 90, 1);
  const shH = 14 + 90 * Math.max(lie, 0);
  const shAlpha = 0.15 + 0.25 * Math.max(lie, 0);

  return (
    <div
      style={{
        position: 'absolute',
        left: AREA_X + col * (CELL_W + GAP),
        top: AREA_Y + row * (CELL_H + GAP),
        width: CELL_W,
        height: CELL_H,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* 根部纸张折痕阴影 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: CELL_W,
          height: shH,
          background: `linear-gradient(to top, rgba(0,0,0,${shAlpha}), transparent)`,
          pointerEvents: 'none',
        }}
      />

      {/* 沿底边立起的纸片 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: '50% 100%',
          transform: `rotateX(${rx}deg)`,
          background: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
          boxSizing: 'border-box',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <div style={{width: 36, height: 36, borderRadius: 8, background: i === 0 ? accent : '#f1f5f9'}} />
          <div style={{fontSize: 20, fontWeight: 700, color: '#1e293b'}}>Card 0{i + 1}</div>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          <div style={{width: '80%', height: 12, borderRadius: 6, background: '#e2e8f0'}} />
          <div style={{width: '50%', height: 10, borderRadius: 5, background: '#f1f5f9'}} />
        </div>
      </div>
    </div>
  );
};

export const PopupBookRise: React.FC<PopupBookRiseProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);
  const accent = theme?.accent ?? '#ff6b2c';

  const sceneTilt = interpolate(frame, [83, 108], [75, 68], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{background: '#f8fafc', overflow: 'hidden'}}>
      <div style={{
        width: 1920,
        height: 1080,
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: '50% 50%',
        perspective: 1400,
      }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d',
            transform: `rotateX(${sceneTilt}deg)`,
            transformOrigin: '50% 60%',
          }}
        >
          {Array.from({length: 6}, (_, i) => (
            <PageCard key={i} i={i} frame={frame} accent={accent} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
