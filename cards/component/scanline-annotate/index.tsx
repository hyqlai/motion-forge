import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, clamp01, lerp, power1Out, power2In, power2Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

type Target = {x: number; y: number; w: number; h: number; label: string};

const TARGETS: Target[] = [
  {x: 26, y: 80, w: 260, h: 48, label: '01 · 导航层级优化'},
  {x: 320, y: 150, w: 230, h: 44, label: '02 · 核心行动号召'},
  {x: 26, y: 220, w: 340, h: 54, label: '03 · 视觉证明链条'},
  {x: 26, y: 310, w: 420, h: 48, label: '04 · 性能基线说明'},
];

export type ScanlineAnnotateProps = {
  theme: Theme;
  durationInFrames: number;
};

export const ScanlineAnnotate: React.FC<ScanlineAnnotateProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const t0 = 0.5;
  const dur = 2.4;
  const yFrom = -30 * scale;
  const yTo = 416 * scale;
  const pad = 8 * scale;
  const bkScale = 1.75;
  const bkDur = 0.4;
  const labelLag = 0.17;
  const exitAt = 5.2;

  // 扫描线匀速进度
  const scanP = clamp01((t - t0) / dur);
  const curScanY = lerp(yFrom, yTo, scanP);
  const scanOpacity = t >= 0.35 && t < 2.9 ? 1 : 1 - power1Out(clamp01((t - 2.9) / 0.2));

  // 各目标触发时刻由其下缘反算
  const triggerTimes = TARGETS.map((tgt, i) => {
    const bottomRel = (tgt.y + tgt.h) * scale;
    const p = (bottomRel - yFrom) / (yTo - yFrom);
    return Math.max(t0 + 0.3 + i * 0.25, t0 + p * dur);
  });

  const exitK = 1 - power2In(clamp01((t - exitAt) / 0.4));

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      {/* 假文档截图 */}
      <div style={{
        position: 'absolute',
        left: 80 * scale,
        top: 48 * scale,
        width: 580 * scale,
        height: 396 * scale,
        background: '#141c2b',
        border: `1px solid ${theme.muted}33`,
        borderRadius: 12 * scale,
        overflow: 'hidden',
        boxShadow: '0 16px 50px rgba(0,0,0,0.5)',
        opacity: exitK,
      }}>
        {/* 顶栏 */}
        <div style={{height: 38 * scale, background: '#1c2638', display: 'flex', alignItems: 'center', gap: 6 * scale, padding: `0 ${14 * scale}px`}}>
          <i style={{width: 8 * scale, height: 8 * scale, borderRadius: '50%', background: '#ff5f56', display: 'inline-block'}} />
          <i style={{width: 8 * scale, height: 8 * scale, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block'}} />
          <i style={{width: 8 * scale, height: 8 * scale, borderRadius: '50%', background: '#27c93f', display: 'inline-block'}} />
        </div>

        {/* 假内容块 */}
        {TARGETS.map((tgt, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: tgt.x * scale,
              top: tgt.y * scale,
              width: tgt.w * scale,
              height: tgt.h * scale,
              borderRadius: 6 * scale,
              background: '#1e2b40',
              border: `1px solid ${theme.muted}22`,
            }}
          />
        ))}

        {/* 匀速水平扫描线 */}
        {scanOpacity > 0.01 && (
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: curScanY,
            height: 2 * scale,
            background: `linear-gradient(90deg, transparent, ${theme.accent} 20%, ${theme.accent} 80%, transparent)`,
            boxShadow: `0 0 16px ${theme.accent}`,
            opacity: scanOpacity,
          }} />
        )}

        {/* 触发后的取景框 */}
        {TARGETS.map((tgt, i) => {
          const trigT = triggerTimes[i];
          if (t < trigT) return null;

          const p = backOut(2.0)(clamp01((t - trigT) / bkDur));
          const curS = lerp(bkScale, 1, p);
          const op = clamp01((t - trigT) / 0.15);

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: (tgt.x - 6) * scale,
                top: (tgt.y - 4) * scale,
                width: (tgt.w + 12) * scale,
                height: (tgt.h + 8) * scale,
                border: `2px solid ${theme.accent}`,
                borderRadius: 8 * scale,
                transform: `scale(${curS})`,
                transformOrigin: '50% 50%',
                opacity: op,
                pointerEvents: 'none',
              }}
            />
          );
        })}
      </div>

      {/* 右侧点评列表 */}
      <div style={{
        position: 'absolute',
        left: 690 * scale,
        top: 60 * scale,
        width: 240 * scale,
        display: 'flex',
        flexDirection: 'column',
        gap: 16 * scale,
        opacity: exitK,
      }}>
        <div style={{fontSize: 13 * scale, fontWeight: 800, color: theme.accent, letterSpacing: 1}}>
          AI 智能审查报告
        </div>
        {TARGETS.map((tgt, i) => {
          const trigT = triggerTimes[i];
          const lblT = trigT + labelLag;
          const on = t >= lblT;
          const p = power2Out(clamp01((t - lblT) / 0.3));

          return on ? (
            <div
              key={i}
              style={{
                fontSize: 14 * scale,
                fontWeight: 700,
                color: theme.foreground,
                padding: `${8 * scale}px ${12 * scale}px`,
                borderRadius: 8 * scale,
                background: '#141c2b',
                border: `1px solid ${theme.accent}55`,
                opacity: p,
                transform: `translateX(${lerp(14 * scale, 0, p)}px)`,
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
              }}
            >
              {tgt.label}
            </div>
          ) : null;
        })}
      </div>
    </AbsoluteFill>
  );
};
