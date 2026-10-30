import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2InOut, power2Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

type Pt = {x: number; y: number};
type PathGeom = {pts: Pt[]; cum: number[]; total: number};

const samplePath = (d: string): PathGeom => {
  const pts: Pt[] = [];
  const tokens = d.trim().split(/[\s,]+/);
  let i = 0;
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === 'M' || cmd === 'L') {
      pts.push({x: num(), y: num()});
    } else if (cmd === 'Q') {
      const p0 = pts[pts.length - 1];
      const cx = num();
      const cy = num();
      const x = num();
      const y = num();
      for (let k = 1; k <= 32; k++) {
        const u = k / 32;
        const v = 1 - u;
        pts.push({
          x: v * v * p0.x + 2 * v * u * cx + u * u * x,
          y: v * v * p0.y + 2 * v * u * cy + u * u * y,
        });
      }
    }
  }
  const cum = [0];
  for (let k = 1; k < pts.length; k++) {
    cum.push(cum[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y));
  }
  return {pts, cum, total: cum[cum.length - 1]};
};

const pointAtLength = (g: PathGeom, len: number): Pt => {
  const L = Math.max(0, Math.min(g.total, len));
  let lo = 0;
  let hi = g.cum.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (g.cum[mid] < L) lo = mid + 1;
    else hi = mid;
  }
  const k = Math.max(1, lo);
  const segLen = g.cum[k] - g.cum[k - 1] || 1;
  const p = (L - g.cum[k - 1]) / segLen;
  return {x: lerp(g.pts[k - 1].x, g.pts[k].x, p), y: lerp(g.pts[k - 1].y, g.pts[k].y, p)};
};

const STROKES = [
  {d: 'M 40 30 L 600 30 Q 616 30 616 46 L 616 334 Q 616 350 600 350 L 40 350 Q 24 350 24 334 L 24 46 Q 24 30 40 30', dur: 1.1, width: 4},
  {d: 'M 140 250 L 200 250 Q 230 180 300 175 L 380 172 Q 450 172 480 245 L 520 250 L 520 285 L 150 288 L 140 250', dur: 1.3, width: 5},
  {d: 'M 200 316 L 460 320', dur: 0.45, width: 6},
];

const GEOMS = STROKES.map((s) => samplePath(s.d));

const placePencil = (g: PathGeom, p: number, extra = 0) => {
  const at = Math.max(0.001, Math.min(g.total, g.total * p));
  const pt = pointAtLength(g, at);
  const back = pointAtLength(g, Math.max(0, at - 2.5));
  const vx = pt.x - back.x;
  const vy = pt.y - back.y;
  const m = Math.hypot(vx, vy) || 1;
  const ang = 42 + 5 * (vy / m);
  const r = (ang * Math.PI) / 180;
  return {x: pt.x + extra * Math.sin(r), y: pt.y - extra * Math.cos(r), ang};
};

export type PencilSketchDrawProps = {
  theme: Theme;
  durationInFrames: number;
};

export const PencilSketchDraw: React.FC<PencilSketchDrawProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const starts = [0.30, 1.65, 3.20];
  const lifts = [1.40, 2.95, 3.65];

  // 判定当前绘制哪一笔
  let activeStroke = -1;
  let activeP = 0;
  let liftExtra = 0;
  let pencilOpacity = 0;

  for (let i = 0; i < STROKES.length; i++) {
    const sStart = starts[i];
    const sEnd = sStart + STROKES[i].dur;
    const lEnd = sEnd + 0.25;

    if (t >= sStart && t < lEnd) {
      activeStroke = i;
      if (t < sEnd) {
        activeP = power2InOut(clamp01((t - sStart) / STROKES[i].dur));
        pencilOpacity = 1;
      } else {
        activeP = 1;
        const lp = clamp01((t - sEnd) / 0.25);
        liftExtra = lerp(0, 26, lp);
        pencilOpacity = 1 - lp;
      }
      break;
    }
  }

  const pencilTransform = activeStroke >= 0
    ? placePencil(GEOMS[activeStroke], activeP, liftExtra)
    : {x: 0, y: 0, ang: 42};

  const tagP = power2Out(clamp01((t - 3.70) / 0.35));

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        left: 160 * scale,
        top: 60 * scale,
        width: 640 * scale,
        height: 380 * scale,
      }}>
        {/* SVG 笔迹层 */}
        <svg
          viewBox="0 0 640 380"
          style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible'}}
        >
          {STROKES.map((s, idx) => {
            const g = GEOMS[idx];
            let progress = 0;
            if (t >= starts[idx]) {
              progress = t < starts[idx] + s.dur
                ? power2InOut(clamp01((t - starts[idx]) / s.dur))
                : 1;
            }
            const offset = g.total * (1 - progress);
            return (
              <path
                key={idx}
                d={s.d}
                fill="none"
                stroke={theme.accent}
                strokeWidth={s.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={g.total}
                strokeDashoffset={offset}
              />
            );
          })}
        </svg>

        {/* 纯矢量高保真铅笔 */}
        {pencilOpacity > 0.01 && (
          <div style={{
            position: 'absolute',
            left: pencilTransform.x,
            top: pencilTransform.y,
            opacity: pencilOpacity,
            transform: `rotate(${pencilTransform.ang}deg)`,
            transformOrigin: '0 0',
            pointerEvents: 'none',
            zIndex: 10,
          }}>
            <svg
              width={36 * scale}
              height={200 * scale}
              viewBox="-18 -200 36 200"
              style={{position: 'absolute', left: -18 * scale, top: -200 * scale, overflow: 'visible'}}
            >
              <polygon points="0,0 -3,-12 3,-12" fill="#2d3748" />
              <polygon points="0,0 -9,-30 0,-30" fill="#dcb488" />
              <polygon points="0,0 0,-30 9,-30" fill="#e8c39a" />
              <rect x={-9} y={-170} width={6} height={140} fill="#e3b800" />
              <rect x={-3} y={-170} width={6} height={140} fill="#FFD400" />
              <rect x={3} y={-170} width={6} height={140} fill="#ffdf4d" />
              <rect x={-9} y={-182} width={18} height={12} fill="#a0aec0" />
              <path d="M -9 -182 Q -9 -196 0 -196 Q 9 -196 9 -182 Z" fill="#f687b3" />
            </svg>
          </div>
        )}

        {/* 标签 */}
        <div style={{
          position: 'absolute',
          left: 200,
          top: 336,
          fontSize: 16 * scale,
          fontWeight: 700,
          color: theme.muted,
          opacity: tagP,
          transform: `translateY(${lerp(10, 0, tagP)}px)`,
        }}>
          概念框架草图
        </div>
      </div>
    </AbsoluteFill>
  );
};
