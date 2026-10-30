import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, power1Out, power2In} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type ErrorRetypeProps = {
  prefix?: string;
  first?: string;
  second?: string;
  theme: Theme;
  durationInFrames: number;
  type?: number;
  del?: number;
};

export const ErrorRetype: React.FC<ErrorRetypeProps> = ({
  prefix = '做视频靠的不是',
  first = '堆砌特效',
  second = '叙事秩序',
  theme,
  type = 0.09,
  del = 0.06,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const N = Math.max(first.length, second.length);
  const slotW = 44 * scale;

  const prefixIn = 0.1;
  const typeAt = 0.7;
  const pause = 0.55;
  const gap = 0.12;
  const retype = 0.06;
  const settle = 0.3;
  const blink = 0.13;
  const cursorOff = 0.55;
  const holdEnd = 2.6;
  const exitDur = 0.4;

  const tType = typeAt;
  const tB1 = tType + first.length * type;
  const tDel = tB1 + pause;
  const tRe = tDel + first.length * del + gap;
  const tB2 = tRe + second.length * retype + settle;
  const tOff = tB2 + cursorOff;
  const exitAt = tB2 + holdEnd;

  let n = 0;
  let word = first;
  if (t >= tRe) {
    word = second;
    n = Math.min(second.length, Math.floor((t - tRe) / retype) + 1);
  } else if (t >= tDel) {
    n = Math.max(0, first.length - 1 - Math.floor((t - tDel) / del));
  } else if (t >= tType) {
    n = Math.min(first.length, Math.floor((t - tType) / type) + 1);
  }

  const blinkOn = (t0: number) => {
    const k = Math.floor((t - t0) / blink);
    return k >= 4 ? 1 : (k % 2 === 0 ? 0 : 1);
  };

  let cursor = 1;
  if (t >= tOff) cursor = 0;
  else if (t >= tB2) cursor = blinkOn(tB2);
  else if (t >= tB1 && t < tB1 + 4 * blink) cursor = blinkOn(tB1);

  const prefixK = power1Out(clamp01((t - prefixIn) / 0.3));
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
        alignItems: 'baseline',
        fontSize: 40 * scale,
        fontWeight: 700,
        position: 'relative',
        opacity: exitK,
      }}>
        <span style={{opacity: prefixK}}>{prefix}</span>
        <span style={{
          display: 'inline-flex',
          marginLeft: 12 * scale,
          color: theme.accent,
        }}>
          {Array.from({length: N}, (_, k) => (
            <span
              key={k}
              style={{
                width: slotW,
                textAlign: 'center',
                display: 'inline-block',
              }}
            >
              {k < n ? word[k] : ''}
            </span>
          ))}
        </span>
        {/* 光标 */}
        <span
          style={{
            display: 'inline-block',
            width: 3 * scale,
            height: 36 * scale,
            background: theme.accent,
            opacity: cursor,
            transform: `translateX(${-(N - n) * slotW}px)`,
            marginLeft: 4 * scale,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
