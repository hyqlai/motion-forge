import React from 'react';
import {AbsoluteFill, Loop, OffthreadVideo, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

const CONFIG = {
  accent: '#e62117',
  idle: '#8a8a8a',
  plateOff: '#ffffff',
  plateEdge: '#d2d2d7',
  segFade: 0.3,
  segGap: 0.15,
  segHold: 0.5,
  btnIn: 0.35,
  cursorMove: 0.8,
  clickDip: 0.94,
  bellSwings: [16, -12, 8, -5, 2, 0],
  bellTime: 0.8,
  triStagger: 0.12,
  holdPress: 0.55,
  triStep: 0.2,
  triPop: 1.22,
  checkDraw: 0.36,
  START: {x: 1010, y: 205},
  P_SUB: {x: 433, y: 446.25},
  P_LIKE: {x: 374, y: 416},
  P_FL: {x: 480, y: 451},
};

const B_A = 0.1;
const TC_A = B_A + 0.4 + CONFIG.cursorMove + 0.1;
const END_A = TC_A + 0.25 + CONFIG.bellTime + CONFIG.segHold;
const B_B = END_A + CONFIG.segFade + CONFIG.segGap;
const TP_B = B_B + 0.45 + CONFIG.cursorMove + 0.1;
const T_LIGHT = TP_B + 0.05 + CONFIG.holdPress;
const END_B = T_LIGHT + 2 * CONFIG.triStep + 0.4 + CONFIG.segHold;
const B_C = END_B + CONFIG.segFade + CONFIG.segGap;
const TC_C = B_C + 0.4 + CONFIG.cursorMove + 0.1;
const END_C = TC_C + 0.16 + CONFIG.checkDraw + CONFIG.segHold;
const TOTAL = END_C + CONFIG.segFade;

export const meta = {width: 960, height: 540, fps: 30, durationInFrames: Math.round((TOTAL + 0.4) * 30)};

const FPS = meta.fps;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const tw = (t: number, t0: number, d: number, ease: (x: number) => number) => ease(clamp01((t - t0) / d));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const linear = (x: number) => x;
const power1Out = (x: number) => 1 - Math.pow(1 - x, 2);
const power1InOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const power2Out = (x: number) => 1 - Math.pow(1 - x, 3);
const power2In = (x: number) => x * x * x;
const power3Out = (x: number) => 1 - Math.pow(1 - x, 4);
const power2InOut = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - Math.pow(-2 * x + 2, 3) / 2);
const sineInOut = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;
const backOut = (s: number) => (x: number) => {
  const u = x - 1;
  return 1 + (s + 1) * u * u * u + s * u * u;
};

const hex2rgb = (h: string) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
] as const;

const mix = (a: string, b: string, p: number) => {
  const ca = hex2rgb(a), cb = hex2rgb(b);
  return `rgb(${Math.round(lerp(ca[0], cb[0], p))}, ${Math.round(lerp(ca[1], cb[1], p))}, ${Math.round(lerp(ca[2], cb[2], p))})`;
};

const popIn = (t: number, at: number, dIn: number) => {
  const d1 = dIn * 0.65, d2 = dIn * 0.35;
  return t < at + d1
    ? lerp(0, 1.06, tw(t, at, d1, power3Out))
    : lerp(1.06, 1, tw(t, at + d1, d2, power2Out));
};

const Host: React.FC<{src?: string}> = ({src}) => (
  <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: '#fff'}}>
    {src ? (
      <Loop durationInFrames={13 * FPS}>
        <OffthreadVideo src={src} muted transparent style={{position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', height: '88%'}} />
      </Loop>
    ) : (
      <div style={{width: '42%', height: '78%', background: 'radial-gradient(ellipse 46% 26% at 50% 13%, #e3e3e6 60%, transparent 61%), radial-gradient(ellipse 50% 62% at 50% 84%, #ececef 60%, transparent 61%)'}} />
    )}
  </div>
);

const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
.cta-zone {
  position: absolute;
  left: 0; right: 0;
  bottom: 58px;
  height: 190px;
}
.seg {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.plat {
  font-size: 14px;
  letter-spacing: 2px;
  color: #8a8a8a;
  background: #ffffff;
  border: 1px solid #e6e6e9;
  border-radius: 999px;
  padding: 4px 15px;
}
.row { display: flex; align-items: center; gap: 22px; }
.sub-btn {
  padding: 14px 38px;
  border-radius: 10px;
  background: #e62117;
  color: #fff;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 3px;
}
.sub-btn.done { background: #ececef; color: #8a8a8a; }
.bell {
  position: relative;
  width: 72px; height: 72px;
  border: 1.5px solid #d2d2d7;
  border-radius: 50%;
  background: #ffffff;
  display: flex; align-items: center; justify-content: center;
}
.bell svg { display: block; transform-origin: 50% 8%; }
.bell .rip { inset: -9px; border-color: #1d1d1f; }
.tri-row { display: flex; align-items: flex-start; gap: 34px; }
.tri-item { display: flex; flex-direction: column; align-items: center; }
.plate-wrap { position: relative; width: 72px; height: 72px; }
.plate {
  position: absolute; inset: 0;
  border: 1.5px solid #d2d2d7;
  border-radius: 50%;
  background: #ffffff;
  display: flex; align-items: center; justify-content: center;
}
.glyph { display: block; width: 44px; height: 44px; }
.glyph path, .glyph circle {
  fill: none; stroke: #8a8a8a; stroke-width: 2;
  stroke-linejoin: round; stroke-linecap: round;
}
.tri-label {
  font-size: 12px; color: #8a8a8a; letter-spacing: 1px;
  margin-top: 9px;
  background: #ffffff;
  border-radius: 999px;
  padding: 2px 10px;
}
.hold-ring {
  position: absolute; left: -11px; top: -11px;
  width: 94px; height: 94px;
  transform: rotate(-90deg);
}
.hold-ring circle {
  fill: none; stroke: #e62117; stroke-width: 3; stroke-linecap: round;
  stroke-dasharray: 282.7;
}
.follow-btn {
  position: relative;
  min-width: 196px;
  padding: 13px 40px;
  border-radius: 999px;
  background: #1d1d1f;
  color: #fff;
  font-size: 25px;
  font-weight: 700;
  letter-spacing: 4px;
  text-align: center;
  box-shadow: 0 0 0 3px #ffffff;
}
.follow-btn.done { background: #ececef; color: #8a8a8a; }
.tick {
  position: absolute;
  left: 15px; top: 50%;
  width: 26px; height: 26px;
  margin-top: -13px;
}
.tick path {
  fill: none; stroke: #1d1d1f; stroke-width: 3;
  stroke-linecap: round; stroke-linejoin: round;
  stroke-dasharray: 27;
}
.follow-btn .rip { inset: -8px; border-radius: 999px; border-color: #1d1d1f; }
.rip {
  position: absolute;
  inset: -9px;
  border: 2px solid #e62117;
  border-radius: 50%;
  pointer-events: none;
}
.cursor {
  position: absolute; left: 0; top: 0;
  width: 30px; height: 45px;
  transform-origin: 0% 0%;
  z-index: 20;
  pointer-events: none;
}
`;

type CursorLeg = {setAt: number; target: {x: number; y: number}; downAt: number; upAt: number; outAt: number};

function cursorState(t: number, leg: CursorLeg) {
  const C = CONFIG;
  if (t < leg.setAt || t >= leg.outAt + 0.45) return null;
  const x = t < leg.outAt
    ? lerp(C.START.x, leg.target.x, tw(t, leg.setAt, C.cursorMove, power2InOut))
    : lerp(leg.target.x, leg.target.x + 96, tw(t, leg.outAt, 0.45, power2In));
  const y = t < leg.outAt
    ? lerp(C.START.y, leg.target.y, tw(t, leg.setAt, C.cursorMove, sineInOut))
    : lerp(leg.target.y, leg.target.y + 58, tw(t, leg.outAt, 0.45, power2In));
  const o = 1 - tw(t, leg.outAt, 0.45, power2In);
  const s = t < leg.upAt
    ? lerp(1, 0.9, tw(t, leg.downAt, 0.09, power2Out))
    : lerp(0.9, 1, tw(t, leg.upAt, 0.09, power2Out));
  return {x, y, o, s};
}

export type SubscribeCtaProps = {
  hostSrc?: string;
  theme?: Theme;
  durationInFrames?: number;
};

export const SubscribeCta: React.FC<SubscribeCtaProps> = ({hostSrc}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 960, height / 540);
  const t = frame / FPS;
  const C = CONFIG;

  const segO = (b: number, end: number) =>
    t < end ? tw(t, b, C.segFade, power2Out) : 1 - tw(t, end, C.segFade, power2In);

  const segAO = segO(B_A, END_A);
  const subDone = t >= TC_A + 0.08;
  const subS = t < TC_A
    ? popIn(t, B_A + 0.15, C.btnIn)
    : t < TC_A + 0.08
      ? lerp(1, C.clickDip, tw(t, TC_A, 0.08, power2In))
      : lerp(C.clickDip, 1, tw(t, TC_A + 0.08, 0.2, backOut(3)));

  const bellO = tw(t, TC_A + 0.15, 0.15, power1Out);
  const step = C.bellTime / C.bellSwings.length;
  let bellRot = 0;
  for (let i = 0; i < C.bellSwings.length; i++) {
    const t0 = TC_A + 0.25 + step * i;
    if (t <= t0) break;
    const from = i === 0 ? 0 : C.bellSwings[i - 1];
    bellRot = lerp(from, C.bellSwings[i], tw(t, t0, step, power1InOut));
  }
  const bellRipP = tw(t, TC_A + 0.3, 0.6, power2Out);
  const bellRipOn = t >= TC_A + 0.3;

  const segBO = segO(B_B, END_B);
  const plateS = (i: number) => {
    const inS = popIn(t, B_B + 0.12 + i * C.triStagger, 0.32);
    const lightAt = T_LIGHT + i * C.triStep;
    let s = inS;
    if (i === 0 && t >= TP_B) s = lerp(1, 0.95, tw(t, TP_B, 0.09, power2Out));
    if (t >= lightAt) {
      s = t < lightAt + 0.14
        ? lerp(i === 0 ? 0.95 : 1, C.triPop, tw(t, lightAt, 0.14, power3Out))
        : lerp(C.triPop, 1, tw(t, lightAt + 0.14, 0.26, backOut(2.4)));
    }
    return s;
  };

  const plateLight = (i: number) => tw(t, T_LIGHT + i * C.triStep, 0.16, power2Out);
  const triRipP = (i: number) => tw(t, T_LIGHT + i * C.triStep + 0.04, 0.5, power2Out);
  const triRipOn = (i: number) => t >= T_LIGHT + i * C.triStep + 0.04;
  const ringO = t < T_LIGHT + 0.05
    ? tw(t, TP_B, 0.12, power1Out)
    : 1 - tw(t, T_LIGHT + 0.05, 0.22, power2Out);
  const arcOffset = lerp(282.7, 0, tw(t, TP_B + 0.05, C.holdPress, linear));

  const segCO = segO(B_C, END_C);
  const flDone = t >= TC_C + 0.08;
  const flS = t < TC_C
    ? popIn(t, B_C + 0.15, C.btnIn)
    : t < TC_C + 0.08
      ? lerp(1, C.clickDip, tw(t, TC_C, 0.08, power2In))
      : lerp(C.clickDip, 1, tw(t, TC_C + 0.08, 0.2, backOut(3)));
  const flRipP = tw(t, TC_C + 0.05, 0.5, power2Out);
  const flRipOn = t >= TC_C + 0.05;
  const tickO = tw(t, TC_C + 0.14, 0.1, power1Out);
  const tickOffset = lerp(27, 0, tw(t, TC_C + 0.16, C.checkDraw, power2Out));

  const cur =
    cursorState(t, {setAt: B_A + 0.4, target: C.P_SUB, downAt: TC_A, upAt: TC_A + 0.09, outAt: TC_A + 0.22}) ??
    cursorState(t, {setAt: B_B + 0.45, target: C.P_LIKE, downAt: TP_B, upAt: T_LIGHT + 0.12, outAt: T_LIGHT + 0.3}) ??
    cursorState(t, {setAt: B_C + 0.4, target: C.P_FL, downAt: TC_C, upAt: TC_C + 0.09, outAt: TC_C + 0.22});

  const glyphStroke = (i: number) => mix(C.idle, '#ffffff', plateLight(i));
  const plateBg = (i: number) => mix(C.plateOff, C.accent, plateLight(i));
  const plateEdge = (i: number) => mix(C.plateEdge, C.accent, plateLight(i));

  return (
    <AbsoluteFill style={{
      background: '#ffffff', color: '#1d1d1f', overflow: 'hidden',
      fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    }}>
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
        <Host src={hostSrc} />

        <div className="cta-zone">
          <div className="seg seg-yt" style={{opacity: segAO}}>
            <div className="plat">YouTube · 订阅 + 铃铛</div>
            <div className="row">
              <div className={'sub-btn' + (subDone ? ' done' : '')} style={{transform: `scale(${subS})`, transformOrigin: '50% 50%'}}>
                {subDone ? '已订阅' : '订阅'}
              </div>
              <div className="bell" style={{opacity: bellO}}>
                <svg width="44" height="44" viewBox="0 0 44 44" style={{transform: `rotate(${bellRot}deg)`}}>
                  <path d="M22 4 a4 4 0 0 1 4 4 c6 2 8 8 8 14 v6 l4 5 H6 l4 -5 v-6 c0 -6 2 -12 8 -14 a4 4 0 0 1 4 -4 z" fill="#1d1d1f" />
                  <circle cx="22" cy="38" r="4" fill="#1d1d1f" />
                </svg>
                <div className="rip" style={{
                  opacity: bellRipOn ? lerp(0.7, 0, bellRipP) : 0,
                  transform: `scale(${bellRipOn ? lerp(0.6, 1.9, bellRipP) : 0.6})`,
                }} />
              </div>
            </div>
          </div>

          <div className="seg seg-tri" style={{opacity: segBO}}>
            <div className="plat">B站 · 一键三连（长按点赞）</div>
            <div className="tri-row">
              {[
                <svg key="like" className="glyph" viewBox="0 0 44 44" aria-hidden="true">
                  <path d="M8 19.5 h8 v17 h-8 z" style={{stroke: glyphStroke(0)}} />
                  <path d="M18 36.5 H30 C32.2 36.5 34 34.9 34.3 32.8 L35.9 24.6 C36.3 22.3 34.7 20.4 32.5 20.4 H26.8 L27.8 14.3 C28.2 11.6 26.4 9.2 23.8 9 L21.6 15.7 L18 20.6 Z" style={{stroke: glyphStroke(0)}} />
                </svg>,
                <svg key="coin" className="glyph" viewBox="0 0 44 44" aria-hidden="true">
                  <circle cx="22" cy="22" r="14" style={{stroke: glyphStroke(1)}} />
                  <path d="M17.2 16.4 L22 22 L26.8 16.4" style={{stroke: glyphStroke(1)}} />
                  <path d="M22 22 V29.6" style={{stroke: glyphStroke(1)}} />
                  <path d="M17.6 24.6 H26.4" style={{stroke: glyphStroke(1)}} />
                </svg>,
                <svg key="fav" className="glyph" viewBox="0 0 44 44" aria-hidden="true">
                  <path d="M22 7 L26.2 16.2 L36.3 17.4 L28.8 24.2 L30.8 34.1 L22 29.2 L13.2 34.1 L15.2 24.2 L7.7 17.4 L17.8 16.2 Z" style={{stroke: glyphStroke(2)}} />
                </svg>,
              ].map((glyph, i) => (
                <div key={i} className="tri-item">
                  <div className="plate-wrap">
                    <div className="plate" style={{
                      transform: `scale(${plateS(i)})`,
                      transformOrigin: '50% 50%',
                      backgroundColor: plateBg(i),
                      borderColor: plateEdge(i),
                    }}>
                      {glyph}
                    </div>
                    <div className="rip" style={{
                      opacity: triRipOn(i) ? lerp(0.7, 0, triRipP(i)) : 0,
                      transform: `scale(${triRipOn(i) ? lerp(0.85, 1.75, triRipP(i)) : 0.85})`,
                    }} />
                    {i === 0 ? (
                      <svg className="hold-ring" viewBox="0 0 94 94" aria-hidden="true" style={{opacity: ringO}}>
                        <circle cx="47" cy="47" r="45" style={{strokeDashoffset: arcOffset}} />
                      </svg>
                    ) : null}
                  </div>
                  <div className="tri-label">{['点赞', '投币', '收藏'][i]}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="seg seg-fl" style={{opacity: segCO}}>
            <div className="plat">小红书 / 抖音 / X · 关注</div>
            <div className="row">
              <div className={'follow-btn' + (flDone ? ' done' : '')} style={{transform: `scale(${flS})`, transformOrigin: '50% 50%'}}>
                <svg className="tick" viewBox="0 0 26 26" aria-hidden="true" style={{opacity: tickO}}>
                  <path d="M4 14 L10.5 20 L22 6.5" style={{strokeDashoffset: tickOffset}} />
                </svg>
                <span className="ftxt">{flDone ? '已关注' : '关注'}</span>
                <div className="rip" style={{
                  opacity: flRipOn ? lerp(0.6, 0, flRipP) : 0,
                  transform: `scale(${flRipOn ? lerp(0.9, 1.28, flRipP) : 0.9})`,
                }} />
              </div>
            </div>
          </div>
        </div>

        {cur ? (
          <svg className="cursor" viewBox="0 0 14 21" aria-hidden="true" style={{
            opacity: cur.o,
            transform: `translate(${cur.x}px, ${cur.y}px) scale(${cur.s})`,
          }}>
            <path d="M1 1 L1 17.2 L5.3 13.3 L8.1 19.9 L10.8 18.8 L8 12.3 L13.1 12.3 Z" fill="#ffffff" stroke="#1d1d1f" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
