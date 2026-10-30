import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {lerp, linear, power1Out, power2InOut, power3Out, power4In, power4InOut, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type ChapterTitleProps = {
  num: string;
  name: string;
  sub?: string;
  /** 本章线稿 motif（200×200 viewBox 的 path d 列表），不传用默认弧线 */
  motif?: string[];
  /** 卡面底色/字色/强调色；不传由主题派生（卡面 = 前景色，字 = 背景色） */
  colors?: {bg: string; ink: string; accent: string};
  theme: Theme;
  durationInFrames: number;
};

const CONFIG = {
  lead: 0.15,       // 起手：给上一镜一口呼吸
  wipeIn: 0.3,      // 色块扫入盖屏 s（power4.inOut）
  numIn: 0.4,       // 编号落位 s（scale 1.3→1）
  nameIn: 0.35,     // 章节名遮罩揭示 s
  subDelay: 0.1,    // 小字比章节名再晚一拍
  hold: 1.2,        // 停留 s（带极缓漂移防呆滞），随镜头时长伸缩
  driftPx: 10,      // hold 期间整组横向漂移量 px
  wipeOut: 0.3,     // 色块继续向右扫出 s
  motifIn: 0.5,     // 主题 motif 描画 s（色块盖屏后 +0.05 起）
  motifOpacity: 0.14, // motif 不透明度：是纹样不是图标，不能抢编号
  motifParallax: 0.6, // motif 漂移 = 文字组漂移 × 0.6（背景更慢 = 深度）
  ruleIn: 0.25,     // 章节名下 accent 短线 scaleX 0→1 s
};

const DEFAULT_MOTIF = [
  'M 20 170 C 60 160, 90 120, 120 70 S 165 30, 185 24',
  'M 130 60 a 34 34 0 1 0 0.1 0',
];

export const ChapterTitle: React.FC<ChapterTitleProps> = ({num, name, sub, motif = DEFAULT_MOTIF, colors, theme, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;
  const duration = durationInFrames / fps;
  const card = {bg: colors?.bg ?? theme.foreground, ink: colors?.ink ?? theme.background, accent: colors?.accent ?? theme.accent};

  // 停留段伸缩：固定节拍之外的时间都进 hold
  const hold = Math.max(CONFIG.hold, duration - CONFIG.lead - CONFIG.wipeIn - CONFIG.numIn - CONFIG.nameIn - CONFIG.wipeOut - 0.1);
  const at = CONFIG.lead;
  const outAt = at + CONFIG.wipeIn + CONFIG.numIn + CONFIG.nameIn + hold;

  // 色块扫入 → 同向扫出
  const inProgress = tween(t, at, CONFIG.wipeIn, power4InOut);
  const outProgress = tween(t, outAt, CONFIG.wipeOut, power4In);
  const xPercent = t < outAt ? lerp(-100, 0, inProgress) : lerp(0, 100, outProgress);

  // motif：色块盖屏后立即描画（背景层，不参与文字错峰），各段接力
  const motifAt = at + CONFIG.wipeIn + 0.05;
  const motifSeg = CONFIG.motifIn / motif.length;
  // 编号先落位——先立骨架再上名字，层次不塌
  const numProgress = tween(t, at + CONFIG.wipeIn, CONFIG.numIn, power3Out);
  // 章节名从编号旁遮罩揭示
  const nameProgress = tween(t, at + CONFIG.wipeIn + 0.18, CONFIG.nameIn, power3Out);
  // accent 短线：名字揭示完后长出
  const ruleProgress = tween(t, at + CONFIG.wipeIn + 0.18 + CONFIG.nameIn, CONFIG.ruleIn, power3Out);
  // 小字再晚一拍
  const subProgress = tween(t, at + CONFIG.wipeIn + 0.18 + CONFIG.subDelay, 0.3, power1Out);
  // hold：整组极缓漂移防"卡帧感"；motif 慢 0.6×
  const drift = CONFIG.driftPx * scale * tween(t, at + CONFIG.wipeIn, hold + 0.5, linear);

  return (
    <AbsoluteFill style={{background: theme.background, fontFamily: theme.fontFamily, overflow: 'hidden'}}>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 34 * scale, overflow: 'hidden', background: card.bg, color: card.ink,
        transform: `translateX(${xPercent}%)`,
      }}>
        <svg viewBox="0 0 200 200" style={{
          position: 'absolute', right: '3%', top: '60%', width: 240 * scale, height: 240 * scale,
          fill: 'none', stroke: card.ink, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round',
          opacity: CONFIG.motifOpacity, transform: `translateX(${drift * CONFIG.motifParallax}px)`,
        }}>
          {motif.map((d, index) => (
            <path key={index} d={d} pathLength={1} strokeDasharray="1 1"
              strokeDashoffset={1 - tween(t, motifAt + index * motifSeg, motifSeg, power2InOut)} />
          ))}
        </svg>
        <div style={{
          fontFamily: 'Georgia, "Songti SC", serif', fontSize: 216 * scale, fontWeight: 700, lineHeight: 1,
          position: 'relative', opacity: numProgress,
          transform: `translate(${drift}px, 0px) scale(${lerp(1.3, 1, numProgress)})`,
        }}>{num}</div>
        <div style={{transform: `translateX(${drift}px)`, position: 'relative'}}>
          <div style={{overflow: 'hidden'}}>
            <div style={{fontSize: 44 * scale, fontWeight: 700, letterSpacing: 4 * scale, clipPath: `inset(0 ${lerp(100, 0, nameProgress)}% 0 0)`}}>
              {name}
            </div>
          </div>
          <div style={{width: 72 * scale, height: 3 * scale, marginTop: 12 * scale, background: card.accent, transformOrigin: 'left center', transform: `scaleX(${ruleProgress})`}} />
          {sub ? (
            <div style={{marginTop: 12 * scale, fontSize: 15 * scale, letterSpacing: 6 * scale, opacity: 0.6 * subProgress, transform: `translateX(${lerp(-14 * scale, 0, subProgress)}px)`}}>{sub}</div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
