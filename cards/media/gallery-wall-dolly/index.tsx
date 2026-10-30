import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2In, power2InOut, power2Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

type Cam = {scale: number; x: number; y: number};

const camTo = (z: number, px: number, py: number): Cam => ({
  scale: z,
  x: 480 - z * px,
  y: 270 - z * py,
});

const wallX = (x: number) => 850 + (x - 850) * Math.cos((-12 * Math.PI) / 180);

const camSeg = (cam: Cam, to: Cam, t: number, t0: number, d: number): Cam => {
  const p = power2InOut(clamp01((t - t0) / d));
  return {scale: lerp(cam.scale, to.scale, p), x: lerp(cam.x, to.x, p), y: lerp(cam.y, to.y, p)};
};

export type GalleryWallDollyProps = {
  theme: Theme;
  durationInFrames: number;
};

export const GalleryWallDolly: React.FC<GalleryWallDollyProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const wideZ = 0.61;
  const wideAt = 942;
  const stopZ = 1.15;
  const move = 1.0;
  const hold = 0.9;
  const lead = 0.8;
  const pull = 1.2;

  const centers = [355, 855, 1355];
  const camWide = camTo(wideZ, wideAt, 270);
  const camStops = centers.map((cx) => camTo(stopZ, wallX(cx), 270));

  // 相机轨迹分段插值
  let cam: Cam = camWide;
  const t1 = lead;
  const t2 = t1 + move + hold;
  const t3 = t2 + move + hold;
  const tPull = t3 + move + hold;

  cam = camSeg(cam, camStops[0], t, t1, move);
  cam = camSeg(cam, camStops[1], t, t2, move);
  cam = camSeg(cam, camStops[2], t, t3, move);
  cam = camSeg(cam, camWide, t, tPull, pull);

  // 判定当前是哪一站
  const curStop = t < t1 + 0.5 ? -1
    : t < t2 - 0.5 ? 0
    : t < t3 - 0.5 ? 1
    : t < tPull + 0.3 ? 2
    : -1;

  // 退场
  const exitP = power2In(clamp01((t - 7.7) / 0.4));

  const items = [
    {title: '案例 01 · 品牌宣传片', meta: 'BRAND FILM', color: '#1B3CF5'},
    {title: '案例 02 · 产品发布秀', meta: 'LAUNCH EVENT', color: '#FF3B1F'},
    {title: '案例 03 · 科普解说短片', meta: 'EXPLAINER VIDEO', color: '#00AA66'},
  ];

  return (
    <AbsoluteFill style={{
      background: 'radial-gradient(ellipse at 50% 40%, #1a2234, #0b0e14 75%)',
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
      perspective: '1200px',
      perspectiveOrigin: '50% 50%',
    }}>
      {/* 3D 摄像机层 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        transformOrigin: '0 0',
        transform: `translate(${cam.x * scale}px, ${cam.y * scale}px) scale(${cam.scale})`,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}>
        {/* 3D 照片墙 */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1700 * scale,
          height: 540 * scale,
          transformStyle: 'preserve-3d',
          transform: 'rotateY(-12deg)',
          transformOrigin: `${850 * scale}px ${270 * scale}px`,
        }}>
          {/* 地面反光 */}
          <div style={{
            position: 'absolute',
            left: -400 * scale,
            right: -400 * scale,
            top: 430 * scale,
            height: 300 * scale,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.06), transparent 60%)',
            transform: 'rotateX(80deg)',
            transformOrigin: 'top',
          }} />

          {/* 三张展板卡片 */}
          {items.map((it, i) => {
            const isCur = curStop === i;
            const dimOp = curStop >= 0 && !isCur ? 0.45 : 1;
            const blurVal = curStop >= 0 && !isCur ? 3 : 0;
            const pushS = isCur ? 1.03 : 1;

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: (centers[i] - 215) * scale,
                  top: 125 * scale,
                  width: 430 * scale,
                  height: 290 * scale,
                  background: '#141c2b',
                  border: `2px solid ${isCur ? theme.accent : `${theme.muted}33`}`,
                  borderRadius: 14 * scale,
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
                  padding: 20 * scale,
                  boxSizing: 'border-box',
                  opacity: dimOp * (1 - exitP),
                  filter: `blur(${blurVal}px)`,
                  transform: `scale(${pushS})`,
                  transition: 'border-color 0.3s, filter 0.3s, opacity 0.3s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14 * scale,
                }}
              >
                <div style={{
                  height: 160 * scale,
                  borderRadius: 8 * scale,
                  background: it.color,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 24 * scale,
                  fontWeight: 800,
                  color: '#ffffff',
                }}>
                  {it.meta}
                </div>
                <div style={{fontSize: 18 * scale, fontWeight: 700}}>
                  {it.title}
                </div>
                <div style={{fontSize: 12 * scale, color: theme.muted}}>
                  高保真动效构图 · 模块化独立微调
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
