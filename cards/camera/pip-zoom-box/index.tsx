import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power1In, power2InOut, power2Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type PipZoomBoxProps = {
  children: React.ReactNode;
  theme: Theme;
  durationInFrames: number;
  zoom?: number;
  flyDur?: number;
};

export const PipZoomBox: React.FC<PipZoomBoxProps> = ({
  children,
  theme,
  zoom = 2.2,
  flyDur = 0.50,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const boxW = 280 * scale;
  const boxH = 280 * scale;
  const targetX = 764 * scale;
  const targetY = 270 * scale;
  const faceX = 0.275 * 960 * scale;
  const faceY = 0.315 * 540 * scale;

  const radius0 = 4 * scale;
  const radius1 = 10 * scale;
  const startDelay = 0.40;
  const showDur = 0.20;
  const aimHold = 0.15;
  const arrowAt = 0.05;
  const arrowDur = 0.18;

  const w0 = boxW / zoom;
  const h0 = boxH / zoom;

  const tFly = startDelay + showDur + aimHold;
  const tLand = tFly + flyDur;

  // 进度量：框带着内容平移放大到右侧定居
  const pT = power2InOut(clamp01((t - tFly) / flyDur));
  const currentZoom = lerp(1, zoom, pT);
  const w = lerp(w0, boxW, pT);
  const h = lerp(h0, boxH, pT);
  const cx = lerp(faceX, targetX, pT);
  const cy = lerp(faceY, targetY, pT);
  const r = lerp(radius0, radius1, pT);

  // 取景框浮现
  const showP = power2Out(clamp01((t - startDelay) / showDur));
  const shellOpacity = showP;
  const shellScale = lerp(0.9, 1, showP);

  // 细边框在后半程退场，白边卡 + 投影在落位时立住
  const hairOpacity = 1 - power1In(clamp01((t - (tFly + flyDur * 0.6)) / 0.22));
  const cardOpacity = power2Out(clamp01((t - (tLand - 0.06)) / 0.18));

  // 箭头从人物一侧指向画中画
  const tArrow = tLand + arrowAt;
  const arrowStemP = power2Out(clamp01((t - tArrow) / arrowDur));
  const arrowHeadP = power2Out(clamp01((t - (tArrow + 0.12)) / 0.10));

  const arrowLen = 138 * scale;
  const headLen = 19 * scale;

  return (
    <AbsoluteFill style={{background: theme.background, overflow: 'hidden'}}>
      {/* 底层画面 */}
      <AbsoluteFill style={{overflow: 'hidden'}}>
        {children}
      </AbsoluteFill>

      {/* 画中画变换组 */}
      <div style={{
        position: 'absolute',
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        zIndex: 10,
        opacity: shellOpacity,
        transform: `scale(${shellScale})`,
        borderRadius: r,
        willChange: 'left, top, width, height',
      }}>
        {/* 取景窗（裁剪层） */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: r,
          overflow: 'hidden',
          background: theme.background,
        }}>
          {/* 框内画面副本（反向补偿，精准锁定锚点） */}
          <div style={{
            position: 'absolute',
            left: -(faceX * currentZoom - w / 2),
            top: -(faceY * currentZoom - h / 2),
            width: 960 * scale * currentZoom,
            height: 540 * scale * currentZoom,
            transformOrigin: '0 0',
          }}>
            {children}
          </div>
        </div>

        {/* 细描边取景框 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: r,
          boxShadow: `0 0 0 2px ${theme.accent}`,
          opacity: hairOpacity,
          pointerEvents: 'none',
        }} />

        {/* 定居白边卡与全剧投影 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: r,
          boxShadow: `0 0 0 6px ${theme.foreground}, 0 16px 50px rgba(0, 0, 0, 0.6)`,
          opacity: cardOpacity,
          pointerEvents: 'none',
        }} />
      </div>

      {/* 指向箭头 */}
      <svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 9, pointerEvents: 'none'}}>
        <path
          d={`M ${450 * scale} ${270 * scale} C ${510 * scale} ${265 * scale}, ${570 * scale} ${267 * scale}, ${605 * scale} ${270 * scale}`}
          fill="none"
          stroke={theme.accent}
          strokeWidth={3 * scale}
          strokeLinecap="round"
          strokeDasharray={arrowLen}
          strokeDashoffset={arrowLen * (1 - arrowStemP)}
        />
        <path
          d={`M ${(605 - 12) * scale} ${(270 - 7) * scale} L ${605 * scale} ${270 * scale} L ${(605 - 12) * scale} ${(270 + 7) * scale}`}
          fill="none"
          stroke={theme.accent}
          strokeWidth={3 * scale}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={headLen}
          strokeDashoffset={headLen * (1 - arrowHeadP)}
        />
      </svg>
    </AbsoluteFill>
  );
};
