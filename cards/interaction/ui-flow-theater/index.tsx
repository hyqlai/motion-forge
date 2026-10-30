import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, clamp01, lerp, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type UiFlowTheaterProps = {
  theme: Theme;
  durationInFrames: number;
};

export const UiFlowTheater: React.FC<UiFlowTheaterProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  // 阶段 1：0.5s 开关点击打开
  const isToggleOn = t >= 1.2;

  // 阶段 2：2.0s - 3.2s 滑杆从 20% 拖动到 85%
  let sliderVal = 20;
  if (t < 2.0) sliderVal = 20;
  else if (t < 3.2) {
    const p = power2Out(clamp01((t - 2.0) / 1.2));
    sliderVal = lerp(20, 85, p);
  } else {
    sliderVal = 85;
  }

  // 阶段 3：4.5s 点击保存按钮
  const isSaved = t >= 5.0;
  const saveBtnP = isSaved ? backOut(1.8)(clamp01((t - 5.0) / 0.3)) : 1;
  const toastP = isSaved ? power3Out(clamp01((t - 5.2) / 0.4)) : 0;

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
        width: 600 * scale,
        background: '#141c2b',
        border: `1px solid ${theme.muted}33`,
        borderRadius: 16 * scale,
        padding: `${26 * scale}px ${32 * scale}px`,
        boxSizing: 'border-box',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 22 * scale,
        position: 'relative',
      }}>
        <div style={{fontSize: 20 * scale, fontWeight: 800, borderBottom: `1px solid ${theme.muted}22`, paddingBottom: 12 * scale}}>
          项目高级渲染配置
        </div>

        {/* 步骤 1：开关 */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <div style={{fontSize: 15 * scale, fontWeight: 700}}>开启多线程异步分块合成</div>
            <div style={{fontSize: 12 * scale, color: theme.muted}}>并发分配计算任务至多核心处理器</div>
          </div>
          <div style={{
            width: 46 * scale,
            height: 24 * scale,
            borderRadius: 12 * scale,
            background: isToggleOn ? theme.accent : '#25344d',
            position: 'relative',
            transition: 'background 0.2s',
          }}>
            <div style={{
              position: 'absolute',
              left: isToggleOn ? 24 * scale : 2 * scale,
              top: 2 * scale,
              width: 20 * scale,
              height: 20 * scale,
              borderRadius: '50%',
              background: isToggleOn ? '#0c111b' : '#fff',
              transition: 'left 0.2s',
            }} />
          </div>
        </div>

        {/* 步骤 2：滑杆 */}
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 13 * scale, color: theme.muted, marginBottom: 8 * scale}}>
            <span>动态色彩采样深度</span>
            <span style={{fontFamily: 'monospace', fontWeight: 700, color: theme.foreground}}>{Math.round(sliderVal)}%</span>
          </div>
          <div style={{height: 8 * scale, background: '#1e293b', borderRadius: 4 * scale, position: 'relative'}}>
            <div style={{width: `${sliderVal}%`, height: '100%', background: theme.accent, borderRadius: 4 * scale}} />
            <div style={{
              position: 'absolute',
              left: `calc(${sliderVal}% - ${8 * scale}px)`,
              top: -4 * scale,
              width: 16 * scale,
              height: 16 * scale,
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
            }} />
          </div>
        </div>

        {/* 步骤 3：保存按钮 */}
        <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: 10 * scale}}>
          <div style={{
            padding: `${10 * scale}px ${28 * scale}px`,
            borderRadius: 8 * scale,
            background: isSaved ? '#202b3d' : theme.accent,
            color: isSaved ? theme.muted : '#0c111b',
            fontSize: 14 * scale,
            fontWeight: 800,
            transform: isSaved ? `scale(${saveBtnP})` : 'none',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          }}>
            {isSaved ? '已保存设置' : '保存当前配置'}
          </div>
        </div>

        {/* 成功浮窗 Toast */}
        {isSaved && (
          <div style={{
            position: 'absolute',
            left: '50%',
            bottom: 24 * scale,
            transform: `translate(-50%, ${lerp(20 * scale, 0, toastP)}px)`,
            opacity: toastP,
            background: '#10a37f',
            color: '#ffffff',
            padding: `${8 * scale}px ${20 * scale}px`,
            borderRadius: 20 * scale,
            fontSize: 13 * scale,
            fontWeight: 700,
            boxShadow: '0 10px 30px rgba(16, 163, 127, 0.4)',
          }}>
            ✓ 配置已生效并同步至集群
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
