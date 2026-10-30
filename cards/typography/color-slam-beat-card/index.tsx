import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type ColorSlamBeatCardProps = {
  title?: string;
  subtitle?: string;
  cardColor?: string;
  theme: Theme;
  durationInFrames: number;
  developDur?: number;
  hold?: number;
};

export const ColorSlamBeatCard: React.FC<ColorSlamBeatCardProps> = ({
  title = '效率才是唯一的护城河',
  subtitle = 'SYSTEM PERFORMANCE · 2026',
  cardColor,
  theme,
  developDur = 0.22,
  hold = 1.6,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scaleRatio = width / 960;

  const bg = cardColor ?? '#1B3CF5';
  const tint = '#8A9BFF';

  const hostHold = 0.9;
  const developAt = 0.18;
  const subDelay = 0.12;
  const shotDelay = 0.45;
  const shotDur = 0.42;
  const shotRise = 56 * scaleRatio;
  const liftOut = 0.34;

  const tCardStart = hostHold;
  const tDevelop = tCardStart + developAt;
  const tSub = tDevelop + subDelay;
  const tShot = tCardStart + shotDelay;
  const tShotEnd = tShot + shotDur;
  const tLift = tShotEnd + hold;

  // 卡片是否已硬切进入
  const cardOn = t >= tCardStart;

  // ① 大字显影：从同色系淡色插值到白
  const devP = power2Out(clamp01((t - tDevelop) / developDur));

  // ② 小字戳淡入
  const subOp = power2Out(clamp01((t - tSub) / 0.2));

  // ③ 素材卡升入：从下方 56px 上浮入场
  const shotP = power3Out(clamp01((t - tShot) / shotDur));
  const shotY = lerp(shotRise, 0, shotP);
  const shotBlur = lerp(10, 0, shotP);

  // ④ 色块整体上移让位
  const liftP = power2Out(clamp01((t - tLift) / liftOut));
  const cardY = lerp(0, -540 * scaleRatio, liftP);

  return (
    <AbsoluteFill style={{
      background: theme.background,
      overflow: 'hidden',
      fontFamily: theme.fontFamily,
    }}>
      {/* 铺垫底色 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: theme.background,
        display: 'grid',
        placeItems: 'center',
        color: theme.muted,
        fontSize: 32 * scaleRatio,
        fontWeight: 650,
      }}>
        讲清核心逻辑前的铺垫
      </div>

      {/* 动效本体：纯色硬切节拍卡 */}
      {cardOn && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: bg,
          transform: `translateY(${cardY}px)`,
          willChange: 'transform',
        }}>
          <div style={{
            position: 'absolute',
            left: 62 * scaleRatio,
            top: 0,
            bottom: 0,
            width: 452 * scaleRatio,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            <div style={{
              fontSize: 60 * scaleRatio,
              fontWeight: 800,
              lineHeight: 1.18,
              letterSpacing: 1,
              color: devP >= 1 ? '#ffffff' : (devP <= 0 ? tint : '#ffffff'),
            }}>
              {title}
            </div>
            <div style={{
              marginTop: 26 * scaleRatio,
              paddingLeft: 4 * scaleRatio,
              fontSize: 14 * scaleRatio,
              fontWeight: 700,
              letterSpacing: 4 * scaleRatio,
              color: 'rgba(255, 255, 255, 0.78)',
              opacity: subOp,
            }}>
              {subtitle}
            </div>
          </div>

          {/* 右侧实体素材卡 */}
          <div style={{
            position: 'absolute',
            left: 528 * scaleRatio,
            top: 96 * scaleRatio,
            width: 372 * scaleRatio,
            height: 348 * scaleRatio,
            background: '#ffffff',
            borderRadius: 12 * scaleRatio,
            boxShadow: '0 26px 52px rgba(0, 0, 0, 0.35)',
            overflow: 'hidden',
            opacity: shotP,
            transform: `translateY(${shotY}px)`,
            filter: `blur(${shotBlur}px)`,
          }}>
            <div style={{
              height: 32 * scaleRatio,
              background: '#f0f0f2',
              borderBottom: '1px solid #e4e4e7',
              display: 'flex',
              alignItems: 'center',
              gap: 6 * scaleRatio,
              padding: `0 ${12 * scaleRatio}px`,
            }}>
              <i style={{width: 9 * scaleRatio, height: 9 * scaleRatio, borderRadius: '50%', background: '#cdcdd2', display: 'inline-block'}} />
              <i style={{width: 9 * scaleRatio, height: 9 * scaleRatio, borderRadius: '50%', background: '#cdcdd2', display: 'inline-block'}} />
              <i style={{width: 9 * scaleRatio, height: 9 * scaleRatio, borderRadius: '50%', background: '#cdcdd2', display: 'inline-block'}} />
            </div>
            <div style={{padding: `${24 * scaleRatio}px`, display: 'flex', flexDirection: 'column', gap: 14 * scaleRatio}}>
              <div style={{height: 20 * scaleRatio, width: '70%', background: '#1d1d1f', borderRadius: 4 * scaleRatio}} />
              <div style={{height: 12 * scaleRatio, width: '90%', background: '#d8d8dc', borderRadius: 4 * scaleRatio}} />
              <div style={{height: 12 * scaleRatio, width: '60%', background: '#d8d8dc', borderRadius: 4 * scaleRatio}} />
              <div style={{height: 80 * scaleRatio, background: '#f5f5f7', borderRadius: 8 * scaleRatio, marginTop: 10 * scaleRatio}} />
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
