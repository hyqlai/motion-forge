import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, lerp, power2Out, power3Out, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type NumberCounterProps = {
  label: string;
  target: number;
  prefix?: string;
  suffix?: string;
  delta?: string;
  mode?: 'tween' | 'odometer';
  theme: Theme;
  durationInFrames: number;
};

export const NumberCounter: React.FC<NumberCounterProps> = ({
  label,
  target,
  prefix = '',
  suffix = '',
  delta,
  mode = 'tween',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;
  const value = Math.floor(lerp(0, target, tween(t, 0.3, 1.3, power3Out)));
  const landScale = t < 1.69
    ? lerp(1, 1.08, tween(t, 1.6, 0.09, power2Out))
    : lerp(1.08, 1, tween(t, 1.69, 0.18, backOut(3)));
  const deltaProgress = tween(t, 1.69, 0.25, power2Out);
  const groups = Math.floor(target).toLocaleString('en-US').split('');
  let digitIndex = -1;

  return (
    <AbsoluteFill style={{
      background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily,
      alignItems: 'center', justifyContent: 'center', padding: 48 * scale,
    }}>
      <div style={{color: theme.muted, fontSize: 18 * scale, letterSpacing: 2 * scale, marginBottom: 22 * scale}}>{label}</div>
      {mode === 'tween' ? (
        <div style={{display: 'flex', alignItems: 'baseline', gap: 20 * scale, fontVariantNumeric: 'tabular-nums'}}>
          <span style={{fontSize: 72 * scale, fontWeight: 800, transform: `scale(${landScale})`, transformOrigin: '50% 80%'}}>
            {prefix}{value.toLocaleString('en-US')}{suffix}
          </span>
          {delta ? <span style={{color: theme.accent, fontSize: 28 * scale, fontWeight: 700, opacity: deltaProgress}}>{delta}</span> : null}
        </div>
      ) : (
        <div style={{display: 'flex', alignItems: 'center', fontVariantNumeric: 'tabular-nums'}}>
          {prefix ? <span style={{fontSize: 44 * scale, fontWeight: 800, marginRight: 12 * scale}}>{prefix}</span> : null}
          {groups.map((character, groupIndex) => {
            if (character === ',') return <span key={groupIndex} style={{fontSize: 54 * scale, alignSelf: 'flex-end'}}>,</span>;
            digitIndex += 1;
            const index = digitIndex;
            const digit = Number(character);
            const duration = 1 + index * 0.22;
            const spins = index * 2;
            const steps = spins * 10 + digit;
            const y = -steps * 64 * scale * tween(t, 0.8, duration, power3Out);
            return (
              <div key={groupIndex} style={{
                width: 48 * scale, height: 64 * scale, overflow: 'hidden', position: 'relative',
                border: `1px solid ${theme.muted}`, borderRadius: 7 * scale, marginRight: 7 * scale,
              }}>
                <div style={{position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${y}px)`}}>
                  {Array.from({length: steps + 10}, (_, reelIndex) => (
                    <span key={reelIndex} style={{display: 'block', height: 64 * scale, lineHeight: `${64 * scale}px`, textAlign: 'center', fontSize: 44 * scale, fontWeight: 800}}>{reelIndex % 10}</span>
                  ))}
                </div>
              </div>
            );
          })}
          {suffix ? <span style={{color: theme.muted, fontSize: 22 * scale, marginLeft: 10 * scale}}>{suffix}</span> : null}
        </div>
      )}
    </AbsoluteFill>
  );
};
