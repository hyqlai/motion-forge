import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2InOut, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type GlassCodeWalkProps = {
  code?: string;
  filename?: string;
  theme: Theme;
  durationInFrames: number;
  zoom?: number;
  dwell?: number;
};

const DEFAULT_CODE = [
  'import { AbsoluteFill } from "remotion";',
  'import { Typewriter } from "@/components/remocn";',
  '',
  'export function Intro() {',
  '  return (',
  '    <AbsoluteFill>',
  '      <Typewriter text="Ship it" />',
  '    </AbsoluteFill>',
  '  );',
  '}',
].join('\n');

export const GlassCodeWalk: React.FC<GlassCodeWalkProps> = ({
  code = DEFAULT_CODE,
  filename = 'Intro.tsx',
  theme,
  zoom = 1.68,
  dwell = 0.32,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scaleRatio = width / 960;

  const rawLines = code.split('\n');
  const leadIn = 0.32;
  const pushDur = 0.55;
  const stepDur = 0.26;
  const holdEnd = 0.30;
  const pullDur = 0.85;
  const dimFloor = 0.30;

  // 走读步骤时刻表
  const steps: {r: number; t: number}[] = [];
  let curT = leadIn + pushDur;
  rawLines.forEach((line, r) => {
    if (line.trim() !== '') {
      steps.push({r, t: curT});
      curT += dwell + stepDur;
    }
  });
  const tPull = curT + holdEnd;

  // 当前浮点行号与相机缩放
  let activeRow = steps[0]?.r ?? 0;
  let inWalk = false;
  let camZoom = 1;

  if (t < leadIn + pushDur) {
    const p = power2InOut(clamp01((t - leadIn) / pushDur));
    camZoom = lerp(1, zoom, p);
    activeRow = steps[0]?.r ?? 0;
  } else if (t < tPull) {
    inWalk = true;
    camZoom = zoom;
    for (let i = 0; i < steps.length; i++) {
      if (t >= steps[i].t) {
        if (i < steps.length - 1) {
          const next = steps[i + 1];
          const p = power2InOut(clamp01((t - (steps[i].t + dwell)) / stepDur));
          activeRow = lerp(steps[i].r, next.r, p);
        } else {
          activeRow = steps[i].r;
        }
      }
    }
  } else {
    const p = power2InOut(clamp01((t - tPull) / pullDur));
    camZoom = lerp(zoom, 1, p);
    activeRow = steps[steps.length - 1]?.r ?? 0;
  }

  // 计算行中心位置
  const rowH = 26 * scaleRatio;
  const rowTop = 20 * scaleRatio + activeRow * (rowH + 4 * scaleRatio);
  const targetCamY = -(rowTop - 120 * scaleRatio);

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      {/* 相机缩放变换层 */}
      <div style={{
        position: 'absolute',
        width: 600 * scaleRatio,
        height: 440 * scaleRatio,
        transform: `scale(${camZoom}) translateY(${inWalk || t >= tPull ? targetCamY : 0}px)`,
        transformOrigin: '50% 40%',
        willChange: 'transform',
      }}>
        {/* 毛玻璃窗口 */}
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: 16 * scaleRatio,
          background: 'rgba(20, 28, 44, 0.7)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${theme.muted}33`,
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* 顶栏 */}
          <div style={{
            height: 40 * scaleRatio,
            display: 'flex',
            alignItems: 'center',
            gap: 8 * scaleRatio,
            padding: `0 ${16 * scaleRatio}px`,
            borderBottom: `1px solid ${theme.muted}22`,
            background: 'rgba(15, 22, 35, 0.8)',
          }}>
            <i style={{width: 10 * scaleRatio, height: 10 * scaleRatio, borderRadius: '50%', background: '#ff5f57', display: 'inline-block'}} />
            <i style={{width: 10 * scaleRatio, height: 10 * scaleRatio, borderRadius: '50%', background: '#febc2e', display: 'inline-block'}} />
            <i style={{width: 10 * scaleRatio, height: 10 * scaleRatio, borderRadius: '50%', background: '#28c840', display: 'inline-block'}} />
            <span style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 12 * scaleRatio,
              color: theme.muted,
              fontFamily: 'monospace',
              marginRight: 40 * scaleRatio,
            }}>
              {filename}
            </span>
          </div>

          {/* 代码体 */}
          <div style={{position: 'relative', flex: 1, padding: `${20 * scaleRatio}px ${24 * scaleRatio}px`, fontFamily: 'monospace', fontSize: 16 * scaleRatio}}>
            {/* 高亮聚光带 */}
            {inWalk && (
              <div style={{
                position: 'absolute',
                left: 14 * scaleRatio,
                right: 14 * scaleRatio,
                top: rowTop - 2 * scaleRatio,
                height: rowH + 4 * scaleRatio,
                background: `${theme.accent}22`,
                borderLeft: `3px solid ${theme.accent}`,
                borderRadius: 4 * scaleRatio,
                pointerEvents: 'none',
                transition: 'top 0.1s ease-out',
              }} />
            )}

            {rawLines.map((line, r) => {
              const isBlank = line.trim() === '';
              const dist = Math.abs(r - activeRow);
              const op = inWalk ? Math.max(dimFloor, 1 - dist * 0.35) : 1;

              return (
                <div
                  key={r}
                  style={{
                    height: isBlank ? 14 * scaleRatio : rowH,
                    lineHeight: `${rowH}px`,
                    marginBottom: 4 * scaleRatio,
                    whiteSpace: 'pre',
                    opacity: op,
                    color: line.includes('import') || line.includes('export') || line.includes('function') || line.includes('return')
                      ? '#c4b5fd'
                      : (line.includes('"') ? '#86efac' : theme.foreground),
                  }}
                >
                  <span style={{display: 'inline-block', width: 28 * scaleRatio, color: theme.muted, opacity: 0.6}}>
                    {isBlank ? '' : String(r + 1).padStart(2, ' ')}
                  </span>
                  <span>{line}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
