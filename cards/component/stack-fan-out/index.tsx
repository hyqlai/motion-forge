import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power1Out, power2In, power3InOut, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type StackFanOutProps = {
  title?: string;
  theme: Theme;
  durationInFrames: number;
};

export const StackFanOut: React.FC<StackFanOutProps> = ({
  title = '我挑选出的 5 套核心设计提案',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const n = 5;
  const lead = 0.2;
  const stackIn = 0.4;
  const stackStagger = 0.05;
  const fanAt = 1.0;
  const fanDur = 0.7;
  const fanAngle = 24;
  const R = 520 * scale;
  const flatAt = 2.5;
  const flatDur = 0.6;
  const flatW = 150 * scale;
  const flatGap = 16 * scale;
  const exitAt = 5.8;

  const cardW = 220 * scale;
  const cardH = 150 * scale;
  const cardX = 370 * scale;
  const cardY = 170 * scale;

  const pFan = power3Out(clamp01((t - fanAt) / fanDur));
  const pFlat = power3InOut(clamp01((t - flatAt) / flatDur));
  const exitK = 1 - power2In(clamp01((t - exitAt) / 0.4));

  const titleP = power1Out(clamp01((t - lead) / 0.45));

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      {/* 标题 */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 60 * scale,
        textAlign: 'center',
        fontSize: 28 * scale,
        fontWeight: 750,
        opacity: titleP * exitK,
        transform: `translateY(${lerp(12 * scale, 0, titleP)}px)`,
      }}>
        {title}
      </div>

      {/* 5 张卡片 */}
      {Array.from({length: n}).map((_, i) => {
        const t0 = lead + i * stackStagger;
        const inP = power1Out(clamp01((t - t0) / stackIn));
        const mid = (n - 1) / 2;

        // 阶段 1：成叠状态
        const offX = (i - mid) * 3 * scale;
        const offY = (i - mid) * -2 * scale;
        const offRot = (i - mid) * 1.2;

        // 阶段 2：扇形展开
        const ang = -fanAngle + (i * (2 * fanAngle)) / (n - 1);
        const rad = (ang * Math.PI) / 180;
        const fanPosX = Math.sin(rad) * R;
        const fanPosY = (1 - Math.cos(rad)) * R;

        // 阶段 3：铺平状态
        const flatX = (i - mid) * (flatW + flatGap);
        const curScale = lerp(1, flatW / cardW, pFlat);

        // 位置插值
        const curX = lerp(offX, fanPosX, pFan);
        const curY = lerp(offY, fanPosY, pFan);
        const curRot = lerp(offRot, ang, pFan);

        const finalX = lerp(curX, flatX, pFlat);
        const finalY = lerp(curY, 50 * scale, pFlat);
        const finalRot = lerp(curRot, 0, pFlat);

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: cardX,
              top: cardY,
              width: cardW,
              height: cardH,
              borderRadius: 10 * scale,
              background: '#141c2b',
              border: `2px solid ${i === 2 ? theme.accent : `${theme.muted}33`}`,
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
              opacity: inP * exitK,
              transformOrigin: '50% 100%',
              transform: `translate(${finalX}px, ${finalY}px) rotate(${finalRot}deg) scale(${curScale})`,
              display: 'flex',
              flexDirection: 'column',
              padding: 12 * scale,
              boxSizing: 'border-box',
              zIndex: i + 1,
            }}
          >
            <div style={{
              flex: 1,
              borderRadius: 6 * scale,
              background: i === 2 ? theme.accent : '#1e2b40',
              display: 'grid',
              placeItems: 'center',
              color: i === 2 ? '#0c111b' : theme.muted,
              fontSize: 20 * scale,
              fontWeight: 800,
            }}>
              0{i + 1}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
