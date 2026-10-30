import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, lerp, power1InOut, power2Out, power3Out, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type MetricSparklineProps = {
  label: string;
  target: number;
  unit?: string;
  /** 折线数据点（任意数量，自动等距铺开并按 min/max 归一） */
  values: number[];
  xlabels?: string[];
  /** 涨跌方向：控制箭头朝向与用色（默认 up 用强调色） */
  direction?: 'up' | 'down';
  theme: Theme;
  durationInFrames: number;
};

// 语义：一个数字的"结论"要等它算完才成立 —— 滚动期间不许出现单位和箭头；
//       折线与计数同一刻起跑（数字和曲线讲的是同一件事，不是两件事）
const CONFIG = {
  lead: 0.3,           // 起手静置 s
  labelIn: 0.16,       // 小标签淡入 s
  countAt: 0.5,        // 计数起点 s（= 折线起点，两者必须同值）
  countDur: 0.9,       // 计数时长 s：<0.5 读作硬切，>1.4 观众等结论
  lineDur: 0.6,        // 折线画出时长 s：必须 < countDur，曲线先到位、数字后落定
  unitIn: 0.2,         // 单位淡入 s（计数结束那一刻）
  arrowRise: 12,       // 箭头从下弹入的位移 px
  arrowScale: 0.8,     // 箭头起始缩放
  arrowIn: 0.2,        // 箭头弹入 s
  dotPop: 0.18,        // 数据点弹出 s
};

// power1.inOut 的反函数：把"线画到第 i 个点"的长度比例换算成时间比例，
// 数据点才真的是"随线的推进"弹出，而不是按均分时间假装同步
const invPower1InOut = (y: number): number => (y < 0.5 ? Math.sqrt(y / 2) : 1 - Math.sqrt((1 - y) / 2));

export const MetricSparkline: React.FC<MetricSparklineProps> = ({
  label, target, unit = '%', values, xlabels, direction = 'up', theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;
  const color = direction === 'down' ? theme.muted : theme.accent;

  // 折线点位（viewBox 0 0 400 96）：等距铺开、按 min/max 归一到 16~74 区间
  const n = Math.max(2, values.length);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts: [number, number][] = values.slice(0, n).map((value, index) => [
    24 + index * (352 / (n - 1)),
    74 - ((value - min) / span) * 58,
  ]);

  // ① 小标签先淡入
  const labelProgress = tween(t, CONFIG.lead, CONFIG.labelIn, power2Out);
  // ② 大数字滚动计数（tabular-nums 防跳宽）
  const num = Math.round(lerp(0, target, tween(t, CONFIG.countAt, CONFIG.countDur, power2Out)));
  // ③ 计数结束那一刻：单位淡入 + 箭头从下弹入（结论成立的一拍）
  const landAt = CONFIG.countAt + CONFIG.countDur;
  const unitProgress = tween(t, landAt, CONFIG.unitIn, power2Out);
  const arrowProgress = tween(t, landAt, CONFIG.arrowIn, power3Out);

  // ④ 折线 dashoffset 画出 —— 与计数同刻起跑；总长精确算，dashL 取整防亚像素漏笔
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  let length = 0;
  const cumulative = pts.map((p, i) => {
    if (i) {
      const q = pts[i - 1];
      length += Math.hypot(p[0] - q[0], p[1] - q[1]);
    }
    return length;
  });
  const dashLength = Math.ceil(length) + 2;
  const lineProgress = tween(t, CONFIG.countAt, CONFIG.lineDur, power1InOut);

  return (
    <AbsoluteFill style={{background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily, overflow: 'hidden', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: 400 * scale}}>
        <div style={{fontSize: 16 * scale, color: theme.muted, letterSpacing: 3 * scale, opacity: labelProgress}}>{label}</div>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 8 * scale, marginTop: 10 * scale, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums'}}>
          <span style={{fontSize: 86 * scale, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.02em', color}}>{num}</span>
          <span style={{fontSize: 34 * scale, fontWeight: 600, lineHeight: 1, color, opacity: unitProgress}}>{unit}</span>
          <span style={{
            width: 20 * scale, height: 34 * scale, marginLeft: 4 * scale, transformOrigin: '50% 100%',
            opacity: arrowProgress,
            transform: `translateY(${lerp((direction === 'down' ? -CONFIG.arrowRise : CONFIG.arrowRise) * scale, 0, arrowProgress)}px) scale(${lerp(CONFIG.arrowScale, 1, arrowProgress)})`,
          }}>
            <svg viewBox="0 0 20 34" style={{display: 'block', width: '100%', height: '100%', transform: direction === 'down' ? 'rotate(180deg)' : undefined}}>
              <path d="M10 2 L19 14 H13.2 V32 H6.8 V14 H1 Z" fill={color} />
            </svg>
          </span>
        </div>
        <div style={{marginTop: 30 * scale, width: 400 * scale}}>
          <svg viewBox="0 0 400 96" style={{display: 'block', width: 400 * scale, height: 96 * scale, overflow: 'visible'}}>
            <line x1="0" y1="90" x2="400" y2="90" stroke={theme.muted} strokeOpacity={0.4} strokeWidth={1} />
            <path d={d} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round"
              strokeDasharray={dashLength} strokeDashoffset={dashLength * (1 - lineProgress)} />
            {pts.map((p, i) => {
              // 数据点跟着线端推进依次弹出（时间由线长比例反推）
              const at = CONFIG.countAt + CONFIG.lineDur * invPower1InOut(cumulative[i] / length);
              const s = tween(t, at, CONFIG.dotPop, backOut(2));
              return (
                <circle key={i} cx={p[0]} cy={p[1]} r={5} fill={theme.background} stroke={color} strokeWidth={3}
                  transform={`translate(${p[0]} ${p[1]}) scale(${s}) translate(${-p[0]} ${-p[1]})`} />
              );
            })}
          </svg>
          {xlabels && xlabels.length > 0 ? (
            <div style={{display: 'flex', justifyContent: 'space-between', width: 400 * scale, marginTop: 8 * scale, fontSize: 13 * scale, color: theme.muted}}>
              {xlabels.map((xlabel) => <span key={xlabel}>{xlabel}</span>)}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
