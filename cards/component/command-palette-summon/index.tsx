import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

export type CommandPaletteSummonProps = {
  theme?: Theme;
  durationInFrames?: number;
};

const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const PANEL_W = 820;
const PANEL_X = (1920 - PANEL_W) / 2;
const PANEL_Y = 280;

const ROWS = [
  {title: 'Deploy to Production Pipeline', shortcut: '↵', tag: 'Action', exitAt: 0},
  {title: 'Toggle Dark / Light Theme Mode', shortcut: '⌘T', tag: 'Setting', exitAt: 0},
  {title: 'Export Film Storyboard to MP4', shortcut: '⇧⌘E', tag: 'Render', exitAt: 2},
  {title: 'Generate Full Motion Sequence', shortcut: '⌥G', tag: 'AI', exitAt: 1},
  {title: 'Inspect Performance Timeline', shortcut: '⌘I', tag: 'Dev', exitAt: 1},
];

export const CommandPaletteSummon: React.FC<CommandPaletteSummonProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);
  const accent = theme?.accent ?? '#38bdf8';

  const dim = interpolate(frame, [12, 22], [0, 1], CL);
  const panelY = interpolate(frame, [18, 30], [PANEL_Y - 30, PANEL_Y], {
    easing: Easing.out(Easing.back(1.6)),
    ...CL,
  });
  const panelOp = interpolate(frame, [18, 26], [0, 1], CL);

  // 模拟打字
  const typedText = frame < 62 ? '' : frame < 78 ? 'de' : 'deploy';

  return (
    <AbsoluteFill style={{background: '#090d16', overflow: 'hidden'}}>
      <div style={{
        width: 1920,
        height: 1080,
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: '50% 50%',
      }}>
        {/* 背景被压暗与模糊 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 40%, rgba(30,41,59,0.7), rgba(9,13,22,0.95))`,
          filter: `blur(${dim * 8}px)`,
          opacity: 0.85,
        }} />

        {/* ⌘K 命令面板浮窗 */}
        <div
          style={{
            position: 'absolute',
            left: PANEL_X,
            top: panelY,
            width: PANEL_W,
            background: 'rgba(20, 28, 43, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: 20,
            boxShadow: '0 30px 90px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            opacity: panelOp,
            overflow: 'hidden',
          }}
        >
          {/* 输入搜索栏 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '24px 28px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            gap: 16,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <div style={{fontSize: 22, color: '#f8fafc', fontWeight: 600, flex: 1, fontFamily: 'monospace'}}>
              {typedText}
              <span style={{
                display: 'inline-block',
                width: 2,
                height: 24,
                background: accent,
                marginLeft: 4,
                verticalAlign: 'middle',
                opacity: (Math.floor(frame / 10) % 2 === 0) ? 1 : 0,
              }} />
            </div>
            <div style={{fontSize: 13, background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 6, color: '#94a3b8', fontFamily: 'monospace'}}>
              ESC
            </div>
          </div>

          {/* 候选列表行 */}
          <div style={{padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6}}>
            {ROWS.map((row, i) => {
              const inStart = 32 + i * 4;
              const exitStart = row.exitAt === 1 ? 65 : row.exitAt === 2 ? 81 : null;
              if (exitStart !== null && frame >= exitStart + 10) return null;

              const inOp = interpolate(frame, [inStart, inStart + 8], [0, 1], CL);
              const inY = interpolate(frame, [inStart, inStart + 8], [12, 0], {easing: Easing.out(Easing.cubic), ...CL});
              const isSelected = i === 0 && frame >= 94;

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 18px',
                    borderRadius: 12,
                    background: isSelected ? accent : 'transparent',
                    color: isSelected ? '#0b0e14' : '#f8fafc',
                    opacity: inOp,
                    transform: `translateY(${inY}px)`,
                    transition: 'background 0.2s ease',
                  }}
                >
                  <span style={{flex: 1, fontSize: 16, fontWeight: isSelected ? 800 : 500}}>
                    {row.title}
                  </span>
                  <span style={{
                    fontSize: 12,
                    background: isSelected ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)',
                    padding: '3px 8px',
                    borderRadius: 4,
                    color: isSelected ? '#0b0e14' : '#94a3b8',
                    marginRight: 12,
                  }}>
                    {row.tag}
                  </span>
                  <span style={{fontSize: 13, fontFamily: 'monospace', opacity: 0.8}}>
                    {row.shortcut}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
