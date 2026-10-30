import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

export type CubeRotateProps = {
  from?: React.ReactNode;
  to?: React.ReactNode;
  theme?: Theme;
  durationInFrames?: number;
};

const S = 0.85;
const W = 1920 * S;
const H = 1080 * S;

const DefaultFaceA: React.FC<{theme?: Theme}> = ({theme}) => (
  <div style={{
    width: '100%', height: '100%',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: 24,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 20, color: '#f8fafc',
  }}>
    <div style={{fontSize: 24, letterSpacing: 8, color: theme?.accent ?? '#38bdf8', fontWeight: 800}}>PHASE 01</div>
    <div style={{fontSize: 72, fontWeight: 900}}>问题定位与瓶颈分析</div>
  </div>
);

const DefaultFaceB: React.FC<{theme?: Theme}> = ({theme}) => (
  <div style={{
    width: '100%', height: '100%',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: 24,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 20, color: '#f8fafc',
  }}>
    <div style={{fontSize: 24, letterSpacing: 8, color: '#a78bfa', fontWeight: 800}}>PHASE 02</div>
    <div style={{fontSize: 72, fontWeight: 900}}>统一内核代码生成</div>
  </div>
);

export const CubeRotate: React.FC<CubeRotateProps> = ({from, to, theme}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  // 翻转时间轴：0–25 静止 A -> 25–65 翻转 -> 65–120 静止 B
  const p = interpolate(frame, [25, 65], [0, 1], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const theta = -p * 90;
  const brightA = 1 - p * 0.45;
  const brightB = 0.55 + p * 0.45;
  const seam = Math.sin(p * Math.PI);

  return (
    <AbsoluteFill style={{background: '#05070a', overflow: 'hidden'}}>
      <div style={{
        width: 1920,
        height: 1080,
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: '50% 50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: 1600,
      }}>
        {/* 3D 旋转容器 */}
        <div
          style={{
            position: 'relative',
            width: W,
            height: H,
            transformStyle: 'preserve-3d',
            transform: `translateZ(${-W / 2}px) rotateY(${theta}deg)`,
          }}
        >
          {/* 面 A (Front: 0°) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              transform: `rotateY(0deg) translateZ(${W / 2}px)`,
              filter: `brightness(${brightA})`,
            }}
          >
            {from ?? <DefaultFaceA theme={theme} />}
            {seam > 0.01 && (
              <div style={{
                position: 'absolute',
                top: 0, right: 0, width: 200, height: '100%',
                opacity: seam * 0.6,
                background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.8))',
              }} />
            )}
          </div>

          {/* 面 B (Right: 90°) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              transform: `rotateY(90deg) translateZ(${W / 2}px)`,
              filter: `brightness(${brightB})`,
            }}
          >
            {to ?? <DefaultFaceB theme={theme} />}
            {seam > 0.01 && (
              <div style={{
                position: 'absolute',
                top: 0, left: 0, width: 200, height: '100%',
                opacity: seam * 0.6,
                background: 'linear-gradient(to left, transparent, rgba(0,0,0,0.8))',
              }} />
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
