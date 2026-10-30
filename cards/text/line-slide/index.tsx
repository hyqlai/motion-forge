import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {cubicBezier, lerp, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type LineSlideProps = {
  lines: string[];
  theme: Theme;
  durationInFrames: number;
};

// 入场：每行从左侧滑到位，位移先停、淡入后停，行间错峰恰好读作"一行一行"；
// 出场：整叠从同一侧穿出去——淡出立刻起，横向位移延迟才动（进从左、出向右 = 穿过式，不是倒放），
// 出场错峰只有入场的一半；入场缓出、出场缓入，一进一出方向相反
const CONFIG = {
  lead: 0.30,          // 起手静置：等口播开口
  enterDur: 0.90,      // 每行淡入时长 s
  enterTravel: 0.4667, // 每行位移时长 s = enterDur 的 52%
  enterStagger: 0.1333,// 入场行间错峰 s
  hold: 1.40,          // 全叠读完的停留 s，随镜头时长伸缩
  exitDur: 0.60,       // 每行淡出时长 s
  exitDelay: 0.2667,   // 淡出起 → 横向位移起的延迟 s
  exitStagger: 0.0667, // 出场行间错峰 s = 入场的一半
  distance: 47,        // 横向位移量 px（比例恒为字号 78%）：入场 −47 → 0，出场 0 → +47
};

const ENTER_EASE = cubicBezier(0.22, 1, 0.36, 1);    // 缓出：冲进来再长距离缓收
const EXIT_EASE = cubicBezier(0.64, 0, 0.78, 0);     // 缓入：先粘住再加速甩走

export const LineSlide: React.FC<LineSlideProps> = ({lines, theme, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  // 出场永远不早于入场结束：最后一行入场结束 + hold（hold 随镜头时长伸缩）
  const duration = durationInFrames / fps;
  const enterEnd = CONFIG.lead + CONFIG.enterDur + (lines.length - 1) * CONFIG.enterStagger;
  const exitDurTotal = CONFIG.exitDur + (lines.length - 1) * CONFIG.exitStagger;
  const hold = Math.max(CONFIG.hold, duration - enterEnd - exitDurTotal - 0.1);
  const exitStart = enterEnd + hold;

  return (
    <AbsoluteFill style={{background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily, overflow: 'hidden', alignItems: 'center', justifyContent: 'center'}}>
      <span style={{display: 'inline-block', textAlign: 'left', fontSize: 60 * scale, fontWeight: 600, lineHeight: 1.35, letterSpacing: '-0.03em'}}>
        {lines.map((line, index) => {
          const at = CONFIG.lead + index * CONFIG.enterStagger;
          const out = exitStart + index * CONFIG.exitStagger;
          // 入场轨① 淡入走满 enterDur；出场轨① 淡出立刻起（入场必已结束，顺序接力）
          const opacity = t < out
            ? tween(t, at, CONFIG.enterDur, ENTER_EASE)
            : 1 - tween(t, out, CONFIG.exitDur, EXIT_EASE);
          // 入场轨② 位移只占前 enterTravel；出场轨② 位移延迟 exitDelay 才动
          const x = t < out + CONFIG.exitDelay
            ? lerp(-CONFIG.distance * scale, 0, tween(t, at, CONFIG.enterTravel, ENTER_EASE))
            : lerp(0, CONFIG.distance * scale, tween(t, out + CONFIG.exitDelay, CONFIG.exitDur - CONFIG.exitDelay, EXIT_EASE));
          return (
            <span key={index} style={{
              display: 'block', transformOrigin: '0% 50%', whiteSpace: 'nowrap',
              willChange: 'transform, opacity', opacity, transform: `translateX(${x}px)`,
            }}>{line}</span>
          );
        })}
      </span>
    </AbsoluteFill>
  );
};
