import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, clamp01, lerp, power1Out, power2InOut, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

type Pt = {x: number; y: number};

const buildCurve = (pts: Pt[]) => {
  const [p0, c1, c2, p3] = pts;
  const samples: Pt[] = [];
  const N = 64;
  for (let k = 0; k <= N; k++) {
    const u = k / N;
    const v = 1 - u;
    samples.push({
      x: v * v * v * p0.x + 3 * v * v * u * c1.x + 3 * v * u * u * c2.x + u * u * u * p3.x,
      y: v * v * v * p0.y + 3 * v * v * u * c1.y + 3 * v * u * u * c2.y + u * u * u * p3.y,
    });
  }
  const cum = [0];
  for (let k = 1; k < samples.length; k++) {
    cum.push(cum[k - 1] + Math.hypot(samples[k].x - samples[k - 1].x, samples[k].y - samples[k - 1].y));
  }
  const total = cum[cum.length - 1];

  const at = (len: number) => {
    const L = Math.max(0, Math.min(total, len));
    let lo = 0;
    let hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < L) lo = mid + 1;
      else hi = mid;
    }
    const k = Math.max(1, lo);
    const seg = cum[k] - cum[k - 1] || 1;
    const p = (L - cum[k - 1]) / seg;
    return {
      x: lerp(samples[k - 1].x, samples[k].x, p),
      y: lerp(samples[k - 1].y, samples[k].y, p),
    };
  };

  const d = `M ${p0.x} ${p0.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p3.x} ${p3.y}`;
  return {d, len: total, at};
};

export type SourceConvergeProps = {
  title?: string;
  sources?: string[];
  hub?: string;
  caption?: string;
  theme: Theme;
  durationInFrames: number;
  convDur?: number;
};

export const SourceConverge: React.FC<SourceConvergeProps> = ({
  title = '四个渠道的数据，汇成统一引擎',
  sources = ['API 网关', '实时日志', '业务数据库', '用户事件'],
  hub = '统一内核',
  caption = '自动化全流过滤与清洗',
  theme,
  convDur = 1.5,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const srcX = 200 * scale;
  const srcYs = [170 * scale, 230 * scale, 310 * scale, 390 * scale];
  const hubX = 700 * scale;
  const hubY = 290 * scale;
  const ctrl = [380 * scale, 520 * scale];

  const curves = srcYs.map((y) =>
    buildCurve([{x: srcX, y}, {x: ctrl[0], y}, {x: ctrl[1], y: hubY}, {x: hubX, y: hubY}])
  );

  const drawAt = 0.5;
  const drawStagger = 0.15;
  const drawDur = 0.5;
  const convAt = 1.5;
  const shrinkKnee = 0.75;
  const pulseAt = 2.85;
  const eraseAt = 3.25;
  const eraseDur = 0.4;
  const centerAt = 3.8;
  const centerDur = 0.6;
  const capInAt = 3.5;

  const conv = power2InOut(clamp01((t - convAt) / convDur));
  const erase = power2Out(clamp01((t - eraseAt) / eraseDur));
  const size = Math.max(0, conv < shrinkKnee ? lerp(1, 0.34, conv / shrinkKnee) : lerp(0.34, 0, (conv - shrinkKnee) / (1 - shrinkKnee)));

  let hs = power3Out(clamp01((t - 0.8) / 0.4));
  if (t >= pulseAt) {
    hs = t < pulseAt + 0.25
      ? lerp(1, 1.12, backOut(2)(clamp01((t - pulseAt) / 0.25)))
      : lerp(1.12, 1, power2Out(clamp01((t - (pulseAt + 0.25)) / 0.25)));
  }

  const cx = lerp(hubX, 480 * scale, power2InOut(clamp01((t - centerAt) / centerDur)));
  const ttlIn = power3Out(clamp01((t - 0.1) / 0.4));
  const capIn = power1Out(clamp01((t - capInAt) / 0.4));

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        left: 80 * scale,
        top: 60 * scale,
        fontSize: 26 * scale,
        fontWeight: 750,
        opacity: ttlIn,
        transform: `translateY(${lerp(10 * scale, 0, ttlIn)}px)`,
      }}>
        {title}
      </div>

      <svg viewBox="0 0 960 540" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
        {/* 四条连线 */}
        {curves.map((c, i) => {
          const draw = power2Out(clamp01((t - (drawAt + i * drawStagger)) / drawDur));
          const offset = c.len * (1 - draw) + erase * c.len;
          return (
            <path
              key={`p${i}`}
              d={c.d}
              fill="none"
              stroke={`${theme.muted}55`}
              strokeWidth={2.5 * scale}
              strokeDasharray={c.len}
              strokeDashoffset={offset}
            />
          );
        })}

        {/* 来源胶囊沿线滑行 */}
        {curves.map((c, i) => {
          const p = c.at(conv * c.len);
          const nodeIn = power1Out(clamp01((t - (0.3 + i * 0.08)) / 0.3));
          if (size <= 0.001) return null;
          return (
            <g
              key={`node${i}`}
              transform={`translate(${p.x}, ${p.y}) scale(${size * nodeIn})`}
            >
              <rect
                x={-55 * scale}
                y={-18 * scale}
                width={110 * scale}
                height={36 * scale}
                rx={8 * scale}
                fill="#141c2b"
                stroke={`${theme.muted}55`}
                strokeWidth={1.5}
              />
              <text
                x={0}
                y={5 * scale}
                fill={theme.foreground}
                fontSize={14 * scale}
                fontWeight={650}
                textAnchor="middle"
              >
                {sources[i]}
              </text>
            </g>
          );
        })}

        {/* 汇聚中心胶囊 */}
        <g transform={`translate(${cx}, ${hubY}) scale(${hs})`}>
          <rect
            x={-65 * scale}
            y={-22 * scale}
            width={130 * scale}
            height={44 * scale}
            rx={10 * scale}
            fill={theme.accent}
            style={{filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))'}}
          />
          <text
            x={0}
            y={6 * scale}
            fill="#0c111b"
            fontSize={16 * scale}
            fontWeight={800}
            textAnchor="middle"
          >
            {hub}
          </text>
        </g>
      </svg>

      {/* 说明行 */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 360 * scale,
        textAlign: 'center',
        fontSize: 16 * scale,
        fontWeight: 650,
        color: theme.muted,
        opacity: capIn,
      }}>
        {caption}
      </div>
    </AbsoluteFill>
  );
};
