import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

const CONFIG = {
  cardIn: 0.62,
  layerStagger: 0.07,
  layerDur: 0.24,
  layerBlur: 8,
  cursorStart: 1.55,
  cursorMove: 0.95,
  clickDip: 0.92,
  flipDur: 0.34,
  hold: 0.85,
};

type Content = {
  nickname: string;
  douyinId: string;
  stats: {like: string; follow: string; fans: string};
  bio: string[];
};

const CONTENT: Content = {
  nickname: 'Vincent',
  douyinId: '335248116',
  stats: {like: '3.2万', follow: '238', fans: '6455'},
  bio: [
    '持续分享 AI 最前沿的应用场景',
    '宣传片 skill 已开源，入群获取',
  ],
};

const W = 900;
const S = 500 / 900;
const COVER_H = 560;
const AVATAR = 200;
const BIO_LINE_H = 40;
const MAX_BIO_LINES = 5;
const BODY_PAD_T = 30, BODY_PAD_B = 34, BODY_PAD_X = 36;
const STATS_H = 40, GAP_BIO = 20, GAP_BTN = 34, BTN_H = 72;

const BIO_LINES = Math.min(CONTENT.bio.length, MAX_BIO_LINES);
const BODY_H = BODY_PAD_T + STATS_H + GAP_BIO + BIO_LINES * BIO_LINE_H + GAP_BTN + BTN_H + BODY_PAD_B;
const H = COVER_H + BODY_H;

const BTN_ROW_Y = COVER_H + BODY_PAD_T + STATS_H + GAP_BIO + BIO_LINES * BIO_LINE_H + GAP_BTN;
const BTN_CX = BODY_PAD_X + 486 / 2;
const BTN_CY = BTN_ROW_Y + BTN_H / 2;
const TARGET = {x: BTN_CX, y: BTN_CY};
const TIP = {x: 1 / 14 * 30, y: 1 / 21 * 45};

const TC = CONFIG.cursorStart + CONFIG.cursorMove + 0.08;
const TOTAL = TC + 0.6 + CONFIG.hold;

export const meta = {width: 960, height: 540, fps: 30, durationInFrames: Math.round((TOTAL + 0.4) * 30)};

const FPS = meta.fps;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const tw = (t: number, t0: number, d: number, ease: (x: number) => number) => ease(clamp01((t - t0) / d));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const power2Out = (x: number) => 1 - Math.pow(1 - x, 3);
const power2In = (x: number) => x * x * x;
const power2InOut = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - Math.pow(-2 * x + 2, 3) / 2);
const sineInOut = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;
const backOut = (s: number) => (x: number) => {
  const u = x - 1;
  return 1 + (s + 1) * u * u * u + s * u * u;
};

const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
.scaler {
  position: absolute;
  left: 50%; top: 50%;
  width: ${W}px; height: ${H}px;
  transform: translate(-50%, -50%) scale(${S});
  transform-origin: 50% 50%;
  overflow: hidden;
}
.card {
  position: relative;
  width: ${W}px;
  height: ${H}px;
  background: #ffffff;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.45);
  transform-origin: 50% 0%;
  font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  color: #161823;
  display: flex;
  flex-direction: column;
}
.cover {
  position: relative;
  height: ${COVER_H}px;
  flex: 0 0 auto;
  background: linear-gradient(180deg, #bbd7ef 0%, #8fb7e8 46%, #75a4d0 100%);
}
.topnav {
  position: absolute; left: 0; right: 0; top: 22px;
  display: flex; align-items: center;
  padding: 0 28px;
}
.topnav .back {
  width: 44px; height: 44px; border-radius: 100%;
  background: rgba(0, 0, 0, 0.22);
  display: flex; align-items: center; justify-content: center;
}
.topnav .back svg { width: 22px; height: 22px; fill: #fff; }
.topnav .spacer { flex: 1; }
.topnav .pill {
  display: flex; align-items: center; gap: 8px;
  height: 42px; padding: 0 18px; border-radius: 22px;
  background: rgba(0, 0, 0, 0.22);
  color: #fff; font-size: 20px; font-weight: 600;
}
.topnav .pill svg { width: 24px; height: 24px; fill: #fff; }
.topnav .ico {
  width: 44px; height: 44px; border-radius: 100%;
  background: rgba(0, 0, 0, 0.22);
  margin-left: 14px;
  display: flex; align-items: center; justify-content: center;
}
.topnav .ico svg { width: 22px; height: 22px; fill: #fff; }
.head {
  position: absolute; top: 216px; left: 56px; right: 40px;
  display: flex; align-items: flex-start; gap: 34px;
}
.avatar {
  flex: 0 0 auto;
  width: ${AVATAR}px; height: ${AVATAR}px;
  border-radius: 100%;
  border: 6px solid rgba(255, 255, 255, 0.9);
  overflow: hidden;
  box-sizing: border-box;
  background: #c7ccd3;
  position: relative;
}
.avatar::after {
  content: ""; position: absolute; inset: 0;
  background: radial-gradient(ellipse 22% 22% at 50% 33%, #eef0f3 60%, transparent 61%),
              radial-gradient(ellipse 40% 36% at 50% 97%, #eef0f3 60%, transparent 61%);
}
.idcol { padding-top: 36px; min-width: 0; }
.nick { display: flex; align-items: center; gap: 12px; }
.nick .name { font-size: 48px; font-weight: 700; color: #fff; letter-spacing: 0.5px; }
.dvid { display: flex; align-items: center; gap: 10px; margin-top: 18px; font-size: 26px; color: rgba(255,255,255,0.92); }
.body {
  position: relative;
  flex: 1 0 auto;
  background: #ffffff;
  border-radius: 30px 30px 0 0;
  padding: ${BODY_PAD_T}px ${BODY_PAD_X}px ${BODY_PAD_B}px;
}
.stats { display: flex; gap: 46px; font-size: 34px; color: #9299a4; }
.stats b { color: #161823; font-weight: 700; font-size: 38px; }
.bio { margin-top: ${GAP_BIO}px; font-size: 27px; line-height: ${BIO_LINE_H}px; color: #161823; }
.btnrow { display: flex; gap: 18px; margin-top: ${GAP_BTN}px; }
.follow {
  position: relative;
  flex: 1.35 0 0;
  height: ${BTN_H}px;
  border-radius: ${BTN_H / 2}px;
  transform-origin: 50% 50%;
}
.follow > div {
  position: absolute; inset: 0;
  border-radius: ${BTN_H / 2}px;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  font-size: 30px; font-weight: 600;
  box-sizing: border-box;
}
.f-off { background: #eb455b; color: #ffffff; }
.f-on  { background: #f1f1f2; color: #161823; }
.follow .rip {
  position: absolute; inset: -8px;
  border: 3px solid #eb455b; border-radius: 999px;
  pointer-events: none;
}
.msgbtn {
  flex: 0 0 auto; width: 72px; height: ${BTN_H}px;
  border-radius: 20px;
  background: #f1f1f2; color: #161823;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 26px; font-weight: 600; overflow: hidden; white-space: nowrap;
}
.msgbtn svg { width: 30px; height: 30px; fill: #161823; }
.cursor {
  position: absolute; left: 0; top: 0;
  width: 36px; height: 54px;
  transform-origin: 0% 0%;
  z-index: 20;
  pointer-events: none;
}
`;

export type DouyinFollowCardProps = {
  name?: string;
  theme?: Theme;
  durationInFrames?: number;
};

export const DouyinFollowCard: React.FC<DouyinFollowCardProps> = ({name = CONTENT.nickname}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const viewportScale = Math.min(width / 960, height / 540);
  const t = frame / FPS;
  const C = CONFIG;
  const content = {...CONTENT, nickname: name};
  const target = {x: TARGET.x - TIP.x, y: TARGET.y - TIP.y};

  const cp = tw(t, 0, C.cardIn, backOut(1.35));
  const cardY = lerp(46, 0, cp);
  const cardS = lerp(0.9, 1, cp);
  const cardO = tw(t, 0.05, 0.3, power2Out);

  const layer = (i: number) => {
    const p = tw(t, 0.34 + i * C.layerStagger, C.layerDur, power2Out);
    return {
      opacity: p,
      transform: `translateY(${lerp(12, 0, p)}px)`,
      filter: `blur(${lerp(C.layerBlur, 0, p)}px)`,
    } as React.CSSProperties;
  };

  const curStart = {x: W + 120, y: H - 40};
  const outStart = TC + 0.22;
  const curX = t < outStart
    ? lerp(curStart.x, target.x, tw(t, C.cursorStart, C.cursorMove, power2InOut))
    : lerp(target.x, target.x + 92, tw(t, outStart, 0.45, power2In));
  const curY = t < outStart
    ? lerp(curStart.y, target.y, tw(t, C.cursorStart, C.cursorMove, sineInOut))
    : lerp(target.y, target.y + 56, tw(t, outStart, 0.45, power2In));
  const curO = t < C.cursorStart ? 0 : 1 - tw(t, outStart, 0.45, power2In);
  const curS = t < TC + 0.08
    ? lerp(1, 0.9, tw(t, TC, 0.08, power2Out))
    : lerp(0.9, 1, tw(t, TC + 0.08, 0.08, power2Out));

  const followS = t < TC + 0.07
    ? lerp(1, C.clickDip, tw(t, TC, 0.07, power2In))
    : lerp(C.clickDip, 1, tw(t, TC + 0.07, 0.22, backOut(3)));
  const offP = tw(t, TC, C.flipDur * 0.7, power2In);
  const onP = tw(t, TC, C.flipDur, backOut(1.7));
  const ripP = tw(t, TC + 0.03, 0.5, power2Out);
  const ripO = t < TC + 0.03 ? 0 : lerp(0.55, 0, ripP);
  const ripS = t < TC + 0.03 ? 0.92 : lerp(0.92, 1.3, ripP);

  const msgP = tw(t, TC + 0.05, 0.38, backOut(1.8));
  const msgW = lerp(72, 180, msgP);

  return (
    <AbsoluteFill style={{background: '#ffffff', color: '#161823', overflow: 'hidden'}}>
      <div style={{
        width: 960,
        height: 540,
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${viewportScale})`,
        transformOrigin: '50% 50%',
      }}>
        <style>{CSS}</style>
        <div className="scaler">
          <div className="card" style={{opacity: cardO, transform: `translateY(${cardY}px) scale(${cardS})`}}>
            <div className="cover">
              <div className="topnav" style={layer(0)}>
                <div className="back">
                  <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
                </div>
                <div className="spacer" />
                <div className="pill">求更新</div>
                <div className="ico"><svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg></div>
              </div>
              <div className="head">
                <div className="avatar" style={layer(1)} />
                <div className="idcol">
                  <div className="nick" style={layer(2)}>
                    <span className="name">{content.nickname}</span>
                  </div>
                  <div className="dvid" style={layer(3)}>
                    <span>抖音号：{content.douyinId}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="body">
              <div className="stats" style={layer(4)}>
                <span><b>{content.stats.like}</b> 获赞</span>
                <span><b>{content.stats.follow}</b> 关注</span>
                <span><b>{content.stats.fans}</b> 粉丝</span>
              </div>
              <div className="bio" style={layer(5)}>
                {content.bio.map((l, i) => <div key={i}>{l}</div>)}
              </div>
              <div className="btnrow" style={layer(6)}>
                <div className="follow" style={{transform: `scale(${followS})`}}>
                  <div className="f-off" style={{opacity: 1 - offP, transform: `scale(${lerp(1, 0.92, offP)})`}}>＋ 关注</div>
                  <div className="f-on" style={{opacity: Math.min(1, onP), transform: `scale(${lerp(0.86, 1, onP)})`}}>已关注</div>
                  <div className="rip" style={{opacity: ripO, transform: `scale(${ripS})`}} />
                </div>
                <div className="msgbtn" style={{width: `${msgW}px`}}>
                  <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                  {msgP > 0.4 && <span style={{opacity: (msgP - 0.4) / 0.6}}>发私信</span>}
                </div>
              </div>
            </div>

            <svg className="cursor" viewBox="0 0 14 21" style={{
              opacity: curO,
              transform: `translate(${curX}px, ${curY}px) scale(${curS})`,
            }}>
              <path d="M1 1 L1 17.2 L5.3 13.3 L8.1 19.9 L10.8 18.8 L8 12.3 L13.1 12.3 Z" fill="#ffffff" stroke="#161823" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
