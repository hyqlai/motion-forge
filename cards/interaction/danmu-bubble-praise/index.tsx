import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power1In, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type DanmuBubblePraiseProps = {
  theme: Theme;
  durationInFrames: number;
};

const BUBBLES = [
  {text: '讲得太通透了！', x: 120, y: 140, isLeft: true},
  {text: '这套工作流确实能打', x: 620, y: 160, isLeft: false},
  {text: '终于有人把底层逻辑说明白了 ★', x: 140, y: 280, isLeft: true, highlight: true},
  {text: '已三连，期待下一期！', x: 600, y: 320, isLeft: false},
];

export const DanmuBubblePraise: React.FC<DanmuBubblePraiseProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const startDelay = 0.40;
  const stagger = 0.55;
  const inDur = 0.30;
  const hold = 0.75;
  const outDur = 0.40;
  const inX = 26 * scale;
  const inScale = 0.88;
  const outY = -18 * scale;
  const tilts = [-1.5, 1.5, 1.2, -1.8];

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      {/* 居中标题 */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 60 * scale,
        textAlign: 'center',
        fontSize: 24 * scale,
        fontWeight: 750,
        color: theme.muted,
      }}>
        来自真实生产者的实践反馈
      </div>

      {BUBBLES.map((b, i) => {
        const tIn = startDelay + i * stagger;
        const tOut = tIn + inDur + hold;

        if (t < tIn) return null;

        const pIn = power3Out(clamp01((t - tIn) / inDur));
        const pOut = power1In(clamp01((t - tOut) / outDur));

        const curX = lerp(b.isLeft ? -inX : inX, 0, pIn);
        const curY = lerp(0, outY, pOut);
        const curScale = lerp(inScale, 1, pIn);
        const op = pIn * (1 - pOut);

        const isHl = b.highlight ?? false;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: b.x * scale,
              top: b.y * scale,
              padding: `${10 * scale}px ${20 * scale}px`,
              borderRadius: 24 * scale,
              background: isHl ? theme.accent : '#141c2b',
              color: isHl ? '#0c111b' : theme.foreground,
              border: `1px solid ${isHl ? theme.accent : `${theme.muted}33`}`,
              fontSize: 16 * scale,
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              transformOrigin: b.isLeft ? 'left center' : 'right center',
              transform: `translate(${curX}px, ${curY}px) scale(${curScale}) rotate(${tilts[i]}deg)`,
              opacity: op,
              whiteSpace: 'nowrap',
              willChange: 'transform, opacity',
            }}
          >
            {b.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
