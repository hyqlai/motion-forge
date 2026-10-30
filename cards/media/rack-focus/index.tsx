import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame, useVideoConfig} from 'remotion';
import {lerp, power2In, power2InOut, power3Out, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type RackFocusProps = {
  /** 两张标签 [前张, 后张] */
  labels: [string, string];
  /** 两张真图 [前张, 后张]；不传用渐变占位 */
  srcs?: [string | undefined, string | undefined];
  theme: Theme;
  durationInFrames: number;
};

// 命门：① 两张永远一清一糊（同时清晰就没有"焦点"）；② 被糊的那张仍在原位不退场；
//      ③ 转移 power2.inOut（清晰 ↔ blur 8 / brightness .6，scale 1.02 ↔ .97 同步）；④ 两次转移之间留够阅读时间
const CONFIG = {
  softBlur: 8,           // 失焦模糊 px
  softBright: 0.6,       // 失焦压暗（配合模糊把注意力让出去）
  sharpScale: 1.02,      // 在焦那张微放
  softScale: 0.97,       // 失焦那张微缩（两张 5% 的尺寸差 = 前后景深感）
  shift: 0.7,            // 焦点转移时长 s（power2.inOut）
  focusAt: [2.0, 4.6],   // 两次转移时刻：前→后、后→前
  enterAt: 0.2,          // 两张入场起点 s（后张先、前张 +0.08）
  exitDur: 0.4,          // 两张同收时长
};

const GLYPH = (
  <svg viewBox="0 0 48 40" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" style={{position: 'absolute', left: '50%', top: '50%', width: 56, height: 48, transform: 'translate(-50%, -56%)', opacity: 0.35}}>
    <rect x="2" y="2" width="44" height="36" rx="4" /><circle cx="16" cy="14" r="4" /><path d="M4 34 L18 22 L27 30 L34 24 L44 34" />
  </svg>
);

export const RackFocus: React.FC<RackFocusProps> = ({labels, srcs, theme, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;
  const duration = durationInFrames / fps;
  const exitAt = Math.max(CONFIG.focusAt[1] + CONFIG.shift + 1.1, duration - CONFIG.exitDur);

  // f = 焦点在后张的程度（0 = 前张在焦，1 = 后张在焦）
  const focus = tween(t, CONFIG.focusAt[0], CONFIG.shift, power2InOut) - tween(t, CONFIG.focusAt[1], CONFIG.shift, power2InOut);
  const look = (soft: number) => ({
    filter: `blur(${lerp(0, CONFIG.softBlur, soft)}px) brightness(${lerp(1, CONFIG.softBright, soft)})`,
    scale: lerp(CONFIG.sharpScale, CONFIG.softScale, soft),
  });
  const front = look(focus);
  const back = look(1 - focus);

  // 入场（后张先）与同收
  const inBack = tween(t, CONFIG.enterAt, 0.5, power3Out);
  const inFront = tween(t, CONFIG.enterAt + 0.08, 0.5, power3Out);
  const exitProgress = 1 - tween(t, exitAt, CONFIG.exitDur, power2In);

  const photo = (extra: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute',
    background: theme.background,
    padding: 10 * scale,
    borderRadius: 12 * scale,
    boxShadow: '0 12px 60px rgba(0,0,0,.35)',
    willChange: 'transform, filter',
    ...extra,
  });
  const tag = (right: boolean): React.CSSProperties => ({
    position: 'absolute',
    [right ? 'right' : 'left']: 24 * scale,
    bottom: 24 * scale,
    background: `${theme.background}f0`,
    color: theme.foreground,
    fontSize: 20 * scale,
    fontWeight: 700,
    padding: `${6 * scale}px ${14 * scale}px`,
    borderRadius: 8 * scale,
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 16px rgba(0,0,0,.3)',
  });

  return (
    <AbsoluteFill style={{background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily, overflow: 'hidden'}}>
      {/* 后张 */}
      <div style={{...photo({left: 400 * scale, top: 60 * scale, width: 480 * scale, height: 320 * scale}), opacity: inBack * exitProgress, filter: back.filter, transform: `translateY(${lerp(14 * scale, 0, inBack)}px) scale(${back.scale})`, transformOrigin: '50% 50%'}}>
        <div style={{position: 'absolute', inset: 10 * scale, borderRadius: 5 * scale, overflow: 'hidden', background: 'linear-gradient(160deg, #a3a9b8, #7f8594)'}}>
          {srcs?.[1] ? <Img src={srcs[1]} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} /> : GLYPH}
        </div>
        <div style={tag(true)}>{labels[1]}</div>
      </div>
      {/* 前张，压住后张左下一角 */}
      <div style={{...photo({left: 100 * scale, top: 160 * scale, width: 380 * scale, height: 270 * scale}), opacity: inFront * exitProgress, filter: front.filter, transform: `translateY(${lerp(14 * scale, 0, inFront)}px) scale(${front.scale})`, transformOrigin: '50% 50%'}}>
        <div style={{position: 'absolute', inset: 10 * scale, borderRadius: 5 * scale, overflow: 'hidden', background: 'linear-gradient(160deg, #c2b39a, #9c8f78)'}}>
          {srcs?.[0] ? <Img src={srcs[0]} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} /> : GLYPH}
        </div>
        <div style={tag(false)}>{labels[0]}</div>
      </div>
    </AbsoluteFill>
  );
};
