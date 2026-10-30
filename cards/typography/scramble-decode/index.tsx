import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

export type ScrambleDecodeProps = {
  text?: string;
  theme?: Theme;
  durationInFrames?: number;
};

const CHARSET = 'ABCDEF0123456789#$%&*+?';
const LOCK_START = 20;
const LOCK_STEP = 5;
const FLASH_LEN = 2;

const h = (n: number) => {
  const s = Math.sin(n * 127.3) * 43758.5453;
  return s - Math.floor(s);
};

export const ScrambleDecode: React.FC<ScrambleDecodeProps> = ({
  text = 'DECODE SPEED',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);
  const accent = theme?.accent ?? '#38bdf8';

  const chars = text.toUpperCase().split('');
  const lockedCount = chars.filter((c, i) => c === ' ' || frame >= LOCK_START + i * LOCK_STEP).length;
  const allLocked = lockedCount === chars.length;

  return (
    <AbsoluteFill style={{background: theme?.background ?? '#0b0e14', overflow: 'hidden'}}>
      <div style={{
        width: 1920,
        height: 1080,
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: '50% 50%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 36,
      }}>
        {/* 顶部指示条 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '6px 18px',
          borderRadius: 20,
          background: 'rgba(56,189,248,0.1)',
          border: `1px solid ${accent}44`,
          fontSize: 14,
          fontFamily: 'monospace',
          color: accent,
          letterSpacing: 2,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: allLocked ? '#10b981' : accent,
            boxShadow: `0 0 10px ${allLocked ? '#10b981' : accent}`,
          }} />
          {allLocked ? 'DECRYPT COMPLETE' : 'DECRYPTING ALGORITHM...'}
        </div>

        {/* 解码字符序列 */}
        <div style={{
          fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
          fontWeight: 900,
          fontSize: 130,
          letterSpacing: 4,
          display: 'flex',
          alignItems: 'center',
        }}>
          {chars.map((ch, i) => {
            if (ch === ' ') {
              return <span key={i} style={{display: 'inline-block', width: '0.6em'}} />;
            }
            const lockFrame = LOCK_START + i * LOCK_STEP;
            const locked = frame >= lockFrame;
            const flashing = locked && frame < lockFrame + FLASH_LEN;
            const tick = Math.floor(frame / 2);
            const scrambleChar = CHARSET[Math.floor(h(i * 101 + tick * 7 + 13) * CHARSET.length)];
            const shown = locked ? ch : scrambleChar;

            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  color: flashing ? '#0b0e14' : locked ? '#f8fafc' : '#475569',
                  background: flashing ? accent : 'transparent',
                  padding: '0 4px',
                  borderRadius: 4,
                  textShadow: locked ? `0 0 25px ${accent}66` : 'none',
                }}
              >
                {shown}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
