import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, linear, power2In, power2Out, sineInOut} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type EvidenceScrollTourProps = {
  theme: Theme;
  durationInFrames: number;
};

export const EvidenceScrollTour: React.FC<EvidenceScrollTourProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  // 长页几何与位移曲线
  const stopY = 460.44 * scale;
  const maxScroll = 793 * scale;

  let y = 0;
  let breathScale = 1;

  if (t < 0.6) {
    y = 0;
  } else if (t < 1.292) {
    y = lerp(0, -45 * scale, power2In(clamp01((t - 0.6) / (1.292 - 0.6))));
  } else if (t < 3.796) {
    y = lerp(-45 * scale, -(stopY - 90 * scale), linear(clamp01((t - 1.292) / (3.796 - 1.292))));
  } else if (t < 5.180) {
    y = lerp(-(stopY - 90 * scale), -stopY, power2Out(clamp01((t - 3.796) / (5.180 - 3.796))));
  } else if (t < 6.680) {
    y = -stopY;
    const bp = clamp01((t - 5.180) / 1.5);
    const wave = (Math.sin(bp * Math.PI * 2 - Math.PI / 2) + 1) / 2;
    breathScale = lerp(1, 1.04, wave);
  } else if (t < 7.373) {
    y = lerp(-stopY, -(stopY + 45 * scale), power2In(clamp01((t - 6.680) / (7.373 - 6.680))));
  } else if (t < 8.892) {
    y = lerp(-(stopY + 45 * scale), -(maxScroll - 90 * scale), linear(clamp01((t - 7.373) / (8.892 - 7.373))));
  } else {
    y = lerp(-(maxScroll - 90 * scale), -maxScroll, power2Out(clamp01((t - 8.892) / (10.277 - 8.892))));
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
      {/* 视口窗口 */}
      <div style={{
        position: 'absolute',
        left: 200 * scale,
        top: 70 * scale,
        width: 560 * scale,
        height: 380 * scale,
        background: '#141c2b',
        border: `1px solid ${theme.muted}33`,
        borderRadius: 14 * scale,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        {/* 窗口栏 */}
        <div style={{
          height: 36 * scale,
          borderBottom: `1px solid ${theme.muted}22`,
          display: 'flex',
          alignItems: 'center',
          gap: 6 * scale,
          padding: `0 ${14 * scale}px`,
          background: '#192336',
        }}>
          <i style={{width: 8 * scale, height: 8 * scale, borderRadius: '50%', background: '#ff5f56', display: 'inline-block'}} />
          <i style={{width: 8 * scale, height: 8 * scale, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block'}} />
          <i style={{width: 8 * scale, height: 8 * scale, borderRadius: '50%', background: '#27c93f', display: 'inline-block'}} />
          <span style={{flex: 1, textAlign: 'center', fontSize: 11 * scale, color: theme.muted, fontFamily: 'monospace', marginRight: 30 * scale}}>
            service-level-agreement.pdf
          </span>
        </div>

        {/* 滚动内容区域 */}
        <div style={{position: 'relative', width: '100%', height: 344 * scale, overflow: 'hidden'}}>
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            padding: `${24 * scale}px ${28 * scale}px`,
            transform: `translateY(${y}px)`,
            willChange: 'transform',
          }}>
            <h4 style={{fontSize: 22 * scale, fontWeight: 700, margin: '0 0 16px'}}>服务等级协议 (SLA) 与责任细则</h4>
            <div style={{height: 12 * scale, width: '90%', background: '#223048', borderRadius: 4 * scale, marginBottom: 12 * scale}} />
            <div style={{height: 12 * scale, width: '85%', background: '#223048', borderRadius: 4 * scale, marginBottom: 12 * scale}} />
            <div style={{height: 12 * scale, width: '95%', background: '#223048', borderRadius: 4 * scale, marginBottom: 12 * scale}} />
            <div style={{height: 12 * scale, width: '70%', background: '#223048', borderRadius: 4 * scale, marginBottom: 28 * scale}} />

            <h5 style={{fontSize: 18 * scale, fontWeight: 700, margin: '0 0 14px'}}>第二条：不可抗力与可用性标准</h5>
            <div style={{height: 12 * scale, width: '92%', background: '#223048', borderRadius: 4 * scale, marginBottom: 12 * scale}} />
            <div style={{height: 12 * scale, width: '88%', background: '#223048', borderRadius: 4 * scale, marginBottom: 12 * scale}} />

            {/* 关键聚焦条目 */}
            <div style={{
              margin: `${18 * scale}px 0`,
              padding: `${10 * scale}px ${14 * scale}px`,
              borderRadius: 8 * scale,
              border: `2px solid ${theme.accent}`,
              background: `${theme.accent}15`,
              transform: `scale(${breathScale})`,
              transformOrigin: '50% 50%',
              fontSize: 15 * scale,
              fontWeight: 700,
              color: theme.accent,
            }}>
              ★ 第 2.3 条：平台承诺年均系统可用性不低于 99.99%
            </div>

            <div style={{height: 12 * scale, width: '95%', background: '#223048', borderRadius: 4 * scale, marginBottom: 12 * scale}} />
            <div style={{height: 12 * scale, width: '85%', background: '#223048', borderRadius: 4 * scale, marginBottom: 12 * scale}} />
            <div style={{height: 12 * scale, width: '90%', background: '#223048', borderRadius: 4 * scale, marginBottom: 28 * scale}} />

            <h5 style={{fontSize: 18 * scale, fontWeight: 700, margin: '0 0 14px'}}>第三条：赔付与违约界定</h5>
            <div style={{height: 12 * scale, width: '80%', background: '#223048', borderRadius: 4 * scale, marginBottom: 12 * scale}} />
            <div style={{height: 12 * scale, width: '75%', background: '#223048', borderRadius: 4 * scale, marginBottom: 12 * scale}} />
            <div style={{height: 12 * scale, width: '90%', background: '#223048', borderRadius: 4 * scale, marginBottom: 12 * scale}} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
