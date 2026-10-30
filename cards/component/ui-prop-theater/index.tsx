import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, clamp01, lerp, power1Out, power2Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type UiPropTheaterProps = {
  theme: Theme;
  durationInFrames: number;
};

const BEATS = [
  {at: 0.55, pct: 17},
  {at: 1.50, pct: 43, status: '正在解压渲染组件…', tick: 0},
  {at: 2.35, pct: 71, status: '正在构建统一内核…', tick: 1},
  {at: 3.60, pct: 96},
  {at: 4.55, pct: 100, status: '渲染管线已就绪', tick: 2, done: true},
];

const ROWS = [
  '检查系统依赖环境',
  '编译 WebGL 与 Three.js 着色器',
  '初始化 Remotion 离屏合成引擎',
];

export const UiPropTheater: React.FC<UiPropTheaterProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const jumpDur = 0.30;
  const tickDelay = 0.16;
  const tickDraw = 0.20;

  // 计算当前进度值
  let currentPct = 0;
  let lastPct = 0;
  let statusText = '正在下载模型管线…';

  for (let i = 0; i < BEATS.length; i++) {
    const b = BEATS[i];
    if (t >= b.at) {
      const p = power2Out(clamp01((t - b.at) / jumpDur));
      currentPct = lerp(lastPct, b.pct, p);
      lastPct = b.pct;
      if (b.status) statusText = b.status;
    }
  }

  // 收尾大完成勾弹出
  const doneAt = 4.71;
  const donePop = backOut(2.2)(clamp01((t - doneAt) / 0.26));
  const isDone = t >= doneAt;

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
        width: 520 * scale,
        background: '#141c2b',
        border: `1px solid ${theme.muted}33`,
        borderRadius: 16 * scale,
        padding: `${28 * scale}px`,
        boxSizing: 'border-box',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20 * scale,
      }}>
        {/* 顶部标题与状态 */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{fontSize: 18 * scale, fontWeight: 750}}>系统启动与资源加载</div>
          <div style={{fontSize: 13 * scale, color: theme.accent, fontWeight: 700}}>
            {statusText}
          </div>
        </div>

        {/* 进度条与数字 */}
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 13 * scale, color: theme.muted, marginBottom: 8 * scale}}>
            <span>全流程编译进度</span>
            <span style={{fontFamily: 'monospace', fontWeight: 700, color: theme.foreground}}>
              {Math.round(currentPct)}%
            </span>
          </div>
          <div style={{
            height: 10 * scale,
            background: '#1e293b',
            borderRadius: 5 * scale,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${currentPct}%`,
              height: '100%',
              background: theme.accent,
              borderRadius: 5 * scale,
              transition: 'width 0.1s linear',
            }} />
          </div>
        </div>

        {/* 清单行打勾 */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 12 * scale, marginTop: 8 * scale}}>
          {ROWS.map((rowName, idx) => {
            const beat = BEATS.find((b) => b.tick === idx);
            const tickTime = beat ? beat.at + tickDelay : 999;
            const ticked = t >= tickTime;
            const drawP = power2Out(clamp01((t - tickTime) / tickDraw));

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12 * scale,
                  fontSize: 14 * scale,
                  color: ticked ? theme.foreground : theme.muted,
                  padding: `${8 * scale}px ${12 * scale}px`,
                  borderRadius: 8 * scale,
                  background: ticked ? 'rgba(255,255,255,0.04)' : 'transparent',
                }}
              >
                <div style={{
                  width: 18 * scale,
                  height: 18 * scale,
                  borderRadius: '50%',
                  border: `1.5px solid ${ticked ? theme.accent : theme.muted}`,
                  display: 'grid',
                  placeItems: 'center',
                  background: ticked ? theme.accent : 'transparent',
                }}>
                  {ticked && (
                    <span style={{color: '#0c111b', fontSize: 11 * scale, fontWeight: 900}}>
                      ✓
                    </span>
                  )}
                </div>
                <span>{rowName}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
