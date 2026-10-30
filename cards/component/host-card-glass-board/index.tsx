import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, clamp01, lerp, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type HostCardGlassBoardProps = {
  theme: Theme;
  durationInFrames: number;
};

const TILES = [
  {title: '输入解析', desc: 'URL / 音频 / 题材', delay: 1.0},
  {title: '分镜规划', desc: 'Film IR 结构化生成', delay: 2.2},
  {title: '确定性渲染', desc: '纯代码 Remotion 输出', delay: 3.4},
];

export const HostCardGlassBoard: React.FC<HostCardGlassBoardProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  // 玻璃板升起
  const pBoard = power3Out(clamp01((t - 0.3) / 0.6));
  const boardY = lerp(40 * scale, 0, pBoard);

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      {/* 背后主体占位 */}
      <div style={{
        position: 'absolute',
        width: 220 * scale,
        height: 300 * scale,
        borderRadius: 20 * scale,
        background: '#192336',
        display: 'grid',
        placeItems: 'center',
        color: theme.muted,
        fontSize: 32 * scale,
        fontWeight: 900,
        zIndex: 1,
      }}>
        HOST
      </div>

      {/* 身前半透明毛玻璃板 */}
      <div style={{
        position: 'absolute',
        width: 720 * scale,
        height: 200 * scale,
        bottom: 70 * scale,
        borderRadius: 18 * scale,
        background: 'rgba(20, 28, 44, 0.75)',
        backdropFilter: 'blur(20px)',
        border: `1px solid rgba(255, 255, 255, 0.15)`,
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
        padding: `${20 * scale}px ${28 * scale}px`,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 5,
        opacity: pBoard,
        transform: `translateY(${boardY}px)`,
      }}>
        {TILES.map((tile, i) => {
          const on = t >= tile.delay;
          const p = on ? backOut(1.8)(clamp01((t - tile.delay) / 0.35)) : 0;
          const isCurrent = t >= tile.delay && (i === TILES.length - 1 || t < TILES[i + 1].delay);

          return (
            <div
              key={i}
              style={{
                width: 190 * scale,
                height: 140 * scale,
                borderRadius: 12 * scale,
                background: isCurrent ? `${theme.accent}18` : '#161f30',
                border: `1.5px solid ${isCurrent ? theme.accent : `${theme.muted}33`}`,
                padding: 16 * scale,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                transform: `scale(${p})`,
                opacity: p,
                transition: 'border-color 0.2s, background 0.2s',
              }}
            >
              <div style={{fontSize: 12 * scale, fontWeight: 800, color: isCurrent ? theme.accent : theme.muted, marginBottom: 6 * scale}}>
                STEP 0{i + 1}
              </div>
              <div style={{fontSize: 16 * scale, fontWeight: 750, marginBottom: 6 * scale}}>
                {tile.title}
              </div>
              <div style={{fontSize: 12 * scale, color: theme.muted}}>
                {tile.desc}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
