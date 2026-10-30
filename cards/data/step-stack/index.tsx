import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {lerp, power2Out, power3Out, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type StackStep = {no: string; txt: string};
export type StepStackProps = {
  steps: StackStep[];
  theme: Theme;
  durationInFrames: number;
};

// 横条从右均匀堆入，每枚落地时编号块 punch，最后整组上浮收束
const CONFIG = {
  lead: 0.4,          // 起手静置 s：等口播念到"几步"
  barIn: 0.24,        // 单枚横条入场耗时 s
  barStagger: 0.11,   // 错峰 s：必须均匀，不均匀读作卡顿
  barShift: 40,       // 从右侧进入的位移 px
  punchScale: 1.12,   // 编号块 punch 起始倍数（1.12→1）
  punchDur: 0.133,    // punch 4 帧 @30fps
  settleLift: 4,      // 全部落定后整组上浮 px：宣告"这是一组"
  settleDur: 0.20,    // 收束耗时 s
  settleGap: 0.08,    // 末枚落定 → 整组收束 的呼吸 s
};

export const StepStack: React.FC<StepStackProps> = ({steps, theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  // 全部落定后整组轻微上浮收束——把多个动效收成一件事
  const settleAt = CONFIG.lead + (steps.length - 1) * CONFIG.barStagger
    + CONFIG.barIn + CONFIG.punchDur + CONFIG.settleGap;
  const stackY = -CONFIG.settleLift * scale * tween(t, settleAt, CONFIG.settleDur, power2Out);

  return (
    <AbsoluteFill style={{background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily, overflow: 'hidden', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 14 * scale, width: 486 * scale, transform: `translateY(${stackY}px)`}}>
        {steps.map((step, index) => {
          const at = CONFIG.lead + index * CONFIG.barStagger;
          // 横条从右堆入（错峰严格均匀）
          const inProgress = tween(t, at, CONFIG.barIn, power3Out);
          // 落定同帧编号块 punch 一拍；punch 前一直停在 1.12
          const punchAt = at + CONFIG.barIn;
          const noScale = t < punchAt
            ? CONFIG.punchScale
            : lerp(CONFIG.punchScale, 1, tween(t, punchAt, CONFIG.punchDur, power2Out));
          return (
            <div key={step.no} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18 * scale,
              height: 66 * scale,
              border: `1px solid ${theme.muted}55`,
              borderRadius: 12 * scale,
              background: theme.background,
              opacity: inProgress,
              transform: `translateX(${lerp(CONFIG.barShift * scale, 0, inProgress)}px)`,
            }}>
              <span style={{
                flex: '0 0 auto',
                width: 64 * scale,
                height: 64 * scale,
                margin: `-1px 0 -1px -1px`,
                borderRadius: `${12 * scale}px 0 0 ${12 * scale}px`,
                background: theme.accent,
                color: theme.background,
                fontSize: 22 * scale,
                fontWeight: 600,
                letterSpacing: 1,
                fontVariantNumeric: 'tabular-nums',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${noScale})`,
              }}>{step.no}</span>
              <span style={{fontSize: 22 * scale, fontWeight: 600, lineHeight: 1.25, whiteSpace: 'nowrap'}}>{step.txt}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
