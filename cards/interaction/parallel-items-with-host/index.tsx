import React from 'react';
import {AbsoluteFill, Img, Loop, OffthreadVideo, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

export const meta = {width: 960, height: 540, fps: 30, durationInFrames: 663};

const FPS = meta.fps;

export type Layout =
  | 'head-row'          // ① 头顶横排卡：人物半身居中，三卡在头顶一行
  | 'band-triptych'     // ② 三横条灰转彩：人物缩成左上小框
  | 'side-column'       // ③ 竖列 + 本人虚化成底：顶部小框头像 + 三横卡竖列（横屏居中）
  | 'stack-shuffle'     // ④ 顶部卡堆翻切：人物缩进下方小框，卡同位一张压一张
  | 'vertical-strips'   // ⑤ 竖切三分 + 人物前景
  | 'diagonal-bands'    // ⑥ 斜切三分 + 正中圆头像
  | 'bg-swap';          // ⑦ 背景轮换 + 大字：三项不同屏

export const LAYOUTS: Layout[] = ['head-row', 'band-triptych', 'side-column', 'stack-shuffle', 'vertical-strips', 'diagonal-bands', 'bg-swap'];

const CONFIG = {
  lead: 0.4,
  gap: 0.6,
  pop: 0.45,
  hold: 0.8,
  exit: 0.35,
  per: 3.1,
  swapGap: 0.75,
  stackRot: [-4, 3, -2],
  stackOff: [[0, 0], [18, 10], [36, 20]] as [number, number][],
};

export const durationFor = (layout: Layout | 'tour'): number =>
  layout === 'tour' ? meta.durationInFrames : Math.round((CONFIG.per + 0.4) * FPS);

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const tw = (t: number, t0: number, d: number, ease: (x: number) => number) => ease(clamp01((t - t0) / d));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const linear = (x: number) => x;
const power1Out = (x: number) => 1 - Math.pow(1 - x, 2);
const power2Out = (x: number) => 1 - Math.pow(1 - x, 3);
const power3Out = (x: number) => 1 - Math.pow(1 - x, 4);
const power2In = (x: number) => x * x * x;
const backOut = (s = 1.70158) => (x: number) => {
  const u = x - 1;
  return 1 + (s + 1) * u * u * u + s * u * u;
};

const DEFAULT_ITEMS: Record<Layout, [string, string, string]> = {
  'head-row': ['喝咖啡', '读书', '拍照'],
  'band-triptych': ['山', '海', '城'],
  'side-column': ['① 一杯咖啡', '② 清空桌面', '③ 手机静音'],
  'stack-shuffle': ['第一步 · 拍', '第二步 · 剪', '第三步 · 发'],
  'vertical-strips': ['峡湾', '雪山', '海岸'],
  'diagonal-bands': ['露营', '冲浪', '徒步'],
  'bg-swap': ['芝加哥', '旧金山', '纽约'],
};

const TAGS: Record<Layout, string> = {
  'head-row': '① 头顶横排卡 · head-row',
  'band-triptych': '② 三横条灰转彩 · band-triptych',
  'side-column': '③ 竖列 + 本人虚化成底 · side-column',
  'stack-shuffle': '④ 顶部卡堆翻切 · stack-shuffle',
  'vertical-strips': '⑤ 竖切三分 + 人物前景 · vertical-strips',
  'diagonal-bands': '⑥ 斜切三分 + 圆头像 · diagonal-bands',
  'bg-swap': '⑦ 背景轮换 + 大字 · bg-swap',
};

const CSS = `
.piwh-ph { position: absolute; overflow: hidden; }
.piwh-ph::before { content: ""; position: absolute; inset: 0; }
.piwh-ph.t1::before { background: linear-gradient(160deg, #a4b0c6, #7d8aa3); }
.piwh-ph.t2::before { background: linear-gradient(160deg, #bfa5ae, #957c86); }
.piwh-ph.t3::before { background: linear-gradient(160deg, #9fb9ae, #789389); }
.piwh-ph svg { position: absolute; left: 50%; top: 50%; width: 56px; height: 48px; transform: translate(-50%, -56%); opacity: .35; }
.piwh-card .piwh-ph svg { width: 34px; height: 29px; }
.piwh-card { position: absolute; background: #ffffff; padding: 6px; border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,.16); }
.piwh-card .piwh-ph { position: absolute; inset: 6px; border-radius: 8px; }
.piwh-lb { position: absolute; color: #ffffff; font-weight: 700; letter-spacing: 2px; text-shadow: 0 1px 3px rgba(0,0,0,.6); white-space: nowrap; }
.piwh-card .piwh-lb { left: 0; right: 0; bottom: 14px; text-align: center; font-size: 26px; }
.piwh-box { position: absolute; overflow: hidden; border-radius: 16px; background: #e9e9ee; border: 3px solid #ffffff; box-shadow: 0 12px 40px rgba(0,0,0,.18); }
.piwh-avatar { position: absolute; overflow: hidden; border-radius: 50%; background: #e9e9ee; border: 4px solid #ffffff; box-shadow: 0 8px 30px rgba(0,0,0,.2); }
.piwh-tag { position: absolute; left: 20px; bottom: 16px; z-index: 9; font-size: 12px; letter-spacing: 1px; color: #8a8a8a; background: rgba(255,255,255,.82); padding: 3px 10px; border-radius: 999px; }
`;

const GLYPH = (
  <svg viewBox="0 0 48 40" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round">
    <rect x="2" y="2" width="44" height="36" rx="4" /><circle cx="16" cy="14" r="4" /><path d="M4 34 L18 22 L27 30 L34 24 L44 34" />
  </svg>
);

const Ph: React.FC<{tone: 1 | 2 | 3; src?: string; style?: React.CSSProperties; extraStyle?: React.CSSProperties}> = ({tone, src, style, extraStyle}) => (
  <div className={`piwh-ph t${tone}`} style={{...style, ...extraStyle}}>
    {src ? <Img src={src} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} /> : GLYPH}
  </div>
);

const Host: React.FC<{src?: string; mode: 'full' | 'box' | 'avatar'; blur?: boolean}> = ({src, mode, blur}) => {
  if (mode === 'full') {
    return src ? (
      <Loop durationInFrames={13 * FPS}>
        <OffthreadVideo src={src} muted transparent style={{
          position: 'absolute', bottom: blur ? '-12%' : 0, left: '50%', transform: 'translateX(-50%)', height: blur ? '130%' : '88%',
          filter: blur ? 'blur(18px) brightness(.55)' : undefined,
        }} />
      </Loop>
    ) : (
      <div style={{
        position: 'absolute', left: '29%', right: '29%', bottom: 0, height: '78%', filter: blur ? 'blur(18px) brightness(.55)' : undefined,
        background: 'radial-gradient(ellipse 46% 26% at 50% 13%, #e3e3e6 60%, transparent 61%), radial-gradient(ellipse 50% 62% at 50% 84%, #ececef 60%, transparent 61%)',
      }} />
    );
  }
  const pos = mode === 'avatar' ? '50% 12%' : '50% 8%';
  const xf = mode === 'avatar' ? 'scale(1.35)' : 'none';
  return src ? (
    <Loop durationInFrames={13 * FPS}>
      <OffthreadVideo src={src} muted transparent style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, transform: xf, transformOrigin: '50% 20%'}} />
    </Loop>
  ) : (
    <div style={{
      position: 'absolute', left: '-10%', right: '-10%', bottom: '-10%', height: '120%',
      background: 'radial-gradient(ellipse 46% 26% at 50% 13%, #e3e3e6 60%, transparent 61%), radial-gradient(ellipse 50% 62% at 50% 84%, #ececef 60%, transparent 61%)',
    }} />
  );
};

export type ParallelItemsWithHostProps = {
  layout?: Layout | 'tour';
  items?: string[];
  srcs?: string[];
  hostSrc?: string;
  theme?: Theme;
  durationInFrames?: number;
};

export const ParallelItemsWithHost: React.FC<ParallelItemsWithHostProps> = ({
  layout = 'tour',
  items,
  srcs,
  hostSrc,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 960, height / 540);
  const t = frame / FPS;
  const tour = layout === 'tour';

  const k = tour ? Math.min(LAYOUTS.length - 1, Math.floor(t / CONFIG.per)) : Math.max(0, LAYOUTS.indexOf(layout as Layout));
  const cur = LAYOUTS[k];
  const lt = tour ? t - k * CONFIG.per : t;
  const labels = (items && items.length >= 3 ? items : DEFAULT_ITEMS[cur]) as string[];
  const src = (i: number) => (srcs && srcs[i]) || undefined;

  const t1 = CONFIG.lead, tOut = CONFIG.per - CONFIG.exit - 0.05;
  const popP = (i: number, dur = CONFIG.pop, ease: (x: number) => number = backOut(1.7)) => tw(lt, t1 + i * CONFIG.gap, dur, ease);
  const exitK = (i: number) => 1 - tw(lt, tOut + i * 0.04, CONFIG.exit, power2In);
  const tagOp = Math.min(tw(lt, 0.05, 0.2, power1Out), 1 - tw(lt, CONFIG.per - 0.25, 0.2, power1Out));

  let body: React.ReactNode = null;
  switch (cur) {
    case 'head-row': {
      body = (
        <>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: -22, height: 410}}><Host src={hostSrc} mode="full" /></div>
          {[156, 380, 604].map((x, i) => {
            const p = popP(i);
            return (
              <div key={i} className="piwh-card" style={{
                left: x, top: 48, width: 200, height: 124, opacity: clamp01(p) * exitK(i),
                transform: `translateY(${lerp(14, 0, p)}px) scale(${lerp(0.8, 1, p)})`,
              }}>
                <Ph tone={(i + 1) as 1 | 2 | 3} src={src(i)} /><div className="piwh-lb">{labels[i]}</div>
              </div>
            );
          })}
        </>
      );
      break;
    }
    case 'band-triptych': {
      const s = tw(lt, 0.1, 0.4, power3Out);
      body = (
        <>
          {[0, 180, 360].map((y, i) => {
            const g = popP(i, 0.45, power2Out), g2 = popP(i, 0.4, power3Out);
            return (
              <div key={i} style={{position: 'absolute', left: 0, top: y, width: 960, height: 180, opacity: exitK(i)}}>
                <Ph tone={(i + 1) as 1 | 2 | 3} src={src(i)} style={{inset: 0}} extraStyle={{filter: `grayscale(${1 - g}) brightness(${lerp(0.55, 1, g)})`}} />
                <div className="piwh-lb" style={{right: 60, top: '50%', fontSize: 40, letterSpacing: 4, opacity: g2, transform: `translate(${lerp(40, 0, g2)}px, -50%)`}}>{labels[i]}</div>
              </div>
            );
          })}
          <div className="piwh-box" data-crop-ok style={{left: 40, top: 40, width: 120, height: 130, opacity: s * exitK(3), transform: `scale(${lerp(0.9, 1, s)})`}}><Host src={hostSrc} mode="box" /></div>
        </>
      );
      break;
    }
    case 'side-column': {
      const s = tw(lt, 0.1, 0.4, power3Out);
      body = (
        <>
          <div data-crop-ok style={{position: 'absolute', inset: 0, background: '#dfe1e6', overflow: 'hidden'}}><Host src={hostSrc} mode="full" blur /></div>
          <div className="piwh-box" data-crop-ok style={{left: 420, top: 26, width: 120, height: 126, borderRadius: 26, opacity: s * exitK(3), transform: `translateY(${lerp(-12, 0, s)}px)`}}><Host src={hostSrc} mode="box" /></div>
          {[176, 290, 404].map((y, i) => {
            const p = popP(i);
            return (
              <div key={i} className="piwh-card" style={{left: 330, top: y, width: 300, height: 96, opacity: clamp01(p) * exitK(i), transform: `translateX(${lerp(60, 0, p)}px)`}}>
                <Ph tone={(i + 1) as 1 | 2 | 3} src={src(i)} /><div className="piwh-lb">{labels[i]}</div>
              </div>
            );
          })}
        </>
      );
      break;
    }
    case 'stack-shuffle': {
      const s = tw(lt, 0.1, 0.4, power3Out);
      body = (
        <>
          {CONFIG.stackOff.map(([ox, oy], i) => {
            const q = popP(i, 0.5, power3Out), r = CONFIG.stackRot[i];
            return (
              <div key={i} className="piwh-card" style={{
                left: 300, top: 36, width: 340, height: 210, opacity: q * exitK(i),
                transform: `translate(${lerp(120 + ox, ox, q)}px, ${lerp(oy - 10, oy, q)}px) rotate(${lerp(r + 6, r, q)}deg)`,
              }}>
                <Ph tone={(i + 1) as 1 | 2 | 3} src={src(i)} /><div className="piwh-lb">{labels[i]}</div>
              </div>
            );
          })}
          <div className="piwh-box" data-crop-ok style={{left: 390, top: 286, width: 180, height: 220, opacity: s * exitK(3), transform: `translateY(${lerp(10, 0, s)}px)`}}><Host src={hostSrc} mode="box" /></div>
        </>
      );
      break;
    }
    case 'vertical-strips': {
      body = (
        <>
          {[0, 320, 640].map((x, i) => {
            const w = popP(i, 0.5, power3Out);
            return (
              <div key={i} style={{position: 'absolute', left: x, top: 0, width: 320, height: 540, opacity: exitK(i), clipPath: `inset(0 ${(1 - w) * 100}% 0 0)`}}>
                <Ph tone={(i + 1) as 1 | 2 | 3} src={src(i)} style={{inset: 0}} />
                <div className="piwh-lb" style={{left: 0, right: 0, top: 40, textAlign: 'center', fontSize: 36, letterSpacing: 3}}>{labels[i]}</div>
              </div>
            );
          })}
          <div style={{position: 'absolute', left: 0, right: 0, bottom: -30, height: 455}}><Host src={hostSrc} mode="full" /></div>
        </>
      );
      break;
    }
    case 'diagonal-bands': {
      const a = tw(lt, 0.6, 0.45, backOut(1.6));
      const polys = ['polygon(-260px 0, 120px 0, 380px 540px, 0 540px)', 'polygon(120px 0, 500px 0, 760px 540px, 380px 540px)', 'polygon(500px 0, 960px 0, 960px 540px, 760px 540px)'];
      const lbPos = [{left: 70, top: 80}, {left: 300, top: 52}, {left: 790, top: 400}];
      body = (
        <>
          {polys.map((cp, i) => {
            const q = popP(i, 0.5, power3Out);
            return (
              <div key={i} style={{position: 'absolute', inset: 0, clipPath: cp, opacity: q * exitK(i), transform: `translate(${lerp(-140, 0, q)}px, ${lerp(-70, 0, q)}px)`}}>
                <Ph tone={(i + 1) as 1 | 2 | 3} src={src(i)} style={{inset: 0}} />
                <div className="piwh-lb" style={{...lbPos[i], fontSize: 38, letterSpacing: 4}}>{labels[i]}</div>
              </div>
            );
          })}
          <div className="piwh-avatar" data-crop-ok style={{left: 395, top: 185, width: 170, height: 170, opacity: clamp01(a) * exitK(3), transform: `scale(${lerp(0.6, 1, a)})`}}><Host src={hostSrc} mode="avatar" /></div>
        </>
      );
      break;
    }
    case 'bg-swap': {
      const at = (i: number) => t1 + i * CONFIG.swapGap;
      body = (
        <>
          {[0, 1, 2].map((i) => {
            const inP = tw(lt, at(i), 0.3, power1Out), sc = lerp(1.04, 1, tw(lt, at(i), 0.9, linear));
            const outP = i < 2 ? tw(lt, at(i + 1) + 0.05, 0.3, power1Out) : 0;
            const op = inP * (1 - outP) * (i === 2 ? exitK(0) : 1);
            return (
              <div key={i} style={{position: 'absolute', inset: 0, opacity: op, transform: `scale(${sc})`, transformOrigin: '50% 50%'}}>
                <Ph tone={(i + 1) as 1 | 2 | 3} src={src(i)} style={{inset: 0}} />
              </div>
            );
          })}
          <div style={{position: 'absolute', inset: 0, opacity: exitK(2), background: 'linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,0) 45%)'}} />
          {[0, 1, 2].map((i) => {
            const w = tw(lt, at(i) + 0.05, 0.4, power3Out);
            const wo = i < 2 ? tw(lt, at(i + 1) - 0.1, 0.3, power2In) : 0;
            return (
              <div key={i} style={{
                position: 'absolute', left: 0, right: 0, top: 60, textAlign: 'center', fontSize: 84, fontWeight: 800, color: '#fff', letterSpacing: 6,
                textShadow: '0 4px 18px rgba(0,0,0,.5)', opacity: w * (1 - wo) * (i === 2 ? exitK(1) : 1), transform: `translateY(${lerp(20, 0, w) - 14 * wo}px)`,
              }}>{labels[i]}</div>
            );
          })}
          <div style={{position: 'absolute', left: 0, right: 0, bottom: -32, height: 477}}><Host src={hostSrc} mode="full" /></div>
        </>
      );
      break;
    }
  }

  return (
    <AbsoluteFill style={{background: '#ffffff', color: '#1d1d1f', overflow: 'hidden', fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'}}>
      <div style={{
        width: 960,
        height: 540,
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: '50% 50%',
      }}>
        <style>{CSS}</style>
        {body}
        {tour && <div className="piwh-tag" style={{opacity: tagOp}}>{TAGS[cur]}</div>}
      </div>
    </AbsoluteFill>
  );
};
