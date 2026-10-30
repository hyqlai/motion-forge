import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, linear, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type NewsCardDeskProps = {
  theme: Theme;
  durationInFrames: number;
};

export const NewsCardDesk: React.FC<NewsCardDeskProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const slideIn = 0.4;
  const slideY = 60 * scale;
  const tiltA = -1.5;
  const tiltB = 2.0;
  const redlineAt = 1.0;
  const redline = 0.3;
  const cardBAt = 1.9;
  const cardBFrom = 320 * scale;

  // 卡 A 入场与 Ken Burns
  const pInA = power3Out(clamp01((t - 0.1) / slideIn));
  const yA = lerp(slideY, 0, pInA);
  const kbA = t >= 0.5 ? lerp(1, 1.04, clamp01((t - 0.5) / 8.0)) : 1;

  // 红线扫出
  const pRed = power2Out(clamp01((t - redlineAt) / redline));

  // 卡 B 入场
  const pInB = power3Out(clamp01((t - cardBAt) / slideIn));
  const xB = lerp(cardBFrom, 0, pInB);
  const kbB = t >= 2.3 ? lerp(1, 1.04, clamp01((t - 2.3) / 8.0)) : 1;

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      {/* 桌面背景暗调纹理 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(${theme.muted}22 1px, transparent 1.2px)`,
        backgroundSize: `${24 * scale}px ${24 * scale}px`,
        opacity: 0.6,
      }} />

      {/* 卡片 A（大主新闻） */}
      <div style={{
        position: 'absolute',
        left: 150 * scale,
        top: 105 * scale,
        width: 520 * scale,
        padding: `${24 * scale}px ${30 * scale}px ${26 * scale}px`,
        background: '#141c2b',
        border: `1px solid ${theme.muted}33`,
        borderRadius: 12 * scale,
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        transform: `translateY(${yA}px) rotate(${tiltA}deg) scale(${kbA})`,
        opacity: pInA,
        boxSizing: 'border-box',
        willChange: 'transform',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderBottom: `2px solid ${theme.accent}`,
          paddingBottom: 8 * scale,
          marginBottom: 14 * scale,
        }}>
          <span style={{fontSize: 20 * scale, fontWeight: 800, letterSpacing: 2 * scale}}>
            THE FINANCIAL CHRONICLE
          </span>
          <span style={{fontSize: 11 * scale, color: theme.muted}}>
            2026.10.28 · 晚报特别版
          </span>
        </div>
        <h2 style={{fontSize: 26 * scale, lineHeight: 1.4, margin: `0 0 ${14 * scale}px`, fontWeight: 800}}>
          全代码视频生成技术打破传统制作成本底线，
          <span style={{position: 'relative', display: 'inline-block'}}>
            <span>吞吐量激增三倍</span>
            <span style={{
              position: 'absolute',
              left: 0,
              bottom: 2 * scale,
              height: 4 * scale,
              background: '#e0452c',
              borderRadius: 2 * scale,
              width: `${pRed * 100}%`,
            }} />
          </span>
        </h2>
        <div style={{fontSize: 14 * scale, color: theme.muted, lineHeight: 1.6}}>
          多智能体协同框架与确定性离屏合成技术的结合，使得工业级短片交付周期从按周计算压缩至分钟级。
        </div>
      </div>

      {/* 卡片 B（第二张跟进报道） */}
      {t >= cardBAt && (
        <div style={{
          position: 'absolute',
          left: 520 * scale + xB,
          top: 235 * scale,
          width: 330 * scale,
          padding: `${18 * scale}px ${22 * scale}px ${20 * scale}px`,
          background: '#192336',
          border: `1.5px solid ${theme.accent}`,
          borderRadius: 10 * scale,
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          transform: `rotate(${tiltB}deg) scale(${kbB})`,
          opacity: pInB,
          boxSizing: 'border-box',
          zIndex: 5,
        }}>
          <div style={{fontSize: 12 * scale, fontWeight: 800, color: theme.accent, marginBottom: 8 * scale}}>
            TECH REVIEW · 快讯
          </div>
          <h3 style={{fontSize: 17 * scale, lineHeight: 1.35, margin: `0 0 ${10 * scale}px`, fontWeight: 750}}>
            行业头部机构开始全量接入统一动画协议
          </h3>
          <div style={{fontSize: 12 * scale, color: theme.muted, lineHeight: 1.5}}>
            高保真跨端复现与可编程时间线已成为核心考量指标。
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
