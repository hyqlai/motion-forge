import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2Out} from '../../../core/motion';

type Keyframe = {
  d: number;
  px: number;
  py: number;
  zoom: number;
  roll: number;
};

const bez = (x1: number, y1: number, x2: number, y2: number) => {
  const cx = (t: number, a: number, b: number) =>
    ((1 - t) * 3 * a + t * 3 * b) * (1 - t) * t + t * t * t;
  return (x: number) => {
    let lo = 0;
    let hi = 1;
    let t = x;
    for (let i = 0; i < 22; i++) {
      const v = cx(t, x1, x2);
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return cx(t, y1, y2);
  };
};

const EXPO = bez(0.16, 1, 0.3, 1);

const MOVES: Keyframe[] = [
  {d: 0, px: 0.50, py: 0.115, zoom: 0.66, roll: 0},
  {d: 0.90, px: 0.50, py: 0.115, zoom: 0.66, roll: 0},
  {d: 1.05, px: 0.50, py: 0.150, zoom: 1.34, roll: 0},
  {d: 0.85, px: 0.50, py: 0.150, zoom: 1.34, roll: 0},
  {d: 1.20, px: 0.50, py: 0.545, zoom: 1.42, roll: -0.7},
  {d: 0.90, px: 0.50, py: 0.545, zoom: 1.42, roll: -0.7},
  {d: 1.25, px: 0.50, py: 0.845, zoom: 1.38, roll: 0.6},
  {d: 0.90, px: 0.50, py: 0.845, zoom: 1.38, roll: 0.6},
  {d: 1.40, px: 0.50, py: 0.600, zoom: 0.60, roll: 0},
];

export type StageKeyframeTourProps = {
  children: React.ReactNode;
  durationInFrames: number;
};

export const StageKeyframeTour: React.FC<StageKeyframeTourProps> = ({children}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const rotX = 14;
  const rotY = -20;
  const baseScale = 0.86;
  const pageW = 806 * scale;
  const pageH = 1200 * scale;

  // 沿时间轴定位在哪个关键帧段
  let acc = 0;
  let cur = MOVES[0];
  let nxt = MOVES[0];
  let segP = 0;

  for (let i = 1; i < MOVES.length; i++) {
    const dur = MOVES[i].d;
    if (t >= acc && t < acc + dur) {
      cur = MOVES[i - 1];
      nxt = MOVES[i];
      segP = EXPO(clamp01((t - acc) / dur));
      break;
    }
    acc += dur;
    if (i === MOVES.length - 1 && t >= acc) {
      cur = MOVES[i];
      nxt = MOVES[i];
      segP = 1;
    }
  }

  const px = lerp(cur.px, nxt.px, segP);
  const py = lerp(cur.py, nxt.py, segP);
  const zoom = lerp(cur.zoom, nxt.zoom, segP);
  const roll = lerp(cur.roll, nxt.roll, segP);

  const fx = px * pageW;
  const fy = py * pageH;

  return (
    <AbsoluteFill style={{
      overflow: 'hidden',
      perspective: '1200px',
      perspectiveOrigin: '50% 50%',
      background: 'radial-gradient(ellipse at 50% 40%, #171f2e, #090d15 75%)',
    }}>
      <div style={{
        position: 'absolute',
        left: width / 2,
        top: height / 2,
        transformStyle: 'preserve-3d',
        transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${roll}deg) scale(${baseScale * zoom})`,
        willChange: 'transform',
      }}>
        {/* 页面内容：将兴趣点平移到画面正中 */}
        <div style={{
          position: 'absolute',
          left: -fx,
          top: -fy,
          width: pageW,
          height: pageH,
          borderRadius: 14 * scale,
          overflow: 'hidden',
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.7)',
        }}>
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};
