import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power1Out, power2Out, power3Out, sineInOut} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type MagnifierDetailProps = {
  children: React.ReactNode;
  theme: Theme;
  durationInFrames: number;
};

export const MagnifierDetail: React.FC<MagnifierDetailProps> = ({
  children,
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const zoom = 1.8;
  const magSize = 210 * scale;
  const magX = 745 * scale;
  const magY = 252 * scale;
  const targetPt = {x: 380 * scale, y: 240 * scale};

  const startDelay = 0.45;
  const popIn = 0.3;

  const pPop = power3Out(clamp01((t - startDelay) / popIn));
  const curMagX = lerp(targetPt.x, magX, pPop);
  const curMagY = lerp(targetPt.y, magY, pPop);
  const curMagScale = lerp(0.2, 1, pPop);
  const magOpacity = pPop;

  // 连接线描出
  const lineP = power2Out(clamp01((t - 0.70) / 0.25));

  // 镜内轻微扫视防死
  const panP = sineInOut(clamp01((t - 0.95) / 1.4));
  const panOffset = t >= 0.95 ? lerp(-7 * scale, 7 * scale, panP) : 0;

  return (
    <AbsoluteFill style={{
      background: theme.background,
      overflow: 'hidden',
    }}>
      {/* 底层画面（带轻微压暗） */}
      <AbsoluteFill style={{
        filter: magOpacity > 0 ? `brightness(${lerp(1, 0.75, magOpacity)})` : 'none',
        transition: 'filter 0.3s',
      }}>
        {children}
      </AbsoluteFill>

      {/* 目标框 */}
      {magOpacity > 0.01 && (
        <div style={{
          position: 'absolute',
          left: targetPt.x - 50 * scale,
          top: targetPt.y - 20 * scale,
          width: 100 * scale,
          height: 40 * scale,
          borderRadius: 6 * scale,
          border: `2px solid ${theme.accent}`,
          boxShadow: `0 0 14px ${theme.accent}66`,
          opacity: magOpacity,
          pointerEvents: 'none',
        }} />
      )}

      {/* 连接线 */}
      {magOpacity > 0.01 && (
        <svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'}}>
          <line
            x1={targetPt.x + 50 * scale}
            y1={targetPt.y}
            x2={lerp(targetPt.x + 50 * scale, curMagX - magSize / 2, lineP)}
            y2={lerp(targetPt.y, curMagY, lineP)}
            stroke={theme.accent}
            strokeWidth={2 * scale}
            strokeDasharray="4 4"
            opacity={magOpacity}
          />
        </svg>
      )}

      {/* 圆形放大镜 */}
      {magOpacity > 0.01 && (
        <div style={{
          position: 'absolute',
          left: curMagX - magSize / 2,
          top: curMagY - magSize / 2,
          width: magSize,
          height: magSize,
          borderRadius: '50%',
          border: `4px solid ${theme.accent}`,
          boxShadow: `0 16px 50px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(0,0,0,0.3)`,
          overflow: 'hidden',
          opacity: magOpacity,
          transform: `scale(${curMagScale})`,
          transformOrigin: '50% 50%',
          pointerEvents: 'none',
          zIndex: 20,
        }}>
          {/* 放大镜内画面：精准反向补偿 */}
          <div style={{
            position: 'absolute',
            left: -(targetPt.x * zoom - magSize / 2 + panOffset),
            top: -(targetPt.y * zoom - magSize / 2),
            width: width * zoom,
            height: height * zoom,
            transformOrigin: '0 0',
          }}>
            {children}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
