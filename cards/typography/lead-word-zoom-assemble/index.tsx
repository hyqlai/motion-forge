import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power1Out, power2In, power2Out, power3InOut, power4Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type LeadWordZoomAssembleProps = {
  words?: string[];
  subline?: string;
  theme: Theme;
  durationInFrames: number;
};

export const LeadWordZoomAssemble: React.FC<LeadWordZoomAssembleProps> = ({
  words = ['效率', '才是', '唯一的', '护城河'],
  subline = '—— 影视制作自动化工作流',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const startAt = 0.10;
  const leadScale = 2.3;
  const pushScale = 1.06;
  const hold = 0.40;
  const shrink = 0.40;
  const slide = 0.80;
  const wordDelay = 0.20;
  const wordStagger = 0.13;
  const wordDur = 0.40;
  const wordPush = 28 * scale;
  const wordFade = 0.07;
  const upDelay = 0.10;
  const upDur = 0.53;
  const up = -28 * scale;
  const exitDur = 0.40;

  const tShrink = startAt + hold;
  const tLastWord = tShrink + wordDelay + (words.length - 2) * wordStagger;
  const tUp = tLastWord + upDelay;
  const exitAt = 4.4;

  // 首词淡入与推近
  const headIn = power1Out(clamp01((t - startAt) / 0.15));
  let curScale = leadScale;
  if (t < tShrink) {
    curScale = lerp(leadScale, leadScale * pushScale, power2Out(clamp01((t - startAt) / hold)));
  } else {
    const pShrink = power3InOut(clamp01((t - tShrink) / shrink));
    curScale = lerp(leadScale * pushScale, 1, pShrink);
  }

  // 整行位移：缩放期间保持在中心，缩完后左滑归位
  const pSlide = power3InOut(clamp01((t - tShrink) / slide));
  const slideX = lerp(160 * scale, 0, pSlide);

  // 整行上移与副行浮出
  const pUp = power2Out(clamp01((t - tUp) / upDur));
  const rowY = lerp(0, up, pUp);
  const subOp = power2Out(clamp01((t - tUp) / upDur));

  const exitK = 1 - power2In(clamp01((t - exitAt) / exitDur));

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
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        opacity: exitK,
      }}>
        {/* 整行主标题 */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          fontSize: 56 * scale,
          fontWeight: 750,
          whiteSpace: 'nowrap',
          transform: `translate(${slideX}px, ${rowY}px)`,
        }}>
          {/* 首词（先占满画面） */}
          <span style={{
            color: theme.accent,
            display: 'inline-block',
            opacity: headIn,
            transform: `scale(${curScale})`,
            transformOrigin: '50% 50%',
            marginRight: 14 * scale,
          }}>
            {words[0]}
          </span>

          {/* 后续词（从右侧推入补齐） */}
          {words.slice(1).map((w, idx) => {
            const wStart = tShrink + wordDelay + idx * wordStagger;
            const wP = power4Out(clamp01((t - wStart) / wordDur));
            const wOp = clamp01((t - wStart) / wordFade);
            const wX = lerp(wordPush, 0, wP);

            return (
              <span
                key={idx}
                style={{
                  display: 'inline-block',
                  opacity: wOp,
                  transform: `translateX(${wX}px)`,
                  marginRight: 10 * scale,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>

        {/* 副标 */}
        <div style={{
          fontSize: 20 * scale,
          color: theme.muted,
          marginTop: 24 * scale,
          opacity: subOp,
          transform: `translateY(${lerp(10 * scale, 0, subOp)}px)`,
          whiteSpace: 'nowrap',
        }}>
          {subline}
        </div>
      </div>
    </AbsoluteFill>
  );
};
