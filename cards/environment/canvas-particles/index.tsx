import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

export type CanvasParticlesProps = {
  text: string;
  theme: Theme;
  durationInFrames: number;
};

export const CanvasParticles: React.FC<CanvasParticlesProps> = ({text, theme}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    canvas.width = width;
    canvas.height = height;
    context.fillStyle = theme.background;
    context.fillRect(0, 0, width, height);

    // 每帧从固定种子完整重画，seek 不依赖前一帧状态。
    for (let index = 0; index < 90; index += 1) {
      const baseX = random(`x-${index}`) * width;
      const baseY = random(`y-${index}`) * height;
      const speed = 0.2 + random(`speed-${index}`) * 0.8;
      const angle = random(`angle-${index}`) * Math.PI * 2;
      const travel = frame * speed * 2;
      const x = (baseX + Math.cos(angle) * travel + width) % width;
      const y = (baseY + Math.sin(angle) * travel + height) % height;
      const radius = 1 + random(`radius-${index}`) * 4;
      context.globalAlpha = 0.2 + random(`alpha-${index}`) * 0.65;
      context.fillStyle = index % 7 === 0 ? theme.accent : theme.foreground;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
  }, [frame, height, theme, width]);

  return (
    <AbsoluteFill style={{background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily}}>
      <canvas ref={canvasRef} style={{position: 'absolute', inset: 0}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{
          background: theme.background,
          border: `1px solid ${theme.muted}`,
          fontSize: width / 24,
          fontWeight: 700,
          padding: '0.35em 0.7em',
        }}>{text}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
