import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2Out, power3Out, sineInOut} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

type Box = {x: number; y: number; w: number; h: number};

const lerpBox = (a: Box, b: Box, p: number): Box => ({
  x: lerp(a.x, b.x, p),
  y: lerp(a.y, b.y, p),
  w: lerp(a.w, b.w, p),
  h: lerp(a.h, b.h, p),
});

export type FocusDimSpotlightProps = {
  theme: Theme;
  durationInFrames: number;
  dimTo?: number;
  jump?: number;
};

const TARGETS: Box[] = [
  {x: 143, y: 169, w: 674, h: 58},
  {x: 143, y: 226, w: 674, h: 58},
  {x: 143, y: 283, w: 674, h: 58},
  {x: 143, y: 340, w: 674, h: 58},
];
const WIDE: Box = {x: 124, y: 122, w: 712, h: 327};

export const FocusDimSpotlight: React.FC<FocusDimSpotlightProps> = ({
  theme,
  dimTo = 0.45,
  jump = 0.20,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scaleRatio = width / 960;

  const startDelay = 0.45;
  const dimIn = 0.30;
  const ringIn = 0.30;
  const firstHold = 1.25;
  const hold = 1.00;
  const morph = 0.45;
  const wideHold = 1.50;
  const restore = 0.40;
  const glowHalf = 1.60;
  const glowFrom = 0.35;

  const at: number[] = [];
  let tt = startDelay;
  at.push(tt);
  tt += dimIn + firstHold;
  for (let i = 1; i < TARGETS.length; i++) {
    at.push(tt);
    tt += jump + hold;
  }
  const tWide = tt;
  const tRestore = tWide + morph + wideHold;

  let ringGeo: Box = TARGETS[0];
  for (let i = 1; i < TARGETS.length; i++) {
    if (t >= at[i]) ringGeo = lerpBox(TARGETS[i - 1], TARGETS[i], power2Out(clamp01((t - at[i]) / jump)));
  }
  const spotGeo: Box = t >= tWide ? lerpBox(TARGETS[TARGETS.length - 1], WIDE, power2Out(clamp01((t - tWide) / morph))) : ringGeo;

  const spotOpacity = t < tRestore
    ? power2Out(clamp01((t - at[0]) / dimIn))
    : 1 - power2Out(clamp01((t - tRestore) / restore));

  const ringOpacity = t < tWide
    ? power3Out(clamp01((t - at[0]) / ringIn))
    : 1 - power2Out(clamp01((t - tWide) / 0.25));

  const ringScale = lerp(0.95, 1, power3Out(clamp01((t - at[0]) / ringIn)));

  const glowLife = tWide - (at[0] + ringIn);
  const glowReps = Math.max(1, Math.ceil(glowLife / glowHalf));
  let glowOpacity = glowFrom;
  const gT0 = at[0] + ringIn;
  if (t > gT0) {
    const cyc = Math.min((t - gT0) / glowHalf, glowReps + 1 - 1e-6);
    const k = Math.floor(cyc);
    const p = cyc - k;
    const pp = k % 2 === 1 ? 1 - p : p;
    glowOpacity = lerp(glowFrom, 1, sineInOut(pp));
  }

  const tableRows = [
    {col1: '企业云服务', col2: '¥ 482.4 亿', col3: '+32.4%', lead: true},
    {col1: '智能硬件', col2: '¥ 214.1 亿', col3: '+14.8%', lead: false},
    {col1: '开发者生态', col2: '¥ 128.6 亿', col3: '+42.1%', lead: false},
    {col1: '海外数字业务', col2: '¥ 86.9 亿', col3: '+68.2%', lead: false},
  ];

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        left: 124 * scaleRatio,
        top: 60 * scaleRatio,
        fontSize: 14 * scaleRatio,
        color: theme.muted,
        fontWeight: 600,
      }}>
        2026 财年 · 核心业务线拆解
      </div>

      {/* 底层报表卡片 */}
      <div style={{
        position: 'absolute',
        left: 124 * scaleRatio,
        top: 96 * scaleRatio,
        width: 712 * scaleRatio,
        background: '#141c2b',
        border: `1px solid ${theme.muted}33`,
        borderRadius: 12 * scaleRatio,
        padding: `${20 * scaleRatio}px ${24 * scaleRatio}px`,
        boxSizing: 'border-box',
      }}>
        <div style={{display: 'flex', borderBottom: `1px solid ${theme.muted}22`, paddingBottom: 10 * scaleRatio, fontSize: 13 * scaleRatio, color: theme.muted}}>
          <span style={{flex: 1.5}}>业务板块</span>
          <span style={{flex: 1, textAlign: 'right'}}>年度营收</span>
          <span style={{flex: 1, textAlign: 'right'}}>同比增长</span>
        </div>
        {tableRows.map((r, i) => (
          <div key={i} style={{display: 'flex', alignItems: 'center', height: 57 * scaleRatio, borderBottom: `1px solid ${theme.muted}15`, fontSize: 15 * scaleRatio}}>
            <span style={{flex: 1.5, fontWeight: 700}}>{r.col1}</span>
            <span style={{flex: 1, textAlign: 'right', fontFamily: 'monospace'}}>{r.col2}</span>
            <span style={{flex: 1, textAlign: 'right', color: theme.accent, fontWeight: 700}}>{r.col3}</span>
          </div>
        ))}
      </div>

      {/* 聚光窗口（大 spread 压暗外部） */}
      <div style={{
        position: 'absolute',
        left: spotGeo.x * scaleRatio,
        top: spotGeo.y * scaleRatio,
        width: spotGeo.w * scaleRatio,
        height: spotGeo.h * scaleRatio,
        borderRadius: 8 * scaleRatio,
        boxShadow: `0 0 0 9999px rgba(0, 0, 0, ${dimTo})`,
        pointerEvents: 'none',
        opacity: spotOpacity,
        zIndex: 5,
      }} />

      {/* 发光轮廓框 */}
      <div style={{
        position: 'absolute',
        left: ringGeo.x * scaleRatio,
        top: ringGeo.y * scaleRatio,
        width: ringGeo.w * scaleRatio,
        height: ringGeo.h * scaleRatio,
        borderRadius: 8 * scaleRatio,
        border: `2px solid ${theme.accent}`,
        transform: `scale(${ringScale})`,
        opacity: ringOpacity,
        pointerEvents: 'none',
        zIndex: 6,
      }}>
        <div style={{
          position: 'absolute',
          inset: -1,
          borderRadius: 9 * scaleRatio,
          boxShadow: `0 0 20px 3px ${theme.accent}`,
          opacity: glowOpacity,
        }} />
      </div>
    </AbsoluteFill>
  );
};
