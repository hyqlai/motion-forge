import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

export type CounterConfettiProps = {
  target?: number;
  label?: string;
  theme?: Theme;
  durationInFrames?: number;
};

const PAL = ['#ff6b8b', '#ffb347', '#ffe86b', '#7bff9e', '#5fd8ff', '#6c8cff', '#c86cff', '#ff6cf0'];

const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const BITS = Array.from({length: 52}, (_, i) => {
  const isRect = rand(i * 3) > 0.4;
  const w = 7 + rand(i + 2) * 8;
  const h = isRect ? 12 + rand(i + 5) * 10 : w;
  const side = i % 2 ? 1 : -1;
  return {
    w,
    h,
    isRect,
    color: PAL[i % 8],
    x0: side * 350,
    y0: (rand(i + 30) - 0.5) * 80,
    vx: -side * (200 + rand(i * 5 + 1) * 400),
    vy: -(300 + rand(i * 7 + 3) * 320),
    g: 900 + rand(i + 60) * 600,
    spin: (rand(i + 90) - 0.5) * 1500,
    d: rand(i + 120) * 0.08,
  };
});

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const outQuart = (x: number) => 1 - Math.pow(1 - x, 4);
const outCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const outBack = (s = 1.7) => (x: number) => {
  const u = x - 1;
  return 1 + (s + 1) * u * u * u + s * u * u;
};

export const CounterConfetti: React.FC<CounterConfettiProps> = ({
  target = 1000,
  label = 'MILESTONE REACHED',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);
  const t = frame / 138;

  const countP = outQuart(clamp01((t - 0.06) / 0.50));
  const currentVal = Math.round(countP * target);

  const s1 = outCubic(clamp01((t - 0.06) / 0.24));
  const s2 = outBack(2.2)(clamp01((t - 0.56) / 0.16));
  const numberScale = (0.2 + (1.3 - 0.2) * s1) + s2 * (1 - 1.3);

  const burstStart = 0.52;
  const burstActive = t >= burstStart;

  return (
    <AbsoluteFill style={{
      background: 'radial-gradient(80% 80% at 50% 45%, #182234, #080b12 75%)',
      overflow: 'hidden',
    }}>
      <div style={{
        width: 1920,
        height: 1080,
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: '50% 50%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* 中心胜利光晕 */}
        <div style={{
          position: 'absolute',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(120,180,255,0.25) 0%, transparent 65%)',
          opacity: 0.3 + (t > 0.5 ? 0.7 : 0),
          transform: `scale(${burstActive ? 1.2 : 0.8})`,
          transition: 'transform 0.4s ease',
        }} />

        <div style={{
          fontSize: 28,
          letterSpacing: 10,
          color: theme?.accent ?? '#38bdf8',
          fontWeight: 800,
          marginBottom: 20,
          textTransform: 'uppercase',
        }}>
          {label}
        </div>

        {/* 冲刺大数字 */}
        <div style={{
          fontSize: 220,
          fontWeight: 900,
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          color: '#ffffff',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          transform: `scale(${numberScale})`,
          transformOrigin: '50% 50%',
          textShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(255,255,255,0.4)',
        }}>
          {currentVal.toLocaleString('en-US')}
        </div>

        {/* 52 粒物理纸屑 */}
        {burstActive && BITS.map((bit, i) => {
          const dt = (t - burstStart - bit.d);
          if (dt <= 0) return null;
          const sec = dt * (138 / 30);
          const px = bit.x0 + bit.vx * sec;
          const py = bit.y0 + bit.vy * sec + 0.5 * bit.g * sec * sec;
          const rot = bit.spin * sec;
          const op = clamp01(1 - (sec - 1.2) / 0.8);

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 960 + px,
                top: 540 + py,
                width: bit.w,
                height: bit.h,
                background: bit.color,
                borderRadius: bit.isRect ? 2 : '50%',
                transform: `rotate(${rot}deg)`,
                opacity: op,
                boxShadow: `0 4px 10px ${bit.color}66`,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
