import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, clamp01, lerp, power1Out, power2In, power2Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type ReticleLockOnProps = {
  label?: string;
  buttonText?: string;
  theme: Theme;
  durationInFrames: number;
  at?: number;
  fly?: number;
};

type Target = {x: number; y: number; w: number; h: number};
const DEMO_TARGET: Target = {x: 236, y: 290, w: 228, h: 48};

export const ReticleLockOn: React.FC<ReticleLockOnProps> = ({
  label = '就是这个按钮',
  buttonText = '立即开通 ¥ 199 / 年',
  theme,
  at = 1.3,
  fly = 0.33,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const target = DEMO_TARGET;
  const shot = {x: 130 * scale, y: 60 * scale, w: 700 * scale, h: 420 * scale};
  const pad = 10 * scale;

  const big = 2.2;
  const under = 0.94;
  const shrink = 0.2;
  const snap = 0.15;
  const off: [number, number][] = [
    [-700 * scale, -500 * scale],
    [700 * scale, -500 * scale],
    [-700 * scale, 500 * scale],
    [700 * scale, 500 * scale],
  ];
  const flashPeak = 0.55;
  const flashHold = 0.28;
  const exitAt = 5.6;
  const end = 6.0;

  const bx = shot.x + target.x * scale - pad;
  const by = shot.y + target.y * scale - pad;
  const bw = target.w * scale + 2 * pad;
  const bh = target.h * scale + 2 * pad;
  const cx = bx + bw / 2;
  const cy = by + bh / 2;

  const cornerSize = 22 * scale;
  const corners: [number, number][] = [
    [bx, by],
    [bx + bw - cornerSize, by],
    [bx, by + bh - cornerSize],
    [bx + bw - cornerSize, by + bh - cornerSize],
  ];

  const LOCK = at + fly + shrink;

  // 飞入与收缩解耦
  const flyP = power2Out(clamp01((t - at) / fly));
  const s = t < at + fly
    ? big
    : t < LOCK
      ? lerp(big, under, power2In(clamp01((t - (at + fly)) / shrink)))
      : lerp(under, 1, backOut(2)(clamp01((t - LOCK) / snap)));

  const rtOn = t >= at;

  // 咬合帧：白闪
  const flash = t < LOCK
    ? 0
    : lerp(0, flashPeak, power1Out(clamp01((t - LOCK) / 0.04))) - lerp(0, flashPeak - flashHold, power1Out(clamp01((t - (LOCK + 0.04)) / 0.2)));

  const labP = backOut(1.8)(clamp01((t - LOCK) / 0.35));
  const labOp = power1Out(clamp01((t - LOCK) / (0.35 * 0.5)));
  const exitK = 1 - power2In(clamp01((t - exitAt) / (end - exitAt)));

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      {/* 假设置页底图 */}
      <div style={{
        position: 'absolute',
        left: shot.x,
        top: shot.y,
        width: shot.w,
        height: shot.h,
        background: '#141c2b',
        border: `1px solid ${theme.muted}33`,
        borderRadius: 12 * scale,
        overflow: 'hidden',
        opacity: exitK,
      }}>
        <div style={{height: 34 * scale, background: '#1c2638', display: 'flex', alignItems: 'center', gap: 6 * scale, padding: `0 ${12 * scale}px`}}>
          <i style={{width: 8 * scale, height: 8 * scale, borderRadius: '50%', background: '#ff5f56', display: 'inline-block'}} />
          <i style={{width: 8 * scale, height: 8 * scale, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block'}} />
          <i style={{width: 8 * scale, height: 8 * scale, borderRadius: '50%', background: '#27c93f', display: 'inline-block'}} />
        </div>
        <div style={{position: 'absolute', left: 40 * scale, top: 60 * scale, width: 260 * scale, height: 12 * scale, background: '#233048', borderRadius: 4 * scale}} />
        <div style={{position: 'absolute', left: 40 * scale, top: 90 * scale, width: 420 * scale, height: 10 * scale, background: '#1d273a', borderRadius: 4 * scale}} />
        <div style={{position: 'absolute', left: 40 * scale, top: 115 * scale, width: 340 * scale, height: 10 * scale, background: '#1d273a', borderRadius: 4 * scale}} />
        <div style={{position: 'absolute', left: 40 * scale, top: 155 * scale, width: 520 * scale, height: 80 * scale, borderRadius: 8 * scale, background: '#192234' }} />

        {/* 目标按钮 */}
        <div style={{
          position: 'absolute',
          left: target.x * scale,
          top: target.y * scale,
          width: target.w * scale,
          height: target.h * scale,
          borderRadius: 24 * scale,
          background: theme.accent,
          color: '#0c111b',
          display: 'grid',
          placeItems: 'center',
          fontSize: 14 * scale,
          fontWeight: 750,
        }}>
          {buttonText}
        </div>

        {/* 目标白闪微亮 */}
        <div style={{
          position: 'absolute',
          left: target.x * scale,
          top: target.y * scale,
          width: target.w * scale,
          height: target.h * scale,
          borderRadius: 24 * scale,
          background: '#ffffff',
          pointerEvents: 'none',
          opacity: Math.max(0, flash),
        }} />
      </div>

      {/* 四个 L 角：四向扑入与中心收缩 */}
      {corners.map(([x, y], k) => {
        const dx = (x + cornerSize / 2 - cx) * s;
        const dy = (y + cornerSize / 2 - cy) * s;
        const ox = lerp(off[k][0], 0, flyP);
        const oy = lerp(off[k][1], 0, flyP);

        // L 角边框样式
        const borderStyle: React.CSSProperties = {
          borderTop: k < 2 ? `3px solid ${theme.accent}` : 'none',
          borderBottom: k >= 2 ? `3px solid ${theme.accent}` : 'none',
          borderLeft: k % 2 === 0 ? `3px solid ${theme.accent}` : 'none',
          borderRight: k % 2 === 1 ? `3px solid ${theme.accent}` : 'none',
        };

        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: cx + dx - cornerSize / 2 + ox,
              top: cy + dy - cornerSize / 2 + oy,
              width: cornerSize,
              height: cornerSize,
              opacity: (rtOn ? 1 : 0) * exitK,
              pointerEvents: 'none',
              ...borderStyle,
            }}
          />
        );
      })}

      {/* 咬合后弹出的标签 */}
      <div style={{
        position: 'absolute',
        left: bx + bw + 18 * scale,
        top: cy - 18 * scale,
        background: '#192234',
        border: `1px solid ${theme.accent}`,
        color: theme.foreground,
        fontSize: 13 * scale,
        fontWeight: 700,
        padding: `${6 * scale}px ${14 * scale}px`,
        borderRadius: 6 * scale,
        whiteSpace: 'nowrap',
        opacity: labOp * exitK,
        transform: `scale(${lerp(0.6, 1, labP)})`,
        transformOrigin: 'left center',
        boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
      }}>
        {label}
      </div>
    </AbsoluteFill>
  );
};
