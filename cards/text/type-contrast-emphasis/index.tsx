import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type ContrastWord = {
  w: string;
  beat: number;
  emph?: 'serif' | 'color';
};

export type TypeContrastEmphasisProps = {
  words?: ContrastWord[];
  theme: Theme;
  durationInFrames: number;
};

const DEFAULT_WORDS: ContrastWord[] = [
  {w: '能留住人的', beat: 0.00},
  {w: '不是', beat: 0.72},
  {w: '流量', beat: 1.02, emph: 'serif'},
  {w: '是', beat: 1.36},
  {w: '信任', beat: 1.52, emph: 'color'},
];

export const TypeContrastEmphasis: React.FC<TypeContrastEmphasisProps> = ({
  words = DEFAULT_WORDS,
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const startDelay = 0.15;
  const wordIn = 0.10;
  const accentIn = 0.15;
  const accentRise = 14 * scale;

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        justifyContent: 'center',
        padding: '0 60px',
        fontSize: 48 * scale,
        fontWeight: 650,
        gap: 8 * scale,
      }}>
        {words.map((item, i) => {
          const at = startDelay + item.beat;
          if (t < at) return null;

          const isEmph = item.emph !== undefined;
          const dur = isEmph ? accentIn : wordIn;
          const p = isEmph
            ? power3Out(clamp01((t - at) / dur))
            : power2Out(clamp01((t - at) / dur));

          const currentScale = isEmph
            ? lerp(0.92, 1, p)
            : lerp(0.95, 1, p);

          const y = isEmph ? lerp(accentRise, 0, p) : 0;

          // 样式区分：衬线斜体 vs 强调色
          let color = theme.foreground;
          let fontFamily = theme.fontFamily;
          let fontStyle: React.CSSProperties['fontStyle'] = 'normal';
          let transformExtra = '';

          if (item.emph === 'serif') {
            fontFamily = 'Georgia, "Songti SC", "SimSun", serif';
            fontStyle = 'italic';
            transformExtra = 'skewX(-7deg)';
            color = theme.foreground;
          } else if (item.emph === 'color') {
            color = theme.accent;
            fontFamily = theme.fontFamily;
          }

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontFamily,
                fontStyle,
                color,
                fontWeight: isEmph ? 850 : 650,
                fontSize: isEmph ? 56 * scale : 46 * scale,
                transform: `translateY(${y}px) scale(${currentScale}) ${transformExtra}`,
                transformOrigin: '50% 80%',
                opacity: p,
              }}
            >
              {item.w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
