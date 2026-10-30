import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, clamp01, lerp, power2In, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type Split6040StoryProps = {
  title?: string[];
  chips?: string[];
  theme: Theme;
  durationInFrames: number;
  push?: number;
};

const CHIP_TOP = [216, 290, 364];

export const Split6040Story: React.FC<Split6040StoryProps> = ({
  title = ['它一晚上', '干了三件事'],
  chips = ['读完 40 份行业研报', '生成三版产品交互稿', '完成全链路代码跑测'],
  theme,
  push = 1.06,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const splitW = 576 * scale;
  const end = 6.8;
  const exit = 0.4;
  const stagger = 0.04;
  const titleIn = 0.3;
  const chipAt = 1.0;
  const gap = 0.6;
  const pop = 0.45;

  const n = Math.min(chips.length, CHIP_TOP.length);

  // 左格缓推
  const camScale = lerp(1, push, clamp01(t / end));
  const mediaOp = 1 - power2In(clamp01((t - (end - exit)) / exit));

  // 文字组退场
  const textOut0 = end - exit - n * stagger;
  const outK = (i: number) => 1 - power2In(clamp01((t - (textOut0 + i * stagger)) / exit));

  const ttlP = power3Out(clamp01((t - titleIn) / 0.5));

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      {/* 左格 60% */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: splitW,
        overflow: 'hidden',
        opacity: mediaOp,
        background: '#0d131f',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${camScale})`,
          transformOrigin: '50% 50%',
          display: 'grid',
          placeItems: 'center',
          background: 'linear-gradient(135deg, #131b2c 0%, #0d121c 100%)',
        }}>
          {/* 模拟主素材大图 */}
          <div style={{
            width: '80%',
            height: '70%',
            borderRadius: 14 * scale,
            background: '#192336',
            border: `1px solid ${theme.muted}33`,
            padding: 24 * scale,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 16 * scale,
          }}>
            <div style={{width: '50%', height: 20 * scale, background: theme.accent, borderRadius: 4 * scale}} />
            <div style={{width: '90%', height: 12 * scale, background: '#25344d', borderRadius: 4 * scale}} />
            <div style={{width: '75%', height: 12 * scale, background: '#25344d', borderRadius: 4 * scale}} />
            <div style={{flex: 1, background: '#111724', borderRadius: 8 * scale, marginTop: 10 * scale}} />
          </div>
        </div>
      </div>

      {/* 中缝分割线 */}
      <div style={{
        position: 'absolute',
        left: splitW,
        top: 0,
        bottom: 0,
        width: 2 * scale,
        background: `${theme.muted}33`,
        opacity: mediaOp,
      }} />

      {/* 右格 40%：标题与 chips */}
      <div style={{
        position: 'absolute',
        left: splitW + 44 * scale,
        top: 80 * scale,
        fontSize: 36 * scale,
        fontWeight: 800,
        lineHeight: 1.25,
        opacity: ttlP * outK(0),
        transform: `translateY(${lerp(12 * scale, 0, ttlP)}px)`,
      }}>
        {title.map((l, i) => <div key={i}>{l}</div>)}
      </div>

      {/* 三枚 Chip */}
      {chips.slice(0, 3).map((chip, i) => {
        const at = chipAt + i * gap;
        const p = backOut(1.7)(clamp01((t - at) / pop));
        const chipY = lerp(10 * scale, 0, p);
        const on = t >= at;

        return on ? (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: splitW + 44 * scale,
              top: CHIP_TOP[i] * scale,
              width: 300 * scale,
              padding: `${12 * scale}px ${16 * scale}px`,
              background: '#141c2b',
              border: `1px solid ${i === 0 ? theme.accent : `${theme.muted}44`}`,
              borderRadius: 10 * scale,
              fontSize: 15 * scale,
              fontWeight: 700,
              color: i === 0 ? theme.accent : theme.foreground,
              opacity: outK(i + 1),
              transform: `scale(${lerp(0.9, 1, p)}) translateY(${chipY}px)`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            {chip}
          </div>
        ) : null;
      })}
    </AbsoluteFill>
  );
};
