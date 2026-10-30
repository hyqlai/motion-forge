import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, clamp01, lerp, power2InOut, power2Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type CursorActorDemoProps = {
  theme: Theme;
  durationInFrames: number;
};

export const CursorActorDemo: React.FC<CursorActorDemoProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  // 光标轨迹插值：起点 (896, 468) → 开关 1 (480, 220) → 开关 2 (480, 290)
  const p0 = {x: 820 * scale, y: 440 * scale};
  const tg1 = {x: 520 * scale, y: 220 * scale};
  const tg2 = {x: 520 * scale, y: 290 * scale};

  let curX = p0.x;
  let curY = p0.y;
  let cursorScale = 1;
  let isSw1On = false;
  let isSw2On = false;

  // 0.4s - 1.0s 移动到开关 1
  if (t < 0.4) {
    curX = p0.x;
    curY = p0.y;
  } else if (t < 1.0) {
    const p = power2InOut(clamp01((t - 0.4) / 0.6));
    curX = lerp(p0.x, tg1.x, p);
    curY = lerp(p0.y, tg1.y, p);
  } else if (t < 1.4) {
    // 悬停并点击开关 1
    curX = tg1.x;
    curY = tg1.y;
    const clickP = clamp01((t - 1.1) / 0.15);
    cursorScale = t >= 1.1 && t < 1.25 ? 0.88 : 1;
    if (t >= 1.2) isSw1On = true;
  } else if (t < 2.0) {
    // 移动到开关 2
    isSw1On = true;
    const p = power2InOut(clamp01((t - 1.4) / 0.6));
    curX = lerp(tg1.x, tg2.x, p);
    curY = lerp(tg1.y, tg2.y, p);
  } else if (t < 2.5) {
    isSw1On = true;
    curX = tg2.x;
    curY = tg2.y;
    cursorScale = t >= 2.1 && t < 2.25 ? 0.88 : 1;
    if (t >= 2.2) isSw2On = true;
  } else {
    isSw1On = true;
    isSw2On = true;
    curX = tg2.x;
    curY = tg2.y;
  }

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      {/* 软件设置界面面板 */}
      <div style={{
        width: 540 * scale,
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
        <div style={{fontSize: 20 * scale, fontWeight: 750, borderBottom: `1px solid ${theme.muted}22`, paddingBottom: 14 * scale}}>
          渲染引擎偏好设置
        </div>

        {/* 开关 1 */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 48 * scale}}>
          <div>
            <div style={{fontSize: 15 * scale, fontWeight: 700}}>开启 GPU 离屏硬件加速</div>
            <div style={{fontSize: 12 * scale, color: theme.muted}}>优先调用系统显卡执行实时像素光追</div>
          </div>
          <div style={{
            width: 48 * scale,
            height: 26 * scale,
            borderRadius: 13 * scale,
            background: isSw1On ? theme.accent : '#25344d',
            position: 'relative',
            transition: 'background 0.2s',
          }}>
            <div style={{
              position: 'absolute',
              left: isSw1On ? 24 * scale : 2 * scale,
              top: 2 * scale,
              width: 22 * scale,
              height: 22 * scale,
              borderRadius: '50%',
              background: isSw1On ? '#0c111b' : '#ffffff',
              transition: 'left 0.2s',
            }} />
          </div>
        </div>

        {/* 开关 2 */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 48 * scale}}>
          <div>
            <div style={{fontSize: 15 * scale, fontWeight: 700}}>开启高动态范围颜色深度 (HDR)</div>
            <div style={{fontSize: 12 * scale, color: theme.muted}}>提升色彩饱和度与超高光动态细节</div>
          </div>
          <div style={{
            width: 48 * scale,
            height: 26 * scale,
            borderRadius: 13 * scale,
            background: isSw2On ? theme.accent : '#25344d',
            position: 'relative',
            transition: 'background 0.2s',
          }}>
            <div style={{
              position: 'absolute',
              left: isSw2On ? 24 * scale : 2 * scale,
              top: 2 * scale,
              width: 22 * scale,
              height: 22 * scale,
              borderRadius: '50%',
              background: isSw2On ? '#0c111b' : '#ffffff',
              transition: 'left 0.2s',
            }} />
          </div>
        </div>
      </div>

      {/* 模拟操作系统鼠标光标 */}
      <div style={{
        position: 'absolute',
        left: curX,
        top: curY,
        pointerEvents: 'none',
        zIndex: 50,
        transform: `scale(${cursorScale})`,
        transformOrigin: '0 0',
        transition: 'transform 0.1s',
      }}>
        <svg width={28 * scale} height={28 * scale} viewBox="0 0 24 24" style={{filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))'}}>
          <path
            d="M 2 2 L 9 20 L 13 13 L 20 9 Z"
            fill="#ffffff"
            stroke="#1d1d1f"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
