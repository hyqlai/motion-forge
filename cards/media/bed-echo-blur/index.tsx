import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2In, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type BedEchoBlurProps = {
  title?: string;
  theme: Theme;
  durationInFrames: number;
};

export const BedEchoBlur: React.FC<BedEchoBlurProps> = ({
  title = '竖屏素材同源虚化底床',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const end = 7.7;
  const echoScale = lerp(1.25, 1.295, clamp01(t / end));
  const cardScale = t >= 0.9 ? lerp(1, 1.03, clamp01((t - 0.9) / (7.2 - 0.9))) : 1;

  const pCardIn = power3Out(clamp01((t - 0.3) / 0.6));
  const yCard = lerp(22 * scale, 0, pCardIn);

  const titleP = power3Out(clamp01((t - 0.8) / 0.5));
  const exitK = 1 - power2In(clamp01((t - 7.2) / 0.5));

  return (
    <AbsoluteFill style={{
      background: '#090d15',
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      {/* 模糊底床层 */}
      <div style={{
        position: 'absolute',
        inset: -20 * scale,
        overflow: 'hidden',
        transform: `scale(${echoScale})`,
        filter: `blur(${26 * scale}px) brightness(0.45) saturate(0.8)`,
        opacity: exitK,
        willChange: 'transform',
      }}>
        {/* 模拟同源竖屏画面的大色块背景 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 70% 50%, #2a3a5a 0%, #0d131f 70%)',
        }} />
      </div>

      {/* 左侧说明文字 */}
      <div style={{
        position: 'absolute',
        left: 90 * scale,
        top: 180 * scale,
        width: 440 * scale,
        opacity: titleP * exitK,
        transform: `translateY(${lerp(16 * scale, 0, titleP)}px)`,
      }}>
        <div style={{fontSize: 34 * scale, fontWeight: 800, lineHeight: 1.3}}>
          {title}
        </div>
        <div style={{fontSize: 16 * scale, color: theme.muted, marginTop: 14 * scale, lineHeight: 1.6}}>
          无需寻找第二条素材，同源放大模糊压暗，色彩自然融为一体。
        </div>
      </div>

      {/* 右侧 9:16 竖屏主体卡 */}
      <div style={{
        position: 'absolute',
        left: 600 * scale,
        top: 60 * scale,
        width: 240 * scale,
        height: 426 * scale,
        borderRadius: 16 * scale,
        background: '#141c2b',
        border: `4px solid #ffffff`,
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        opacity: pCardIn * exitK,
        transformOrigin: '50% 50%',
        transform: `translateY(${yCard}px) scale(${cardScale})`,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          flex: 1,
          background: 'linear-gradient(160deg, #1e2b42 0%, #111724 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20 * scale,
          gap: 16 * scale,
        }}>
          <div style={{width: 50 * scale, height: 50 * scale, borderRadius: '50%', background: theme.accent, display: 'grid', placeItems: 'center', color: '#0c111b', fontWeight: 900}}>
            9:16
          </div>
          <div style={{fontSize: 16 * scale, fontWeight: 700}}>手机竖屏切片</div>
          <div style={{width: '70%', height: 8 * scale, background: '#26344d', borderRadius: 4 * scale}} />
          <div style={{width: '50%', height: 8 * scale, background: '#26344d', borderRadius: 4 * scale}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
