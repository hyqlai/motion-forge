import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, clamp01, lerp, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type NumberSlabPopProps = {
  integer?: string;
  decimal?: string;
  unit?: string;
  caption?: string;
  theme: Theme;
  durationInFrames: number;
};

export const NumberSlabPop: React.FC<NumberSlabPopProps> = ({
  integer = '23',
  decimal = '.6',
  unit = '%',
  caption = '较去年业务峰值增长',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const lead = 0.30;
  const slabDrop = 20 * scale;
  const slabScale = 0.94;
  const slabDur = 0.24;
  const numScale = 0.72;
  const numDur = 0.28;
  const decLag = 0.20;
  const decIn = 0.18;
  const capRise = 6 * scale;
  const capIn = 0.24;

  // ① 色块落定
  const slabP = power3Out(clamp01((t - lead) / slabDur));

  // ② 数字整体弹出
  const numAt = lead + slabDur;
  const numP = backOut(1.7)(clamp01((t - numAt) / numDur));

  // ②b 小数与单位
  const decP = power2Out(clamp01((t - (numAt + decLag)) / decIn));

  // ③ 说明行
  const capAt = numAt + decLag + decIn;
  const capP = power2Out(clamp01((t - capAt) / capIn));

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      paddingLeft: 108 * scale,
      overflow: 'hidden',
    }}>
      <div style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start'}}>
        {/* 实色石碑卡 */}
        <div style={{
          display: 'inline-block',
          padding: `${26 * scale}px ${40 * scale}px ${30 * scale}px`,
          borderRadius: 24 * scale,
          background: theme.accent,
          color: '#0c111b',
          transformOrigin: '50% 50%',
          opacity: slabP,
          transform: `translateY(${lerp(-slabDrop, 0, slabP)}px) scale(${lerp(slabScale, 1, slabP)})`,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            transformOrigin: '50% 60%',
            opacity: Math.min(1, numP),
            transform: `scale(${lerp(numScale, 1, numP)})`,
          }}>
            <span style={{fontSize: 96 * scale}}>{integer}</span>
            <span style={{fontSize: 96 * scale, opacity: decP}}>{decimal}</span>
            <span style={{fontSize: 52 * scale, marginLeft: 6 * scale, opacity: decP}}>{unit}</span>
          </div>
        </div>

        {/* 说明行 */}
        <div style={{
          marginTop: 22 * scale,
          marginLeft: 6 * scale,
          fontSize: 20 * scale,
          fontWeight: 600,
          color: theme.muted,
          letterSpacing: 2 * scale,
          opacity: capP,
          transform: `translateY(${lerp(capRise, 0, capP)}px)`,
        }}>
          {caption}
        </div>
      </div>
    </AbsoluteFill>
  );
};
