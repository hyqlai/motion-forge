import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, lerp, power2Out, power3Out, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type BarDatum = {label: string; value: number};
export type BarChartGrowthProps = {
  title?: string;
  bars: BarDatum[];
  /** 量程：全程固定，中途缩放对比就是骗人；不传取数据最大值 */
  maxValue?: number;
  /** 结论 chip，最后一根柱到顶那一帧才弹出 */
  chip?: string;
  theme: Theme;
  durationInFrames: number;
};

// 语义：柱组是"一串"不是多个动效 —— 错峰要密（0.06s），整组读作一次连续升起；
// 结论 chip 只在最后一根到顶那一帧弹出（数据讲完才允许下结论）。
const CONFIG = {
  lead: 0.3,          // 起手静置 s
  titleIn: 0.2,       // 标题淡入 s
  baseAt: 0.42,       // 基线开画时刻 s
  baseDur: 0.24,      // 基线 scaleX 0→1 s：先立地面再长柱
  barsAt: 0.62,       // 第一根柱起点 s
  barStagger: 0.06,   // 柱间错峰 s：本卡命门，>0.1 就散成多个动效
  barGrow: 0.28,      // 单柱 scaleY 0→1 s
  chipGap: 18,        // chip 底边距最高柱顶的留白 px：不许压柱顶
  chipPop: 0.2,       // chip 弹出 s
  chipScale: 0.8,     // chip 起始缩放
};

const CHART_H = 240;

export const BarChartGrowth: React.FC<BarChartGrowthProps> = ({
  title,
  bars,
  maxValue,
  chip,
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;
  const maxVal = maxValue ?? Math.max(...bars.map((bar) => bar.value), 1);

  const titleProgress = tween(t, CONFIG.lead, CONFIG.titleIn, power2Out);
  // 基线从左画出：先有地面，柱子才有"从地里长出来"的语义
  const baseProgress = tween(t, CONFIG.baseAt, CONFIG.baseDur, power2Out);
  // 最后一根到顶那一帧：结论 chip 弹出
  const lastTop = CONFIG.barsAt + (bars.length - 1) * CONFIG.barStagger + CONFIG.barGrow;
  const chipProgress = tween(t, lastTop, CONFIG.chipPop, backOut(1.4));
  // chip 落位由最高柱算出——换数据自动跟着抬高，永远压不到柱顶
  const maxHeight = (Math.max(...bars.map((bar) => bar.value), 0) / maxVal) * CHART_H * scale;
  const chartWidth = 420 * scale;

  return (
    <AbsoluteFill style={{background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily, overflow: 'hidden', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'relative', width: chartWidth}}>
        {title ? (
          <div style={{position: 'absolute', left: 0, top: -96 * scale, fontSize: 34 * scale, fontWeight: 600, letterSpacing: 1, opacity: titleProgress, whiteSpace: 'nowrap'}}>
            {title}
          </div>
        ) : null}
        <div style={{position: 'relative', width: '100%', height: CHART_H * scale}}>
          {chip ? (
            <div style={{
              position: 'absolute',
              right: 0,
              bottom: maxHeight + CONFIG.chipGap * scale,
              padding: `${8 * scale}px ${16 * scale}px`,
              borderRadius: 12 * scale,
              background: theme.accent,
              color: theme.background,
              fontSize: 22 * scale,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: 1,
              whiteSpace: 'nowrap',
              fontVariantNumeric: 'tabular-nums',
              transformOrigin: '100% 50%',
              opacity: Math.min(1, chipProgress),
              transform: `scale(${lerp(CONFIG.chipScale, 1, chipProgress)})`,
            }}>{chip}</div>
          ) : null}
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between'}}>
            {bars.map((bar, index) => {
              // 柱逐根升起，错峰密到读作一次连续动作；只用 scaleY，改 height 每帧重排
              const progress = tween(t, CONFIG.barsAt + index * CONFIG.barStagger, CONFIG.barGrow, power3Out);
              return (
                <div key={bar.label} style={{
                  width: 44 * scale,
                  height: (bar.value / maxVal) * CHART_H * scale,
                  background: theme.accent,
                  borderRadius: `${4 * scale}px ${4 * scale}px 0 0`,
                  transformOrigin: '50% 100%',
                  transform: `scaleY(${progress})`,
                }} />
              );
            })}
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, background: theme.muted, transform: `scaleX(${baseProgress})`, transformOrigin: '0% 50%'}} />
          <div style={{position: 'absolute', left: 0, right: 0, bottom: -30 * scale, display: 'flex', justifyContent: 'space-between', fontSize: 13 * scale, color: theme.muted}}>
            {bars.map((bar) => <span key={bar.label} style={{width: 44 * scale, textAlign: 'center'}}>{bar.label}</span>)}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
