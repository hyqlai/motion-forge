import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power1Out, power2In, power2InOut, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type ChipGridSingleSelectProps = {
  question?: string;
  options?: string[];
  selectedIndex?: number;
  equation?: string;
  theme: Theme;
  durationInFrames: number;
};

const DEFAULT_OPTIONS = [
  '手动剪辑包装',
  '调用第三方云模板',
  '全代码工业化生成',
  '纯自然语言黑盒生成',
];

export const ChipGridSingleSelect: React.FC<ChipGridSingleSelectProps> = ({
  question = '哪种技术方案真正具备批量交付确定性？',
  options = DEFAULT_OPTIONS,
  selectedIndex = 2,
  equation = '代码内核 + 可编程参数 = 100% 稳定复现',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const FS = 2.0;
  const flash = 0.033;
  const black = 0.17;
  const bounce = 0.34;
  const bounceAmp = 0.04;
  const dim = 0.18;
  const lift = 1.5;
  const liftDur = 0.4;
  const liftY = -46 * scale;
  const exitAt = 6.4;

  const qIn = power3Out(clamp01((t - 0.1) / 0.4));

  // 选中状态计算
  const isSelected = t >= FS;
  const isFlash = t >= FS && t < FS + flash;
  const blackP = clamp01((t - (FS + flash)) / black);
  const bounceP = clamp01((t - (FS + flash)) / bounce);
  const curBounceScale = bounceP > 0 ? 1 + Math.sin(bounceP * Math.PI) * bounceAmp : 1;

  // 收束时刻
  const tLift = FS + lift;
  const liftP = power2InOut(clamp01((t - tLift) / liftDur));

  // 余项透明度：选中后降到 18%，收束后归零
  let otherOp = 1;
  if (t >= tLift) {
    otherOp = 0;
  } else if (t >= FS + flash) {
    otherOp = lerp(1, dim, power2Out(clamp01((t - (FS + flash)) / 0.34)));
  }

  // 算式行逐词
  const eqAt = tLift + 0.25;
  const eqP = power1Out(clamp01((t - eqAt) / 0.5));
  const exitK = 1 - power2In(clamp01((t - exitAt) / 0.4));

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
        {/* 问题行 */}
        <div style={{
          fontSize: 28 * scale,
          fontWeight: 800,
          marginBottom: 36 * scale,
          opacity: qIn,
          transform: `translateY(${lerp(12 * scale, 0, qIn)}px)`,
        }}>
          {question}
        </div>

        {/* 候选选项网格 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, auto)',
          gap: 16 * scale,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }}>
          {options.map((opt, i) => {
            const isWinner = i === selectedIndex;
            const itemIn = power3Out(clamp01((t - (0.5 + i * 0.1)) / 0.35));

            if (!isWinner && otherOp <= 0.001) return null;

            // 胜出项的样式
            let bg = '#141c2b';
            let color = theme.foreground;
            let borderColor = `${theme.muted}44`;
            let s = 1;
            let y = 0;

            if (isWinner && isSelected) {
              bg = isFlash ? '#4a5568' : (blackP >= 1 ? theme.accent : '#141c2b');
              color = blackP >= 1 ? '#0c111b' : theme.foreground;
              borderColor = theme.accent;
              s = curBounceScale;
              y = lerp(0, liftY, liftP);
            }

            const op = isWinner ? itemIn : itemIn * otherOp;

            return (
              <div
                key={i}
                style={{
                  height: 48 * scale,
                  lineHeight: `${48 * scale}px`,
                  padding: `0 ${22 * scale}px`,
                  borderRadius: 24 * scale,
                  background: bg,
                  color,
                  border: `2px solid ${borderColor}`,
                  fontSize: 18 * scale,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  opacity: op,
                  transform: `translateY(${y}px) scale(${s})`,
                  boxShadow: isWinner && isSelected ? '0 10px 30px rgba(0,0,0,0.5)' : 'none',
                  transition: 'background 0.1s, color 0.1s',
                  willChange: 'transform, opacity',
                }}
              >
                {opt}
              </div>
            );
          })}
        </div>

        {/* 算式推论行 */}
        {t >= eqAt && (
          <div style={{
            fontSize: 24 * scale,
            fontWeight: 800,
            color: theme.accent,
            marginTop: 40 * scale,
            opacity: eqP,
            transform: `translateY(${lerp(14 * scale, 0, eqP)}px)`,
          }}>
            {equation}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
