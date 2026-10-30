import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power1Out, power2In, power2Out, power3In} from '../../../core/motion';

export type CrashZoomPunchProps = {
  children: React.ReactNode;
  durationInFrames: number;
};

function camTo(z: number, px: number, py: number, W: number, H: number) {
  let x = W / 2 - z * px;
  let y = H / 2 - z * py;
  x = Math.min(0, Math.max(W - W * z, x));
  y = Math.min(0, Math.max(H - H * z, y));
  return {scale: z, x, y};
}

export const CrashZoomPunch: React.FC<CrashZoomPunchProps> = ({children}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const targetPt = {x: 480 * scale, y: 270 * scale};

  const hold = 1.0;
  const punch = 0.2;
  const zoom = 2.3;
  const settle = 2.2;
  const settleDur = 0.17;
  const blurMax = 5 * scale;
  const exitAt = 4.0;

  const camStart = camTo(1, targetPt.x, targetPt.y, width, height);
  const camPeak = camTo(zoom, targetPt.x, targetPt.y, width, height);
  const camSettle = camTo(settle, targetPt.x, targetPt.y, width, height);

  let curCam = camStart;
  let blur = 0;

  if (t < hold) {
    curCam = camStart;
    blur = 0;
  } else if (t < hold + punch) {
    const p = power3In(clamp01((t - hold) / punch));
    curCam = {
      scale: lerp(camStart.scale, camPeak.scale, p),
      x: lerp(camStart.x, camPeak.x, p),
      y: lerp(camStart.y, camPeak.y, p),
    };
    blur = blurMax * (1 - Math.abs(p - 0.5) * 2);
  } else if (t < hold + punch + settleDur) {
    const p = power2Out(clamp01((t - (hold + punch)) / settleDur));
    curCam = {
      scale: lerp(camPeak.scale, camSettle.scale, p),
      x: lerp(camPeak.x, camSettle.x, p),
      y: lerp(camPeak.y, camSettle.y, p),
    };
    blur = 0;
  } else {
    curCam = camSettle;
    blur = 0;
  }

  const exitK = 1 - power2In(clamp01((t - exitAt) / 0.4));

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div style={{
        position: 'absolute',
        inset: 0,
        transformOrigin: '0 0',
        transform: `translate(${curCam.x}px, ${curCam.y}px) scale(${curCam.scale})`,
        filter: blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : 'none',
        opacity: exitK,
        willChange: 'transform, filter',
      }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
