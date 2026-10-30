import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

export type TerminalLine = {
  k: 'cmd' | 'log' | 'ok';
  t: string;
  d?: number;
  p?: number;
};

export type TerminalTypingLogProps = {
  lines?: TerminalLine[];
  pathText?: string;
  theme: Theme;
  durationInFrames: number;
  cmdRate?: number;
  logRate?: number;
};

const DEFAULT_LINES: TerminalLine[] = [
  {k: 'cmd', t: 'pnpm install', d: 0},
  {k: 'log', t: 'Lockfile is up to date, resolving...', d: 0.20},
  {k: 'log', t: 'Packages: +312, reused 298, added 14', d: 0.27},
  {k: 'log', t: 'Done in 4.1s', d: 0.12},
  {k: 'cmd', t: 'pnpm build', d: 0.50},
  {k: 'log', t: '> vite build --mode production', d: 0.20},
  {k: 'log', t: 'transforming 1284 modules', d: 0.24},
  {k: 'log', t: 'dist/assets/index.js    214.6 kB', d: 0.12},
  {k: 'log', t: 'dist/assets/vendor.js   482.3 kB', d: 0.10},
  {k: 'log', t: 'prerendered 12 routes · gzip 168.4 kB', d: 0.12},
  {k: 'ok', t: '✓ built in 6.42s', d: 0.34},
];

export const TerminalTypingLog: React.FC<TerminalTypingLogProps> = ({
  lines = DEFAULT_LINES,
  pathText = '~/projects/motion-forge',
  theme,
  cmdRate = 23,
  logRate = 68,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const leadIn = 0.32;
  const lineDelay = 0.27;
  const logChunk = 4;
  const cmdChunk = 1;
  const hover = 0.60;
  const visibleLines = 8;
  const lineHeight = 34 * scale;
  const cursorHz = 2;

  // 时刻表生成
  const sched: {start: number; end: number; rate: number; chunk: number; len: number; text: string; k: string}[] = [];
  let acc = leadIn;
  lines.forEach((l) => {
    const isCmd = l.k === 'cmd';
    const rate = isCmd ? cmdRate : logRate;
    const chunk = isCmd ? cmdChunk : logChunk;
    const len = l.t.length;
    const fillEnd = len > chunk ? len - chunk + 1 : len;
    const typeDur = fillEnd / rate;
    const delay = l.d !== undefined ? l.d : lineDelay;
    const start = acc + delay;
    const end = start + typeDur;
    const pause = l.p !== undefined ? l.p : (l.t.endsWith('...') ? hover : 0);
    acc = end + pause;
    sched.push({start, end, rate, chunk, len, text: l.t, k: l.k});
  });

  // 滚动零插值：整跳
  let steps = 0;
  for (let i = visibleLines; i < sched.length; i++) {
    if (t >= sched[i].start) steps++;
  }
  const ty = -steps * lineHeight;

  const blinkOn = Math.floor(t * cursorHz) % 2 === 0;

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
        width: 836 * scale,
        height: 356 * scale,
        borderRadius: 12 * scale,
        overflow: 'hidden',
        background: '#131822',
        border: `1px solid ${theme.muted}33`,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
      }}>
        {/* 窗口顶栏 */}
        <div style={{
          height: 40 * scale,
          flex: `0 0 ${40 * scale}px`,
          display: 'flex',
          alignItems: 'center',
          gap: 8 * scale,
          padding: `0 ${16 * scale}px`,
          background: '#1b2332',
          borderBottom: `1px solid ${theme.muted}22`,
        }}>
          <div style={{display: 'flex', gap: 6 * scale}}>
            <i style={{width: 10 * scale, height: 10 * scale, borderRadius: '50%', background: '#e06c60', display: 'inline-block'}} />
            <i style={{width: 10 * scale, height: 10 * scale, borderRadius: '50%', background: '#e5c07b', display: 'inline-block'}} />
            <i style={{width: 10 * scale, height: 10 * scale, borderRadius: '50%', background: '#4ecb71', display: 'inline-block'}} />
          </div>
          <span style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 13 * scale,
            color: theme.muted,
            fontFamily: 'monospace',
            marginRight: 40 * scale,
          }}>
            {pathText}
          </span>
        </div>

        {/* 终端内容视口 */}
        <div style={{flex: 1, position: 'relative'}}>
          <div style={{position: 'absolute', inset: 20 * scale, overflow: 'hidden'}}>
            <div style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              fontSize: 20 * scale,
              transform: `translateY(${ty}px)`,
            }}>
              {sched.map((s, i) => {
                const on = t >= s.start;
                const linear = on ? Math.floor((t - s.start) * s.rate) : 0;
                const revealed = Math.min(s.len, Math.ceil(linear / s.chunk) * s.chunk);
                const co = on && revealed < s.len && blinkOn ? 1 : 0;

                const color = s.k === 'ok' ? '#4ecb71' : (s.k === 'cmd' ? theme.foreground : theme.muted);

                return (
                  <div
                    key={i}
                    style={{
                      height: lineHeight,
                      display: 'flex',
                      alignItems: 'center',
                      whiteSpace: 'pre',
                      color,
                      visibility: on ? 'visible' : 'hidden',
                    }}
                  >
                    {s.k === 'cmd' ? (
                      <span style={{color: theme.accent, marginRight: 10 * scale, fontWeight: 700}}>$</span>
                    ) : null}
                    <span>{s.text.slice(0, revealed)}</span>
                    <span style={{
                      display: 'inline-block',
                      width: 10 * scale,
                      height: 18 * scale,
                      marginLeft: 2 * scale,
                      background: 'currentColor',
                      opacity: co,
                    }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
