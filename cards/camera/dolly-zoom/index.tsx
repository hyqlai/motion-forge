import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

export type DollyZoomProps = {
  children?: React.ReactNode;
  theme?: Theme;
  durationInFrames?: number;
};

export const DollyZoom: React.FC<DollyZoomProps> = ({children, theme}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  const t = interpolate(frame, [15, 110], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.3, 1),
  });

  const bgScale = 1 + t * 1.25;
  const bgBlur = t * 3.5;

  return (
    <AbsoluteFill style={{backgroundColor: theme?.background ?? '#0b0e14', overflow: 'hidden'}}>
      <div style={{
        width: 1920,
        height: 1080,
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: '50% 50%',
      }}>
        {/* 背景层：从画心向四周反向膨胀逼近 + 渐深失焦 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `scale(${bgScale})`,
            transformOrigin: '960px 540px',
            filter: `blur(${bgBlur}px) saturate(0.9)`,
          }}
        >
          <Img src={staticFile('legacy-textures/projects-full.png')} style={{position: 'absolute', left: 0, top: -400, width: 1920, opacity: 0.45}} />
          {[
            {x: 180, y: 140, f: 'card1.png'},
            {x: 1280, y: 120, f: 'card2.png'},
            {x: 240, y: 700, f: 'card3.png'},
            {x: 1220, y: 720, f: 'card5.png'},
            {x: 700, y: 60, f: 'card6.png'},
            {x: 760, y: 840, f: 'card7.png'},
            {x: 60, y: 420, f: 'card8.png'},
            {x: 1500, y: 430, f: 'card9.png'},
          ].map((c, k) => (
            <Img
              key={k}
              src={staticFile(`legacy-textures/${c.f}`)}
              style={{
                position: 'absolute',
                left: c.x,
                top: c.y,
                width: 320,
                borderRadius: 12,
                opacity: 0.85,
                boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
              }}
            />
          ))}
        </div>

        {/* 主体：视觉大小恒定锁定在画心，落影渐深强调“世界在动我不动” */}
        <div
          style={{
            position: 'absolute',
            left: 960 - 260,
            top: 540 - 228,
            width: 520,
            height: 456,
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: `0 ${12 + t * 16}px ${40 + t * 28}px rgba(0,0,0,${0.35 + t * 0.25})`,
          }}
        >
          {children ? (
            children
          ) : (
            <Img
              src={staticFile('legacy-textures/card4-hires.png')}
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
            />
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
