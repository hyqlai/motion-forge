import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2InOut} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type LongTakeWorldProps = {
  theme: Theme;
  durationInFrames: number;
};

export const LongTakeWorld: React.FC<LongTakeWorldProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  // 镜头持续沿 Z 轴穿透
  const pTravel = power2InOut(clamp01((t - 1.2) / 2.0));

  // 第一幕：从 0 前推到 800px（穿过相机出画）
  const z1 = lerp(0, 800 * scale, pTravel);
  const op1 = lerp(1, 0, clamp01((pTravel - 0.5) / 0.4));

  // 第二幕：从 -1000px 远处推进到 0（中央落定）
  const z2 = lerp(-1000 * scale, 0, pTravel);
  const op2 = clamp01(pTravel / 0.5);

  return (
    <AbsoluteFill style={{
      background: 'radial-gradient(ellipse at 50% 50%, #151d2c, #070a10 75%)',
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
      perspective: '1000px',
      perspectiveOrigin: '50% 50%',
    }}>
      {/* 第一幕 */}
      {op1 > 0.01 && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          transform: `translate3d(0px, 0px, ${z1}px)`,
          opacity: op1,
          willChange: 'transform, opacity',
        }}>
          <div style={{
            width: 500 * scale,
            height: 280 * scale,
            background: '#141c2b',
            border: `2px solid ${theme.muted}44`,
            borderRadius: 16 * scale,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 30 * scale,
            boxSizing: 'border-box',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}>
            <div style={{fontSize: 14 * scale, fontWeight: 800, color: theme.accent, marginBottom: 8 * scale}}>
              SCENE A · 概念
            </div>
            <div style={{fontSize: 28 * scale, fontWeight: 800, textAlign: 'center'}}>
              一切逻辑始于最初的设想
            </div>
          </div>
        </div>
      )}

      {/* 第二幕 */}
      {op2 > 0.01 && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          transform: `translate3d(0px, 0px, ${z2}px)`,
          opacity: op2,
          willChange: 'transform, opacity',
        }}>
          <div style={{
            width: 500 * scale,
            height: 280 * scale,
            background: '#141c2b',
            border: `2px solid ${theme.accent}`,
            borderRadius: 16 * scale,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 30 * scale,
            boxSizing: 'border-box',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}>
            <div style={{fontSize: 14 * scale, fontWeight: 800, color: theme.accent, marginBottom: 8 * scale}}>
              SCENE B · 终局
            </div>
            <div style={{fontSize: 28 * scale, fontWeight: 800, textAlign: 'center', color: theme.accent}}>
              一镜到底穿透至最终事实
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
