import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type GooeyMorphProps = {
  title?: string;
  steps?: string[];
  theme: Theme;
  durationInFrames: number;
};

export type GooeyMorphFrameProps = GooeyMorphProps & {
  frame: number;
  width: number;
  height: number;
};

type Point = {x: number; y: number};

const CX = 480;
const CY = 270;
const ANCHOR_COUNT = 16;
const DEFAULT_STEPS = ['PLAN', 'PROOF', 'BUILD', 'SHIP'];
const CARD_TARGETS = [
  {x: 168, y: 112},
  {x: 632, y: 112},
  {x: 168, y: 356},
  {x: 632, y: 356},
];

const smooth = (value: number): number => value * value * (3 - 2 * value);
const number = (value: number): string => String(Number(value.toFixed(3)));

const anchorsAt = (progress: number): Point[] => Array.from({length: ANCHOR_COUNT}, (_, index) => {
  const angle = -Math.PI / 2 + index * Math.PI * 2 / ANCHOR_COUNT;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const from = {
    x: CX + 154 * Math.sign(cosine) * Math.sqrt(Math.abs(cosine)),
    y: CY + 104 * Math.sign(sine) * Math.sqrt(Math.abs(sine)),
  };
  const radius = 106 + 32 * Math.cos(angle * 4);
  const to = {x: CX + radius * cosine, y: CY + radius * sine};
  return {x: lerp(from.x, to.x, progress), y: lerp(from.y, to.y, progress)};
});

// 同一条闭合 path 的锚点逐帧插值，再转成 Catmull-Rom 贝塞尔段；不能用 dashoffset 冒充几何形变。
const closedCurvePath = (points: Point[]): string => {
  const commands = [`M ${number(points[0].x)} ${number(points[0].y)}`];
  for (let index = 0; index < points.length; index += 1) {
    const previous = points[(index - 1 + points.length) % points.length];
    const start = points[index];
    const end = points[(index + 1) % points.length];
    const next = points[(index + 2) % points.length];
    const control1 = {x: start.x + (end.x - previous.x) / 6, y: start.y + (end.y - previous.y) / 6};
    const control2 = {x: end.x - (next.x - start.x) / 6, y: end.y - (next.y - start.y) / 6};
    commands.push(
      `C ${number(control1.x)} ${number(control1.y)} ${number(control2.x)} ${number(control2.y)} ${number(end.x)} ${number(end.y)}`,
    );
  }
  return `${commands.join(' ')} Z`;
};

export const GooeyMorphFrame: React.FC<GooeyMorphFrameProps> = ({
  frame,
  width,
  height,
  durationInFrames,
  theme,
  title = 'One form, many signals',
  steps = DEFAULT_STEPS,
}) => {
  const filterId = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const morphStart = Math.floor(durationInFrames * 0.25);
  const morphEnd = Math.max(morphStart + 1, Math.floor(durationInFrames * 0.65));
  const morphProgress = smooth(clamp01((frame - morphStart) / (morphEnd - morphStart)));
  const path = closedCurvePath(anchorsAt(morphProgress));
  const entry = smooth(clamp01(frame / 12));
  const morphing = morphProgress > 0.02 && morphProgress < 0.98;
  const cardStart = Math.floor(durationInFrames * 0.55);
  const cardEnd = Math.max(cardStart + 1, Math.floor(durationInFrames * 0.85));
  const cardProgress = smooth(clamp01((frame - cardStart) / (cardEnd - cardStart)));
  const labels = steps.length > 0 ? steps.slice(0, 4) : DEFAULT_STEPS;

  return (
    <AbsoluteFill style={{background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily}}>
      <svg width={width} height={height} viewBox="0 0 960 540" style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={morphing ? 4 : 0} result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
              result="goo"
            />
          </filter>
        </defs>
        <text x={60} y={64} fill={theme.foreground} fontSize={30} fontWeight={750} letterSpacing={1.2}>
          {title}
        </text>
        <text x={60} y={96} fill={theme.muted} fontSize={15} fontWeight={600} letterSpacing={3}>
          CONTINUOUS SVG PATH MORPH
        </text>
        <g filter={`url(#${filterId})`} opacity={0.65 + 0.35 * entry}>
          <path
            data-gooey-morph-path="true"
            d={path}
            fill={theme.accent}
            stroke={theme.foreground}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </g>
        {labels.map((label, index) => {
          const target = CARD_TARGETS[index];
          const delayed = smooth(clamp01((cardProgress - index * 0.06) / (1 - index * 0.06)));
          const cardWidth = 160;
          const cardHeight = 72;
          const x = lerp(CX - cardWidth / 2, target.x, delayed);
          const y = lerp(CY - cardHeight / 2, target.y, delayed);
          return (
            <g key={`${label}-${index}`} opacity={delayed} transform={`translate(${number(x)} ${number(y)})`}>
              <rect width={cardWidth} height={cardHeight} rx={12} fill={theme.foreground} />
              <rect x={1} y={1} width={cardWidth - 2} height={cardHeight - 2} rx={11} fill="none" stroke={theme.accent} strokeWidth={2} />
              <text x={24} y={45} fill={theme.background} fontSize={22} fontWeight={750} letterSpacing={2}>
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const GooeyMorph: React.FC<GooeyMorphProps> = (props) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  return <GooeyMorphFrame {...props} frame={frame} width={width} height={height} />;
};
