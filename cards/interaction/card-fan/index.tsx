import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {lerp, power2Out, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type FanItem = {title: string; meta?: string};
export type CardFanProps = {
  title: string;
  items: FanItem[];
  featuredIndex?: number;
  theme: Theme;
  durationInFrames: number;
};

export const CardFan: React.FC<CardFanProps> = ({title, items, featuredIndex, theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const scale = width / 960;
  const center = (items.length - 1) / 2;
  const featured = featuredIndex ?? Math.floor(center);
  const fan = spring({frame: frame - 62, fps, config: {damping: 20, stiffness: 95}});
  const lift = tween(frame / fps, 3.4, 0.6, power2Out);

  return (
    <AbsoluteFill style={{background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 62 * scale, textAlign: 'center', fontSize: 36 * scale, fontWeight: 750, opacity: tween(frame / fps, 3.5, 0.5, power2Out)}}>{title}</div>
      <AbsoluteFill style={{transform: `scale(${lerp(1.04, 0.88, fan)})`, transformOrigin: '50% 65%'}}>
        {items.map((item, index) => {
          const enter = spring({frame: frame - 2 - index * 4, fps, config: {damping: 13, stiffness: 150}});
          const offset = index - center;
          const isFeatured = index === featured;
          const x = lerp(0, offset * 100 * scale, fan);
          const rotation = lerp((index % 2 ? 1 : -1) * 3, offset * 6.5, fan);
          const y = lerp(650 * scale, 0, enter) + (isFeatured ? -55 * scale * lift : 0);
          return (
            <div key={item.title} style={{
              position: 'absolute', left: '50%', top: '50%', width: 190 * scale, height: 270 * scale,
              marginLeft: -95 * scale, marginTop: -110 * scale, background: isFeatured ? theme.accent : theme.foreground,
              color: isFeatured ? theme.background : theme.background, border: `1px solid ${theme.muted}`, borderRadius: 16 * scale,
              boxShadow: '0 16px 32px rgba(0,0,0,.24)', overflow: 'hidden', zIndex: index,
              transform: `translate3d(${x}px,${y}px,${index * 2}px) rotate(${rotation}deg)`, transformOrigin: '50% 130%',
            }}>
              <div style={{height: 155 * scale, margin: 10 * scale, borderRadius: 10 * scale, background: isFeatured ? theme.background : theme.muted, opacity: 0.9, display: 'grid', placeItems: 'center'}}>
                <svg viewBox="0 0 160 120" width="80%" height="80%">
                  {[0, 1, 2, 3, 4].map((bar) => <rect key={bar} x={15 + bar * 27} y={100 - (25 + (bar * 17 + index * 13) % 65)} width={17} height={25 + (bar * 17 + index * 13) % 65} rx={4} fill={isFeatured ? theme.accent : theme.foreground} opacity={bar === 4 ? 1 : 0.55} />)}
                </svg>
              </div>
              <div style={{padding: 14 * scale, fontSize: 17 * scale, fontWeight: 750, whiteSpace: 'nowrap'}}>{item.title}</div>
              {item.meta ? <div style={{padding: `0 ${14 * scale}px`, color: isFeatured ? theme.background : theme.muted, fontSize: 11 * scale, letterSpacing: 1.5 * scale}}>{item.meta}</div> : null}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
