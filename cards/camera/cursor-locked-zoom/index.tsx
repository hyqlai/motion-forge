import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2InOut} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type CursorLockedZoomProps = {
  cmd?: string;
  theme: Theme;
  durationInFrames: number;
};

export const CursorLockedZoom: React.FC<CursorLockedZoomProps> = ({
  cmd = 'ffmpeg -i raw.mov -vf scale=1080:-2 -crf 18 out.mp4',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const zoomMax = 2.65;
  const rate = 15;
  const leadIn = 0.45;
  const holdEnd = 0.75;
  const pullDur = 0.80;

  const charW = 20 * scale * 0.6;
  const lineH = 32 * scale;
  const startX = (100 + 20 + 20) * scale;
  const startY = (78 + 40 + 20 + 2 * 32) * scale;

  const typeDur = cmd.length / rate;
  const tTypeEnd = leadIn + typeDur;
  const tPull = tTypeEnd + holdEnd;

  // 打字进度
  let revealed = 0;
  if (t >= leadIn) {
    revealed = Math.min(cmd.length, Math.floor((t - leadIn) * rate));
  }

  // 光标在世界坐标中的 X
  const cursorX = startX + revealed * charW;
  const cursorY = startY + lineH / 2;

  // 相机参数反解
  let curZoom = zoomMax;
  let tx = width / 2 - zoomMax * cursorX;
  let ty = height / 2 - zoomMax * cursorY;

  if (t >= tPull) {
    const p = power2InOut(clamp01((t - tPull) / pullDur));
    curZoom = lerp(zoomMax, 1, p);
    const targetTx = lerp(width / 2 - zoomMax * cursorX, 0, p);
    const targetTy = lerp(height / 2 - zoomMax * cursorY, 0, p);
    tx = targetTx;
    ty = targetTy;
  }

  const blinkOn = Math.floor(t * 2) % 2 === 0;

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      {/* 摄像机变换层（原点在 0 0，保证反解成立） */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width,
        height,
        transformOrigin: '0 0',
        transform: `translate(${tx}px, ${ty}px) scale(${curZoom})`,
        willChange: 'transform',
      }}>
        {/* 终端卡片 */}
        <div style={{
          position: 'absolute',
          left: 100 * scale,
          top: 78 * scale,
          width: 760 * scale,
          height: 384 * scale,
          borderRadius: 12 * scale,
          background: '#131822',
          border: `1px solid ${theme.muted}33`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* 顶栏 */}
          <div style={{
            height: 40 * scale,
            background: '#192233',
            borderBottom: `1px solid ${theme.muted}22`,
            display: 'flex',
            alignItems: 'center',
            gap: 6 * scale,
            padding: `0 ${16 * scale}px`,
          }}>
            <i style={{width: 8 * scale, height: 8 * scale, borderRadius: '50%', background: '#ff5f56', display: 'inline-block'}} />
            <i style={{width: 8 * scale, height: 8 * scale, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block'}} />
            <i style={{width: 8 * scale, height: 8 * scale, borderRadius: '50%', background: '#27c93f', display: 'inline-block'}} />
            <span style={{flex: 1, textAlign: 'center', fontSize: 11 * scale, color: theme.muted, fontFamily: 'monospace', marginRight: 30 * scale}}>
              bash — video-render
            </span>
          </div>

          {/* 终端内容行 */}
          <div style={{
            padding: `${20 * scale}px`,
            fontFamily: 'ui-monospace, monospace',
            fontSize: 20 * scale,
            lineHeight: `${lineH}px`,
          }}>
            <div style={{color: theme.muted}}>Last login: Wed Oct 28 on ttys001</div>
            <div style={{color: theme.muted}}>Preparing ffmpeg pipeline filtergraph...</div>
            <div style={{display: 'flex', alignItems: 'center', whiteSpace: 'pre', color: theme.foreground}}>
              <span style={{color: theme.accent, marginRight: 8 * scale, fontWeight: 800}}>$</span>
              <span>{cmd.slice(0, revealed)}</span>
              {blinkOn && (
                <span style={{width: 10 * scale, height: 20 * scale, background: theme.accent, display: 'inline-block', marginLeft: 2}} />
              )}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
