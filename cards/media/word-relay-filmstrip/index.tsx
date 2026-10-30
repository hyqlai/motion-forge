import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power1In, power2In, power2InOut, power2Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type WordRelayFilmstripProps = {
  noun?: string;
  verbs?: string[];
  theme: Theme;
  durationInFrames: number;
};

const DEFAULT_VERBS = ['写脚本', '选分镜', '调参数', '秒出片'];

export const WordRelayFilmstrip: React.FC<WordRelayFilmstripProps> = ({
  noun = 'Motion Forge 能够',
  verbs = DEFAULT_VERBS,
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const n = verbs.length;
  const period = 1.4;
  const scroll = 0.4;
  const cardH = 212 * scale;
  const startY = 164 * scale;
  const fadeOut = 0.18;
  const landIn = 0.25;
  const firstAt = 0.4;
  const exitDur = 0.45;
  const exitAt = 5.95;

  // 计算当前滚动段数与位移
  let scrollStep = 0;
  for (let i = 1; i < n; i++) {
    const swAt = firstAt + i * period;
    const p = power2InOut(clamp01((t - swAt) / scroll));
    scrollStep += p;
  }
  const filmY = startY - scrollStep * cardH;

  // 判定当前词序号与切换动画
  let curWordIdx = 0;
  for (let i = 1; i < n; i++) {
    const swAt = firstAt + i * period;
    if (t >= swAt + 0.2) curWordIdx = i;
  }

  const exitK = 1 - power2In(clamp01((t - exitAt) / exitDur));

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      {/* 左侧垂直胶片视口 */}
      <div style={{
        position: 'absolute',
        left: 80 * scale,
        top: 0,
        bottom: 0,
        width: 360 * scale,
        overflow: 'hidden',
        opacity: exitK,
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 360 * scale,
          transform: `translateY(${filmY}px)`,
          willChange: 'transform',
        }}>
          {verbs.map((verb, idx) => {
            const isCur = curWordIdx === idx;
            return (
              <div
                key={idx}
                style={{
                  width: 360 * scale,
                  height: 200 * scale,
                  marginBottom: 12 * scale,
                  borderRadius: 10 * scale,
                  background: '#141c2b',
                  border: `3px solid ${isCur ? theme.accent : `${theme.muted}33`}`,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  position: 'relative',
                  padding: 16 * scale,
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(135deg, ${idx % 2 === 0 ? '#1b263b' : '#141d2e'} 0%, #0d131f 100%)`,
                  display: 'grid',
                  placeItems: 'center',
                }}>
                  <span style={{fontSize: 32 * scale, fontWeight: 800, color: isCur ? theme.accent : theme.muted}}>
                    FEATURE 0{idx + 1}
                  </span>
                </div>
                <div style={{
                  position: 'absolute',
                  left: 12 * scale,
                  bottom: 10 * scale,
                  fontSize: 12 * scale,
                  color: '#fff',
                  background: 'rgba(0,0,0,0.6)',
                  padding: `2px ${8 * scale}px`,
                  borderRadius: 4 * scale,
                }}>
                  {verb}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 右侧两行动词接力 */}
      <div style={{
        position: 'absolute',
        left: 500 * scale,
        top: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        opacity: exitK,
      }}>
        <div style={{
          fontSize: 30 * scale,
          color: theme.muted,
          fontWeight: 650,
          letterSpacing: 2 * scale,
          marginBottom: 12 * scale,
        }}>
          {noun}
        </div>
        <div style={{
          fontSize: 64 * scale,
          fontWeight: 850,
          color: curWordIdx === n - 1 ? theme.accent : theme.foreground,
          letterSpacing: 1,
        }}>
          {verbs[curWordIdx]}
        </div>
      </div>
    </AbsoluteFill>
  );
};
