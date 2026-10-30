import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type SlabPunchTitleProps = {
  line1?: string;
  line2?: string;
  theme: Theme;
  durationInFrames: number;
  lead?: number;
  slabDur?: number;
};

export const SlabPunchTitle: React.FC<SlabPunchTitleProps> = ({
  line1 = '找到',
  line2 = '关键破局点',
  theme,
  lead = 0.40,
  slabDur = 0.22,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scaleRatio = width / 960;

  const l1Dur = 0.18;
  const l1ScaleInit = 1.04;
  const gap = 0.07;
  const punchDur = 0.167;
  const punchScale = 1.12;

  // ① 第一行硬现
  const l1P = power3Out(clamp01((t - lead) / l1Dur));
  const l1Scale = lerp(l1ScaleInit, 1, l1P);

  // ② 色块中心撑开
  const slabAt = lead + l1Dur + gap;
  const bgScaleX = power3Out(clamp01((t - slabAt) / slabDur));

  // ③ 块到位那一帧白字 punch
  const punchAt = slabAt + slabDur;
  const l2Opacity = t < punchAt ? 0 : 1;
  const l2Scale = lerp(punchScale, 1, power3Out(clamp01((t - punchAt) / punchDur)));

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      paddingLeft: 100 * scaleRatio,
      overflow: 'hidden',
    }}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
        {/* 第一行 */}
        <div style={{
          fontSize: 78 * scaleRatio,
          fontWeight: 750,
          lineHeight: 1.06,
          whiteSpace: 'nowrap',
          transformOrigin: '0% 50%',
          opacity: l1P,
          transform: `scale(${l1Scale})`,
        }}>
          {line1}
        </div>

        {/* 第二行带 -2.5° 斜切与实心色块 */}
        <div style={{
          marginTop: 16 * scaleRatio,
          marginLeft: -16 * scaleRatio,
          transform: 'rotate(-2.5deg)',
          transformOrigin: '0% 50%',
        }}>
          <span style={{
            position: 'relative',
            display: 'inline-block',
            padding: `${10 * scaleRatio}px ${24 * scaleRatio}px ${12 * scaleRatio}px`,
          }}>
            <span style={{
              position: 'absolute',
              inset: 0,
              background: theme.accent,
              borderRadius: 6 * scaleRatio,
              transformOrigin: '50% 50%',
              transform: `scaleX(${bgScaleX})`,
            }} />
            <span style={{
              position: 'relative',
              display: 'inline-block',
              fontSize: 78 * scaleRatio,
              fontWeight: 800,
              lineHeight: 1.06,
              color: '#0c111b',
              whiteSpace: 'nowrap',
              transformOrigin: '50% 50%',
              opacity: l2Opacity,
              transform: `scale(${l2Scale})`,
            }}>
              {line2}
            </span>
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
