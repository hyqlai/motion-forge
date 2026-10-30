import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {camEase, clamp01, lerp} from '../../../core/motion';

export type SlowPushProps = {
  children: React.ReactNode;
  durationInFrames: number;
  zoomTo?: number;
  originX?: number;
  originY?: number;
  driftX?: number;
  driftY?: number;
  endRate?: number;
  pushDur?: number;
  holdDur?: number;
};

// 与来源 slow-push-in 同一条曲线：camEase 主推（末速非零）→ hold 期按末速匀速续推，
// 全程镜头永不停死；transform-origin 咬在兴趣点上，漂移把兴趣点向画心让
export const SlowPush: React.FC<SlowPushProps> = ({
  children,
  durationInFrames,
  zoomTo = 1.1,
  originX = 50,
  originY = 50,
  driftX = -13,
  driftY = -7,
  endRate = 0.6,
  pushDur,
  holdDur,
}) => {
  const frame = useCurrentFrame();
  // 支持从 timingParams 传入秒数覆盖；若未传入则按默认 4.2:1.6 比例换算
  const ratio = (pushDur && holdDur) ? pushDur / (pushDur + holdDur) : (4.2 / 5.8);
  const pushFrames = durationInFrames * ratio;
  const holdFrames = durationInFrames - pushFrames;
  const rate = ((zoomTo - 1) / pushFrames) * endRate;
  const holdZoom = zoomTo + rate * holdFrames;
  const kd = 1 + (holdZoom - zoomTo) / (zoomTo - 1);

  let zoom: number;
  let x: number;
  let y: number;
  if (frame < pushFrames) {
    const progress = camEase(endRate)(clamp01(frame / pushFrames));
    zoom = lerp(1, zoomTo, progress);
    x = lerp(0, driftX, progress);
    y = lerp(0, driftY, progress);
  } else {
    const progress = clamp01((frame - pushFrames) / holdFrames);
    zoom = lerp(zoomTo, holdZoom, progress);
    x = lerp(driftX, driftX * kd, progress);
    y = lerp(driftY, driftY * kd, progress);
  }

  // 运镜只改变外层相机，不读取也不修改业务内容。
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{
        transform: `translate(${x}px, ${y}px) scale(${zoom})`,
        transformOrigin: `${originX}% ${originY}%`,
      }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
