import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, clamp01, lerp, power1In, power1Out, power2InOut, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type WordSlotCycleProps = {
  stem?: string;
  words?: string[];
  final?: string;
  theme: Theme;
  durationInFrames: number;
  beat?: number;
};

export const WordSlotCycle: React.FC<WordSlotCycleProps> = ({
  stem = '一个 AI，帮你',
  words = ['写代码', '改简历', '做 PPT', '查资料'],
  final = '搞定所有事',
  theme,
  beat = 0.7,
}) => {
  const frame = useCurrentFrame();
  const {fps, width: compWidth} = useVideoConfig();
  const t = frame / fps;
  const scale = compWidth / 960;

  const n = Math.max(1, words.length);
  const rowHeight = 56 * scale;
  const pad = 48 * scale;
  const gap = 14 * scale;

  const swap = 0.27;
  const swapBlur = 4;
  const ghostAlpha = 0.13;
  const enterAt = 0.2;
  const firstSwapAt = 1.1;
  const settle = 0.35;
  const flyOut = 0.23;
  const finalDelay = 0.12;
  const finalIn = 0.47;

  // 估算宽度
  const ws = words.map((w) => w.length * 30 * scale + pad);
  const stemW = stem.length * 40 * scale;
  const finW = final.length * 40 * scale;

  const swapAt = (i: number) => firstSwapAt + (i - 1) * beat;
  const lastAt = (n > 1 ? swapAt(n - 1) : firstSwapAt - beat) + beat + settle;

  const stemIn = power3Out(clamp01((t - enterAt) / 0.5));
  const pillIn = power3Out(clamp01((t - (enterAt + 0.08)) / 0.5));

  // 滚轮与插值
  let idx = 0;
  let slotWidth = ws[0];
  let blur = 0;
  let curIdx = 0;
  for (let i = 1; i < n; i++) {
    const at = swapAt(i);
    const p = clamp01((t - at) / swap);
    idx += power2InOut(p);
    if (t >= at) {
      slotWidth = lerp(ws[i - 1], ws[i], power2InOut(p));
    }
    if (t >= at && t < at + swap) {
      blur = p < 0.45 ? swapBlur * power1In(p / 0.45) : swapBlur * (1 - power2Out((p - 0.45) / 0.55));
    }
    if (t >= at + swap) curIdx = i;
  }

  // 幽灵项透明度
  let gk = power1Out(clamp01((t - 0.7) / 0.3));
  for (let i = 1; i < n; i++) {
    const at = swapAt(i);
    if (t >= at && t < at + 0.1) gk = 1 - power1Out((t - at) / 0.1);
    else if (t >= at + 0.1 && t < at + swap) gk = 0;
    else if (t >= at + swap && t < at + swap + 0.15) gk = power1Out((t - at - swap) / 0.15);
  }

  // 收束：胶囊飞走 + 结论落定
  const tFly = lastAt;
  const flyP = power1In(clamp01((t - tFly) / flyOut));
  const pillY = lerp(0, -130 * scale, flyP);
  const pillBlur = lerp(0, 10, flyP);
  const pillOp = 1 - flyP;

  const tFin = tFly + finalDelay;
  const finP = backOut(1.4)(clamp01((t - tFin) / finalIn));
  const finY = lerp(18 * scale, 0, finP);

  const prevWord = curIdx > 0 ? words[curIdx - 1] : '';
  const nextWord = curIdx < n - 1 ? words[curIdx + 1] : '';

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
        alignItems: 'center',
        position: 'relative',
      }}>
        {/* 句干（锚定） */}
        <div style={{
          fontSize: 40 * scale,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          opacity: stemIn,
          transform: `translateY(${lerp(14 * scale, 0, stemIn)}px)`,
          marginRight: gap,
        }}>
          {stem}
        </div>

        {/* 词槽区域 */}
        <div style={{position: 'relative', width: slotWidth, height: rowHeight}}>
          {/* 胶囊底板 */}
          {pillOp > 0.01 && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: '#192336',
              border: `1px solid ${theme.muted}44`,
              borderRadius: 14 * scale,
              opacity: pillIn * pillOp,
              transform: `translateY(${pillY}px) scale(${pillIn})`,
              filter: `blur(${pillBlur}px)`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }} />
          )}

          {/* 滚轮文字与幽灵项 */}
          {pillOp > 0.01 && (
            <div style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: pillIn * pillOp,
              transform: `translateY(${pillY}px)`,
            }}>
              {/* 上方幽灵项 */}
              {prevWord && (
                <div style={{
                  position: 'absolute',
                  top: -rowHeight,
                  fontSize: 26 * scale,
                  fontWeight: 700,
                  color: theme.muted,
                  opacity: gk * ghostAlpha,
                  whiteSpace: 'nowrap',
                }}>
                  {prevWord}
                </div>
              )}

              {/* 当前中位词 */}
              <div style={{
                fontSize: 28 * scale,
                fontWeight: 750,
                color: theme.accent,
                filter: `blur(${blur}px)`,
                whiteSpace: 'nowrap',
              }}>
                {words[curIdx]}
              </div>

              {/* 下方幽灵项 */}
              {nextWord && (
                <div style={{
                  position: 'absolute',
                  bottom: -rowHeight,
                  fontSize: 26 * scale,
                  fontWeight: 700,
                  color: theme.muted,
                  opacity: gk * ghostAlpha,
                  whiteSpace: 'nowrap',
                }}>
                  {nextWord}
                </div>
              )}
            </div>
          )}

          {/* 结论落定 */}
          {t >= tFin && (
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: rowHeight,
              display: 'flex',
              alignItems: 'center',
              fontSize: 40 * scale,
              fontWeight: 800,
              color: theme.accent,
              whiteSpace: 'nowrap',
              opacity: finP,
              transform: `translateY(${finY}px)`,
            }}>
              {final}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
