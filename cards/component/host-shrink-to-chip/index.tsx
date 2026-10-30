import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2InOut} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type HostShrinkToChipProps = {
  theme: Theme;
  durationInFrames: number;
};

export const HostShrinkToChip: React.FC<HostShrinkToChipProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const shrinkAt = 0.6;
  const shrinkDur = 0.8;

  const pShrink = power2InOut(clamp01((t - shrinkAt) / shrinkDur));

  // 主体位置与缩放：画心居中 (480, 270, 1.0) → 左下角 (80, 440, 0.22)
  const curScale = lerp(1, 0.22, pShrink);
  const curX = lerp(width / 2, 80 * scale, pShrink);
  const curY = lerp(height / 2, 440 * scale, pShrink);
  const curRadius = lerp(20 * scale, 50 * scale, pShrink);

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      {/* 背景让位展开的主内容大图 */}
      <div style={{
        position: 'absolute',
        left: 140 * scale,
        top: 60 * scale,
        width: 720 * scale,
        height: 420 * scale,
        borderRadius: 14 * scale,
        background: '#141c2b',
        border: `1px solid ${theme.muted}33`,
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        padding: 30 * scale,
        boxSizing: 'border-box',
        opacity: pShrink,
        transform: `scale(${lerp(0.95, 1, pShrink)})`,
      }}>
        <div style={{fontSize: 24 * scale, fontWeight: 800, color: theme.accent, marginBottom: 12 * scale}}>
          全屏业务大图让位就绪
        </div>
        <div style={{fontSize: 14 * scale, color: theme.muted, lineHeight: 1.6}}>
          出镜主体平滑收缩至左下角芯片，全屏视野完全释放给核心论据与演示数据。
        </div>
      </div>

      {/* 缩小的出镜主体 */}
      <div style={{
        position: 'absolute',
        left: curX - (150 * scale * curScale),
        top: curY - (200 * scale * curScale),
        width: 300 * scale * curScale,
        height: 400 * scale * curScale,
        borderRadius: curRadius,
        background: '#1e2b40',
        border: `3px solid ${theme.accent}`,
        boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        zIndex: 20,
      }}>
        <div style={{
          fontSize: 64 * scale * curScale,
          fontWeight: 900,
          color: theme.accent,
        }}>
          HOST
        </div>
      </div>
    </AbsoluteFill>
  );
};
