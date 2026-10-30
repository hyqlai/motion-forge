import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

export type MaskingTapeSlapProps = {
  title?: string;
  subtitle?: string;
  theme?: Theme;
  durationInFrames?: number;
};

const CARD_W = 600;
const CARD_H = 380;
const CX = (1920 - CARD_W) / 2;
const CY = (1080 - CARD_H) / 2 + 20;

const FLOAT_END = 38;
const SLAP1 = 58;
const SLAP2 = 82;
const APPROACH = 6;
const FREEZE = 2;

const amp = (f: number): number => {
  const rise = interpolate(f, [FLOAT_END, FLOAT_END + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const damp = interpolate(f, [SLAP1, SLAP1 + 4], [1, 0.45], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return rise * damp;
};

const rawRot = (f: number): number => amp(f) * 1.5 * Math.sin((f - FLOAT_END) * 0.16);
const rawBob = (f: number): number => amp(f) * 5 * Math.sin((f - FLOAT_END) * 0.11);

const frozen = (f: number, raw: (x: number) => number): number =>
  f <= SLAP2
    ? raw(f)
    : interpolate(f, [SLAP2, SLAP2 + FREEZE], [raw(SLAP2), 0], {
        extrapolateRight: 'clamp',
      });

const Tape: React.FC<{
  frame: number;
  land: number;
  cx: number;
  cy: number;
  rot: number;
  fromX: number;
  fromY: number;
}> = ({frame, land, cx, cy, rot, fromX, fromY}) => {
  if (frame < land - APPROACH) return null;

  const t = interpolate(frame, [land - APPROACH, land], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const x = interpolate(t, [0, 1], [cx + fromX, cx]);
  const y = interpolate(t, [0, 1], [cy + fromY, cy]);
  const s = interpolate(t, [0, 1], [1.45, 1]);
  const r = interpolate(t, [0, 1], [rot + 12, rot]);

  return (
    <div
      style={{
        position: 'absolute',
        left: x - 90,
        top: y - 24,
        width: 180,
        height: 48,
        background: 'rgba(254,240,138,0.78)',
        border: '1px dashed rgba(202,138,4,0.3)',
        borderRadius: 4,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transform: `rotate(${r}deg) scale(${s})`,
        backdropFilter: 'blur(2px)',
        zIndex: 10,
      }}
    />
  );
};

export const MaskingTapeSlap: React.FC<MaskingTapeSlapProps> = ({
  title = '观点在此立定',
  subtitle = 'PAPERCRAFT AND MASKING TAPE',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  const rot = frozen(frame, rawRot);
  const bob = frozen(frame, rawBob);

  const cardEnter = interpolate(frame, [12, 38], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{background: '#f1f5f9', overflow: 'hidden'}}>
      <div style={{
        width: 1920,
        height: 1080,
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: '50% 50%',
      }}>
        {/* 卡片主体 */}
        <div
          style={{
            position: 'absolute',
            left: CX,
            top: CY + bob + (1 - cardEnter) * 40,
            width: CARD_W,
            height: CARD_H,
            background: '#ffffff',
            borderRadius: 20,
            boxShadow: `0 ${18 + bob * 2}px ${45 + bob * 4}px rgba(0,0,0,0.12)`,
            transform: `rotate(${rot}deg)`,
            opacity: cardEnter,
            padding: 40,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <div style={{fontSize: 16, letterSpacing: 4, color: theme?.accent ?? '#0284c7', fontWeight: 800, marginBottom: 16}}>
            {subtitle}
          </div>
          <div style={{fontSize: 48, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em'}}>
            {title}
          </div>
        </div>

        {/* 左上胶带 */}
        <Tape
          frame={frame}
          land={SLAP1}
          cx={CX + 30}
          cy={CY - 10}
          rot={-18}
          fromX={-150}
          fromY={-120}
        />

        {/* 右下胶带 */}
        <Tape
          frame={frame}
          land={SLAP2}
          cx={CX + CARD_W - 30}
          cy={CY + CARD_H + 10}
          rot={-15}
          fromX={160}
          fromY={140}
        />
      </div>
    </AbsoluteFill>
  );
};
