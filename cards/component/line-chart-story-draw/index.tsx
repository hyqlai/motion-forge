import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, clamp01, lerp, power1Out, power2Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

type Pt = [number, number];

export type LineChartStoryDrawProps = {
  title?: string;
  subtitle?: string;
  theme: Theme;
  durationInFrames: number;
  hold0?: number;
};

const polyD = (pts: Pt[]) => `M ${pts.map((p) => `${p[0]} ${p[1]}`).join(' L ')}`;
const segLen = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const polyTotal = (pts: Pt[]) => {
  let L = 0;
  for (let i = 0; i < pts.length - 1; i++) L += segLen(pts[i], pts[i + 1]);
  return L;
};

export const LineChartStoryDraw: React.FC<LineChartStoryDrawProps> = ({
  title = '业务假设与增长推演',
  subtitle = 'SCENARIO FORECAST · 2026',
  theme,
  hold0 = 0.6,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scaleRatio = width / 960;

  const pivot: Pt = [480, 278];
  const history: Pt[] = [[200, 354], [256, 338], [312, 350], [368, 310], [424, 324], [480, 278]];
  const seg0Pts: Pt[] = [[480, 278], [536, 268], [592, 262], [648, 248]];
  const seg1Pts: Pt[] = [[648, 248], [704, 234], [760, 216], [816, 198]];
  const altPts: Pt[] = [[480, 278], [560, 240], [648, 196], [736, 152], [816, 118]];

  const annotPop = 0.25;
  const annotHold = 0.35;
  const annotAt = hold0;
  const growAt0 = annotAt + annotPop + annotHold; // 1.20
  const growAt1 = growAt0 + 0.6; // 1.80
  const altAt = growAt0 + 0.2; // 1.40

  // 拐点标注
  const annotP = backOut(1.8)(clamp01((t - annotAt) / annotPop));

  // 主线段①
  const L0 = polyTotal(seg0Pts);
  const p0 = power2Out(clamp01((t - growAt0) / 0.6));
  const dash0 = L0 * (1 - p0);

  // 主线段②
  const L1 = polyTotal(seg1Pts);
  const p1 = power2Out(clamp01((t - growAt1) / 0.6));
  const dash1 = L1 * (1 - p1);

  // 对比虚线
  const Lalt = polyTotal(altPts);
  const pAlt = power2Out(clamp01((t - altAt) / 0.7));
  const dashAlt = Lalt * (1 - pAlt);

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      <div style={{position: 'absolute', left: 56 * scaleRatio, top: 30 * scaleRatio}}>
        <div style={{fontSize: 22 * scaleRatio, fontWeight: 750, letterSpacing: 1}}>{title}</div>
        <div style={{fontSize: 12 * scaleRatio, color: theme.muted, letterSpacing: 1, marginTop: 4 * scaleRatio}}>{subtitle}</div>
      </div>

      <svg viewBox="0 0 960 540" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
        {/* 坐标网格底线 */}
        <line x1={160} y1={400} x2={860} y2={400} stroke={`${theme.muted}33`} strokeWidth={1.5} />
        <line x1={160} y1={300} x2={860} y2={300} stroke={`${theme.muted}22`} strokeDasharray="4 4" strokeWidth={1} />
        <line x1={160} y1={200} x2={860} y2={200} stroke={`${theme.muted}22`} strokeDasharray="4 4" strokeWidth={1} />

        {/* 历史线（实线灰） */}
        <path d={polyD(history)} fill="none" stroke={theme.muted} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

        {/* 主推演线（主题强调色） */}
        <path d={polyD(seg0Pts)} fill="none" stroke={theme.accent} strokeWidth={3.5} strokeLinecap="round" strokeDasharray={L0} strokeDashoffset={dash0} />
        <path d={polyD(seg1Pts)} fill="none" stroke={theme.accent} strokeWidth={3.5} strokeLinecap="round" strokeDasharray={L1} strokeDashoffset={dash1} />

        {/* 对比虚线 */}
        <path d={polyD(altPts)} fill="none" stroke="#4ecb71" strokeWidth={2.5} strokeDasharray="8 6" strokeDashoffset={dashAlt} />

        {/* 拐点圆圈 */}
        <circle cx={pivot[0]} cy={pivot[1]} r={6} fill={theme.background} stroke={theme.accent} strokeWidth={3} />
      </svg>

      {/* 拐点标注气泡 */}
      {annotP > 0.01 && (
        <div style={{
          position: 'absolute',
          left: 410 * scaleRatio,
          top: 320 * scaleRatio,
          background: '#141c2b',
          border: `1.5px solid ${theme.accent}`,
          color: theme.accent,
          fontSize: 13 * scaleRatio,
          fontWeight: 750,
          padding: `${4 * scaleRatio}px ${10 * scaleRatio}px`,
          borderRadius: 6 * scaleRatio,
          transform: `scale(${annotP})`,
          transformOrigin: '50% 0%',
          boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
        }}>
          拐点假设 ▲
        </div>
      )}
    </AbsoluteFill>
  );
};
