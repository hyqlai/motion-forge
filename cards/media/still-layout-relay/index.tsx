import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power1Out, power2InOut, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type StillLayoutRelayProps = {
  theme: Theme;
  durationInFrames: number;
};

export const StillLayoutRelay: React.FC<StillLayoutRelayProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scaleRatio = width / 960;

  // 默认运行一主两辅（hero-duo）高光接力排版
  const enterAt = [0.3, 0.8, 0.95];
  const enterDur = [0.6, 0.55, 0.55];
  const relays = [[2.4, 1], [4.2, 2]];
  const resetAt = 6.0;

  // 当前主角判定
  let activeHero = 0;
  if (t >= relays[1][0] && t < resetAt) activeHero = 2;
  else if (t >= relays[0][0] && t < resetAt) activeHero = 1;

  // 主图持续慢推
  const heroPush = lerp(1, 1.06, clamp01(t / 8.0));

  const rects = [
    {x: 62 * scaleRatio, y: 66 * scaleRatio, w: 546 * scaleRatio, h: 388 * scaleRatio},
    {x: 650 * scaleRatio, y: 66 * scaleRatio, w: 250 * scaleRatio, h: 176 * scaleRatio},
    {x: 650 * scaleRatio, y: 278 * scaleRatio, w: 250 * scaleRatio, h: 176 * scaleRatio},
  ];

  const labels = ['核心论据 · 产研对比主图', '佐证 A · 采样明细', '佐证 B · 数据复核'];

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      {rects.map((r, i) => {
        const eAt = enterAt[i];
        const pIn = power3Out(clamp01((t - eAt) / enterDur[i]));
        const yIn = i === 0 ? lerp(30 * scaleRatio, 0, pIn) : 0;
        const xIn = i > 0 ? lerp(40 * scaleRatio, 0, pIn) : 0;

        const isAct = activeHero === i;
        const dimB = activeHero !== 0 && !isAct ? 0.5 : 1;
        const cardScale = isAct ? 1.03 : 1;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: r.x + xIn,
              top: r.y + yIn,
              width: r.w,
              height: r.h,
              borderRadius: 12 * scaleRatio,
              background: '#141c2b',
              border: `2px solid ${isAct ? theme.accent : `${theme.muted}33`}`,
              boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
              overflow: 'hidden',
              opacity: pIn * dimB,
              transform: `scale(${cardScale})`,
              transition: 'border-color 0.3s, opacity 0.3s, transform 0.3s',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              padding: 16 * scaleRatio,
            }}
          >
            <div style={{
              flex: 1,
              background: i === 0 ? '#1e2b42' : '#192336',
              borderRadius: 8 * scaleRatio,
              overflow: 'hidden',
              display: 'grid',
              placeItems: 'center',
              transform: i === 0 ? `scale(${heroPush})` : 'none',
              transformOrigin: '50% 50%',
            }}>
              <span style={{fontSize: i === 0 ? 32 * scaleRatio : 18 * scaleRatio, fontWeight: 800, color: isAct ? theme.accent : theme.muted}}>
                EVIDENCE {i + 1}
              </span>
            </div>
            <div style={{fontSize: 13 * scaleRatio, fontWeight: 700, marginTop: 10 * scaleRatio, color: isAct ? theme.accent : theme.muted}}>
              {labels[i]}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
