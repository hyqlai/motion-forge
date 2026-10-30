import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2In, power2InOut} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

type Cam = {scale: number; x: number; y: number};

const camTo = (z: number, px: number, py: number): Cam => ({
  scale: z,
  x: 480 - z * px,
  y: 270 - z * py,
});

const camSeg = (cam: Cam, to: Cam, t: number, t0: number, d: number): Cam => {
  const p = power2InOut(clamp01((t - t0) / d));
  return {scale: lerp(cam.scale, to.scale, p), x: lerp(cam.x, to.x, p), y: lerp(cam.y, to.y, p)};
};

export type TimelinePhotoStripProps = {
  theme: Theme;
  durationInFrames: number;
};

export const TimelinePhotoStrip: React.FC<TimelinePhotoStripProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scaleRatio = width / 960;

  const stopZ = 1.05;
  const wideZ = 0.62;
  const move = 0.9;
  const hold = 1.0;
  const pull = 1.1;

  const centers = [240, 600, 960, 1320];
  const camStops = centers.map((cx, i) => camTo(stopZ, cx, i % 2 === 0 ? 210 : 390));
  const camWide = camTo(wideZ, 780, 300);

  // 轨迹插值
  let cam: Cam = camStops[0];
  const t1 = 0.4 + 1.0; // 1.4
  const t2 = t1 + move + hold; // 3.3
  const t3 = t2 + move + hold; // 5.2
  const tPull = t3 + move + hold; // 7.1

  cam = camSeg(cam, camStops[1], t, t1, move);
  cam = camSeg(cam, camStops[2], t, t2, move);
  cam = camSeg(cam, camStops[3], t, t3, move);
  cam = camSeg(cam, camWide, t, tPull, pull);

  const curStation = t < t1 ? 0
    : t < t2 ? 1
    : t < t3 ? 2
    : t < tPull ? 3
    : -1;

  const stations = [
    {year: '2022', title: '构想萌芽', top: 120},
    {year: '2023', title: '内核原型', top: 320},
    {year: '2024', title: '协议确立', top: 120},
    {year: '2026', title: '工业级投产', top: 320},
  ];

  const exitK = 1 - power2In(clamp01((t - 9.4) / 0.45));

  return (
    <AbsoluteFill style={{
      background: '#090d15',
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      {/* 摄像机连续世界 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        transformOrigin: '0 0',
        transform: `translate(${cam.x * scaleRatio}px, ${cam.y * scaleRatio}px) scale(${cam.scale})`,
        opacity: exitK,
        willChange: 'transform',
      }}>
        {/* 水平时间轴基准线 */}
        <div style={{
          position: 'absolute',
          left: 60 * scaleRatio,
          top: 300 * scaleRatio,
          width: 1500 * scaleRatio,
          height: 3 * scaleRatio,
          background: `${theme.muted}44`,
          borderRadius: 2 * scaleRatio,
        }} />

        {/* 四站里程碑卡片 */}
        {stations.map((st, i) => {
          const isAct = curStation === i;
          const cardX = (centers[i] - 120) * scaleRatio;
          const cardY = st.top * scaleRatio;
          const s = isAct ? 1.03 : 1;
          const op = curStation >= 0 && !isAct ? 0.6 : 1;

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: cardX,
                top: cardY,
                width: 240 * scaleRatio,
                height: 160 * scaleRatio,
                background: '#141c2b',
                border: `2px solid ${isAct ? theme.accent : `${theme.muted}33`}`,
                borderRadius: 12 * scaleRatio,
                boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                opacity: op,
                transform: `scale(${s})`,
                transition: 'border-color 0.2s, opacity 0.2s, transform 0.2s',
                display: 'flex',
                flexDirection: 'column',
                padding: 14 * scaleRatio,
                boxSizing: 'border-box',
                zIndex: isAct ? 5 : 1,
              }}
            >
              <div style={{
                flex: 1,
                background: isAct ? theme.accent : '#1c273a',
                borderRadius: 8 * scaleRatio,
                display: 'grid',
                placeItems: 'center',
                color: isAct ? '#0c111b' : theme.muted,
                fontWeight: 800,
                fontSize: 22 * scaleRatio,
                fontFamily: 'monospace',
              }}>
                {st.year}
              </div>
              <div style={{fontSize: 14 * scaleRatio, fontWeight: 700, marginTop: 8 * scaleRatio, color: isAct ? theme.accent : theme.foreground}}>
                {st.title}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
