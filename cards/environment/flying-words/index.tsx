import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;
const CX = 960;
const CY = 540;
const PERSPECTIVE = 4400;
const Z0 = -7000;
const Z1 = 3200;
const CYCLES = 2;
const OPACITY = [0, 1, 0.5, 0.2, 0];
const OPACITY_TIMES = [0, 0.25, 0.6, 0.85, 1];

const rand = (value: number): number => {
  const x = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const alpha = (hex: string, opacity: number): string => {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3 ? normalized.split('').map((item) => item + item).join('') : normalized;
  const number = Number.parseInt(full, 16);
  return `rgba(${(number >> 16) & 255},${(number >> 8) & 255},${number & 255},${opacity})`;
};

const lifeCurve = (progress: number): number => {
  for (let index = 0; index < 4; index += 1) {
    if (progress <= OPACITY_TIMES[index + 1]) {
      return OPACITY[index] + ((OPACITY[index + 1] - OPACITY[index]) * (progress - OPACITY_TIMES[index])) / (OPACITY_TIMES[index + 1] - OPACITY_TIMES[index]);
    }
  }
  return 0;
};

const project = (x: number, y: number, progress: number, roll: number, drift = true) => {
  const z = Z0 + (Z1 - Z0) * progress;
  const dispersion = drift ? 0.5 + progress * 1.35 : 1;
  const scale = PERSPECTIVE / (PERSPECTIVE - z);
  const cosine = Math.cos(roll);
  const sine = Math.sin(roll);
  const rx = x * cosine - y * sine;
  const ry = x * sine + y * cosine;
  return {sx: CX + rx * dispersion * scale, sy: CY + ry * dispersion * scale, scale};
};

export type FlyingWordsProps = {
  words: string[];
  title: string;
  eyebrow?: string;
  theme: Theme;
  durationInFrames: number;
};

export const FlyingWords: React.FC<FlyingWordsProps> = ({words, title, eyebrow, theme, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const viewportScale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
  const time = frame / durationInFrames;
  const roll = (2.5 * Math.PI / 180) * Math.sin(time * Math.PI * 2);
  const delta = CYCLES / durationInFrames;
  const items = useMemo(() => words.map((word, index) => {
    const angle = index * 2.39996 + rand(index * 7 + 1) * 0.8;
    const radius = 330 + rand(index * 13 + 2) * 660;
    return {
      word,
      accent: index % 7 === 3,
      serif: index % 5 === 1,
      size: 64 + rand(index + 3) * 56,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.6,
      rotation: (rand(index + 21) - 0.5) * 12,
      phase: index / words.length,
    };
  }), [words]);
  const dust = useMemo(() => Array.from({length: 56}, (_, index) => {
    const angle = index * 2.39996 + rand(index * 5 + 77) * 1.2;
    const radius = 180 + rand(index * 3 + 91) * 1500;
    return {x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * 0.62, phase: rand(index * 9 + 13), width: 1 + rand(index + 50) * 1.6};
  }), []);

  return (
    <AbsoluteFill style={{background: theme.background, overflow: 'hidden', fontFamily: theme.fontFamily}}>
      <div style={{
        position: 'absolute', width: BASE_WIDTH, height: BASE_HEIGHT,
        left: (width - BASE_WIDTH * viewportScale) / 2,
        top: (height - BASE_HEIGHT * viewportScale) / 2,
        transform: `scale(${viewportScale})`, transformOrigin: 'top left',
      }}>
        <div style={{
          position: 'absolute', left: CX - 520, top: CY - 360, width: 1040, height: 720, borderRadius: '50%',
          opacity: 0.82 + 0.14 * Math.sin(time * Math.PI * 4),
          background: `radial-gradient(ellipse at center, ${alpha(theme.accent, 0.35)} 0%, ${alpha(theme.accent, 0.1)} 38%, ${alpha(theme.accent, 0)} 70%)`,
        }} />
        <svg width={BASE_WIDTH} height={BASE_HEIGHT} style={{position: 'absolute', inset: 0}}>
          {Array.from({length: 10}, (_, index) => {
            const progress = (time * CYCLES + index / 10) % 1;
            const point = project(0, 0, progress, roll, false);
            const opacity = Math.min(1, progress / 0.3) * (1 - Math.min(1, Math.max(0, (progress - 0.55) / 0.3)));
            if (opacity <= 0.01) return null;
            return <ellipse key={index} cx={CX} cy={CY} rx={1150 * point.scale} ry={1150 * point.scale * 0.6} fill="none" stroke={theme.accent} strokeOpacity={opacity * 0.16} strokeWidth={1 + point.scale * 0.8} transform={`rotate(${roll * 180 / Math.PI} ${CX} ${CY})`} />;
          })}
          {dust.map((particle, index) => {
            const progress = (time * CYCLES + particle.phase) % 1;
            const before = project(particle.x, particle.y, Math.max(0, progress - delta * 2.6), roll);
            const current = project(particle.x, particle.y, progress, roll);
            const opacity = lifeCurve(progress) * 0.75;
            if (opacity <= 0.01) return null;
            return <line key={index} x1={before.sx} y1={before.sy} x2={current.sx} y2={current.sy} stroke={theme.foreground} strokeOpacity={opacity} strokeWidth={particle.width * Math.min(2.4, current.scale)} strokeLinecap="round" />;
          })}
        </svg>
        {items.map((item, index) => {
          const progress = (time * CYCLES + item.phase) % 1;
          const current = project(item.x, item.y, progress, roll);
          const previous = project(item.x, item.y, Math.max(0, progress - delta), roll);
          const vx = current.sx - previous.sx;
          const vy = current.sy - previous.sy;
          const centerDistance = ((current.sx - CX) / 760) ** 2 + ((current.sy - CY) / 190) ** 2;
          const occlusion = centerDistance < 1 ? 0.2 + 0.8 * centerDistance ** 2 : 1;
          const opacity = lifeCurve(progress) * occlusion;
          if (opacity <= 0.005) return null;
          const fog = progress < 0.22 ? (1 - progress / 0.22) * 2.2 : 0;
          const near = progress > 0.86 ? (progress - 0.86) * 60 : 0;
          const speed = Math.hypot(vx, vy);
          const trail = speed > 6 ? [1, 2, 3, 4, 5, 6].map((step) => {
            const factor = (step / 6) * 0.9 / current.scale;
            return `${(-vx * factor).toFixed(1)}px ${(-vy * factor).toFixed(1)}px ${(step * 0.8).toFixed(1)}px ${alpha(theme.foreground, 0.2 - step * 0.026)}`;
          }).join(', ') : '';
          const color = item.accent ? theme.accent : theme.foreground;
          return (
            <div key={`${item.word}-${index}`} style={{
              position: 'absolute', left: current.sx, top: current.sy, whiteSpace: 'nowrap', lineHeight: 1,
              transform: `translate(-50%,-50%) scale(${current.scale}) rotate(${item.rotation + roll * 180 / Math.PI}deg)`,
              fontFamily: item.serif ? 'Noto Serif SC, serif' : theme.fontFamily,
              fontStyle: item.serif ? 'italic' : undefined, fontWeight: item.serif ? 500 : 700,
              fontSize: item.size, color, opacity,
              textShadow: [item.accent ? `0 0 18px ${alpha(theme.accent, 0.55)}` : '', trail].filter(Boolean).join(', ') || undefined,
              filter: fog + near > 0.05 ? `blur(${(fog + near) / Math.max(0.6, current.scale)}px)` : undefined,
            }}>{item.word}</div>
          );
        })}
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{position: 'absolute', left: CX - 760, top: CY - 260, width: 1520, height: 520, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(4,6,13,.72) 0%, rgba(4,6,13,.38) 45%, rgba(4,6,13,0) 72%)'}} />
          <div style={{position: 'relative', textAlign: 'center', color: theme.foreground}}>
            {eyebrow ? <div style={{color: theme.accent, fontSize: 28, letterSpacing: 10, marginBottom: 28}}>{eyebrow}</div> : null}
            <div style={{fontSize: 100, fontWeight: 750, letterSpacing: '-0.045em'}}>{title}</div>
          </div>
        </AbsoluteFill>
      </div>
    </AbsoluteFill>
  );
};
