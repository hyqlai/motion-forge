import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, lerp, power1Out, sineInOut, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type MediaPopInProps = {
  images: string[];
  labels?: string[];
  theme: Theme;
  durationInFrames: number;
};

const positions = [
  {left: 130, top: 60, width: 350, height: 225, rotation: -7},
  {left: 410, top: 145, width: 330, height: 220, rotation: 5},
  {left: 250, top: 290, width: 310, height: 175, rotation: -4},
];

export const MediaPopIn: React.FC<MediaPopInProps> = ({images, labels = [], theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;
  const settled = 0.45 + Math.max(0, images.length - 1) * 0.15 + 0.3 + 0.2;
  const cycle = Math.max(0, (t - settled) / 1.6);
  const cycleIndex = Math.floor(cycle);
  const phase = cycleIndex % 2 === 1 ? 1 - (cycle - cycleIndex) : cycle - cycleIndex;
  const groupScale = t >= settled ? 1 + 0.008 * sineInOut(phase) : 1;

  return (
    <AbsoluteFill style={{background: theme.background, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${groupScale})`}}>
        {images.slice(0, 3).map((image, index) => {
          const position = positions[index];
          const at = 0.45 + index * 0.15;
          const opacity = tween(t, at, 0.15, power1Out);
          const progress = tween(t, at, 0.3, backOut(1.7));
          const src = /^(https?:|data:|blob:)/.test(image) ? image : staticFile(image);
          return (
            <div key={image} style={{
              position: 'absolute', left: position.left * scale, top: position.top * scale,
              width: position.width * scale, height: position.height * scale,
              background: theme.foreground, border: `${8 * scale}px solid ${theme.foreground}`,
              borderRadius: 6 * scale, boxShadow: '0 12px 26px rgba(0,0,0,.25)', overflow: 'hidden',
              opacity, transformOrigin: '50% 60%',
              transform: `rotate(${lerp(position.rotation - 6, position.rotation, progress)}deg) scale(${lerp(0.8, 1, progress)})`,
            }}>
              <Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              {labels[index] ? <div style={{position: 'absolute', left: 10 * scale, bottom: 10 * scale, background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily, fontSize: 15 * scale, padding: 6 * scale}}>{labels[index]}</div> : null}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
