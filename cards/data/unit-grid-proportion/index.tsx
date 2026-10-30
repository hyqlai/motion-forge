import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power1Out, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type UnitGridProportionProps = {
  target?: number;
  unit?: string;
  label?: string[];
  theme: Theme;
  durationInFrames: number;
};

// 确定性随机
const srand = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export const UnitGridProportion: React.FC<UnitGridProportionProps> = ({
  target = 37,
  unit = '%',
  label = ['的核心用户', '在第一分钟产生交互'],
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const cols = 10;
  const total = 100;
  const n = Math.max(0, Math.min(total, Math.round(target)));

  const growAt = 0.2;
  const ringDur = 0.13;
  const jitter = 0.1;
  const growDur = 0.3;
  const statIn = 1.4;
  const fillStart = 1.7;
  const fillEach = 0.035;
  const fillDur = 0.25;
  const fillTotal = n * fillEach;

  const c0 = (cols - 1) / 2;
  const rows = total / cols;
  const r0 = (rows - 1) / 2;

  // 100 个小方格
  const cells = Array.from({length: total}, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const ring = Math.round(Math.hypot(col - c0, row - r0));
    const g = power2Out(clamp01((t - (growAt + ring * ringDur + srand(i) * jitter)) / growDur));
    const f = i < n ? power2Out(clamp01((t - (fillStart + i * fillEach)) / fillDur)) : 0;

    const bg = f > 0 ? theme.accent : 'rgba(255, 255, 255, 0.12)';

    return (
      <div
        key={i}
        style={{
          width: 20 * scale,
          height: 20 * scale,
          borderRadius: 4 * scale,
          opacity: g,
          transform: `scale(${lerp(0.8, 1, g)})`,
          background: bg,
          transition: 'background 0.1s',
        }}
      />
    );
  });

  // 大数字与标签
  const bigIn = power3Out(clamp01((t - statIn) / 0.5));
  const lblIn = power3Out(clamp01((t - (statIn + 0.1)) / 0.5));
  const count = Math.round(lerp(0, n, clamp01((t - fillStart) / fillTotal)));

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 60 * scale,
      }}>
        {/* 10x10 网格 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${20 * scale}px)`,
          gap: 6 * scale,
          padding: 16 * scale,
          background: '#141c2b',
          borderRadius: 14 * scale,
          border: `1px solid ${theme.muted}33`,
        }}>
          {cells}
        </div>

        {/* 右侧大数字统计 */}
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <div style={{
            fontSize: 96 * scale,
            fontWeight: 800,
            lineHeight: 1,
            color: theme.accent,
            fontVariantNumeric: 'tabular-nums',
            opacity: bigIn,
            transform: `translateY(${lerp(14 * scale, 0, bigIn)}px)`,
          }}>
            <span>{count}</span>
            <small style={{fontSize: 44 * scale, marginLeft: 6 * scale}}>{unit}</small>
          </div>
          <div style={{
            fontSize: 24 * scale,
            fontWeight: 650,
            lineHeight: 1.4,
            color: theme.muted,
            marginTop: 18 * scale,
            opacity: lblIn,
            transform: `translateY(${lerp(14 * scale, 0, lblIn)}px)`,
          }}>
            {label.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
