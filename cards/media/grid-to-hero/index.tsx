import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, useCurrentFrame, useVideoConfig} from 'remotion';
import {lerp, power2In, power2InOut, power3InOut, power3Out, tween} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type GridToHeroProps = {
  /** 四格压图标签 */
  labels: string[];
  /** 四格真素材（图片 → Img，.mp4/.webm/.mov → OffthreadVideo）；不传用渐变占位 */
  srcs?: string[];
  /** 哪一格成为主角（0 起） */
  heroIdx?: number;
  theme: Theme;
  durationInFrames: number;
};

// 命门：① 网格先并列（错峰落位，不是一起淡入）② 主图长大与其余收缩走同一条 inOut、同一时刻起止
//      ③ 其余不消失——收成等大等距的一列（保留"是从这几个里选的"）④ 讲完回到网格再退场（首尾对称）
const CONFIG = {
  lead: 0.3,          // 起手：第一格开始落位
  stagger: 0.12,      // 网格错峰（每格）
  enterDur: 0.55,     // 单格落位（y 24→0 + scale .97→1，power3.out）
  holdGrid: 1.2,      // 网格停留（成片 = 口播念完"几个候选"）
  reflow: 0.8,        // 重排时长（power3.inOut；长大与收缩同一条曲线）
  holdHero: 2.0,      // 主图停留（成片 = 讲这一格的句长）
  holdBack: 0.8,      // 回到网格后的停留
  heroPush: 1.05,     // 主图内部缓推终值（重排起 → 回网格止，速率恒定）
  exit: 0.4,          // 一起退场（power2.in）
  exitStagger: 0.04,  // 退场错峰
  // 几何（960×540 基准，四边 48 安全边、间距 24），渲染时按 width 缩放
  grid: [{x: 48, y: 48}, {x: 492, y: 48}, {x: 48, y: 282}, {x: 492, y: 282}],
  tile: {w: 420, h: 210},
  hero: {x: 48, y: 48, w: 620, h: 444},                 // 主图占 65% 宽
  col: {x: 692, w: 220, h: 132, gap: 24},               // 右侧一列：等大等距，列顶与主图顶对齐
};

type Rect = {x: number; y: number; w: number; h: number};
const lerpRect = (a: Rect, b: Rect, p: number): Rect => ({x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p)});
const scaleRect = (r: Rect, s: number): Rect => ({x: r.x * s, y: r.y * s, w: r.w * s, h: r.h * s});
const linear = (x: number): number => x;
const isVideo = (src: string): boolean => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(src);

const GLYPH = (
  <svg viewBox="0 0 48 40" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" style={{position: 'absolute', left: '50%', top: '50%', width: 56, height: 48, transform: 'translate(-50%, -56%)', opacity: 0.35}}>
    <rect x="2" y="2" width="44" height="36" rx="4" /><circle cx="16" cy="14" r="4" /><path d="M4 34 L18 22 L27 30 L34 24 L44 34" />
  </svg>
);
const TONES = ['linear-gradient(160deg, #a4b0c6, #7d8aa3)', 'linear-gradient(160deg, #bfa5ae, #957c86)', 'linear-gradient(160deg, #9fb9ae, #789389)', 'linear-gradient(160deg, #c2b39a, #9c8f78)'];

export const GridToHero: React.FC<GridToHeroProps> = ({labels, srcs, heroIdx = 2, theme}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;
  const C = CONFIG;
  const N = C.grid.length;
  const hero = Math.max(0, Math.min(N - 1, Math.round(heroIdx)));

  const T1 = C.lead + C.enterDur + C.stagger * (N - 1) + C.holdGrid;   // 重排起点
  const T2 = T1 + C.reflow + C.holdHero;                                // 回网格起点
  const T_OUT = T2 + C.reflow + C.holdBack;                             // 退场起点

  const gridRect = (i: number): Rect => scaleRect({x: C.grid[i].x, y: C.grid[i].y, w: C.tile.w, h: C.tile.h}, scale);
  // 重排目标：主角 → 主图；其余按原顺序收成右侧一列
  const target = (i: number): Rect => {
    if (i === hero) return scaleRect(C.hero, scale);
    const k = i < hero ? i : i - 1;
    return scaleRect({x: C.col.x, y: C.hero.y + k * (C.col.h + C.col.gap), w: C.col.w, h: C.col.h}, scale);
  };
  const p1 = tween(t, T1, C.reflow, power3InOut);
  const p2 = tween(t, T2, C.reflow, power3InOut);
  // 主图内部缓推：T1 起匀速推到终值，T2 起收回
  const heroPush = lerp(lerp(1, C.heroPush, tween(t, T1, C.reflow + C.holdHero, linear)), 1, tween(t, T2, C.reflow, power2InOut));

  return (
    <AbsoluteFill style={{background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily, overflow: 'hidden'}}>
      {C.grid.map((_, i) => {
        const g = gridRect(i);
        const r = lerpRect(lerpRect(g, target(i), p1), g, p2);           // 网格 → 目标 → 网格（两段不重叠，顺序 lerp）
        const e = tween(t, C.lead + i * C.stagger, C.enterDur, power3Out); // 落位：y 24→0 + scale .97→1
        const opacity = e * (1 - tween(t, T_OUT + i * C.exitStagger, C.exit, power2In));
        const src = srcs?.[i];
        const fill: React.CSSProperties = {position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'};
        return (
          <div key={i} style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: r.w,
            height: r.h,
            background: theme.background,
            padding: 8 * scale,
            borderRadius: 12 * scale,
            boxShadow: '0 12px 40px rgba(0,0,0,.3)',
            opacity,
            zIndex: i === hero ? 2 : 1,
            transform: `translate(${r.x}px, ${r.y + lerp(24 * scale, 0, e)}px) scale(${lerp(0.97, 1, e)})`,
            transformOrigin: '50% 50%',
          }}>
            <div style={{position: 'absolute', inset: 8 * scale, borderRadius: 6 * scale, overflow: 'hidden'}}>
              <div style={{position: 'absolute', inset: 0, background: TONES[i % TONES.length], transform: `scale(${i === hero ? heroPush : 1})`, transformOrigin: '50% 50%'}}>
                {src ? (isVideo(src) ? <OffthreadVideo src={src} muted style={fill} /> : <Img src={src} style={fill} />) : GLYPH}
              </div>
            </div>
            <div style={{position: 'absolute', left: 20 * scale, bottom: 18 * scale, fontSize: 16 * scale, fontWeight: 600, color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,.7)', whiteSpace: 'nowrap'}}>
              {labels[i]}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
