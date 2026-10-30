import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {lerp, power2Out, sineIn, sineInOut, sineOut, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type PullbackCoolProps = {
  from: React.ReactNode;
  to: React.ReactNode;
  theme: Theme;
  durationInFrames: number;
};

// 一式 = 出场"内容沉暗"（相机几乎不动，靠内容褪灰失焦交出画面）
//        + 入场全片唯一 scale<1 起步的后拉，节奏最慢
const CONFIG = {
  hold: 0.80,      // 出场镜停留：相机永不静止（慢漂）
  holdEnd: 0.90,   // 入场镜收尾停留
  out: 0.50,       // 出场沉暗时长
  cutLead: 0.05,   // 切点提前量（交接靠"暗"而不是"快"）
  overlap: 0.55,   // 交叠（像素淡化）时长 ≈ 16 帧 @30fps，交叠最长的一式
  settle: 0.90,    // 入场后拉时长：全片最慢
  outDim: 0.18,    // 出场内容褪到多暗
  outBlur: 2,      // 出场内容失焦
  inScale: 0.90,   // 入场起手景别：唯一 <1
  inBlur: 4,
  inSettle: 0.99,  // 后拉落点：停在 0.99 而不是 1.0，留给 hold 继续推
};

export const PullbackCool: React.FC<PullbackCoolProps> = ({from, to, theme}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cut = CONFIG.hold + CONFIG.out - CONFIG.cutLead;
  const settleEnd = cut + CONFIG.settle;

  // 出场镜：慢漂 → 内容沉暗（相机收住不推不拉），交叠期淡出
  const aScale = t < CONFIG.hold
    ? lerp(1, 1.03, tween(t, 0, CONFIG.hold, sineInOut))
    : lerp(1.03, 1.0, tween(t, CONFIG.hold, CONFIG.out, sineOut));
  const aX = lerp(0, 10, tween(t, 0, CONFIG.hold, sineInOut));
  const aDim = lerp(1, CONFIG.outDim, tween(t, CONFIG.hold, CONFIG.out, sineIn));
  const aBlur = lerp(0, CONFIG.outBlur, tween(t, CONFIG.hold, CONFIG.out, sineIn));
  const aOpacity = (1 - tween(t, cut, CONFIG.overlap, sineInOut)) * aDim;

  // 入场镜：唯一 scale<1 起步的后拉，交叠期淡入
  const bOpacity = tween(t, cut, CONFIG.overlap, sineInOut);
  const bScale = t < settleEnd
    ? lerp(CONFIG.inScale, CONFIG.inSettle, tween(t, cut, CONFIG.settle, power2Out))
    : lerp(CONFIG.inSettle, 1.02, tween(t, settleEnd, CONFIG.holdEnd, sineInOut));
  const bBlur = lerp(CONFIG.inBlur, 0, tween(t, cut, CONFIG.settle, power2Out));

  return (
    <AbsoluteFill style={{background: theme.background, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: '-14%', opacity: aOpacity, transform: `translate(${aX}px, 0px) scale(${aScale})`, filter: `blur(${aBlur}px)`}}>
        {from}
      </div>
      <div style={{position: 'absolute', inset: '-14%', opacity: bOpacity, transform: `scale(${bScale})`, filter: `blur(${bBlur}px)`}}>
        {to}
      </div>
    </AbsoluteFill>
  );
};
