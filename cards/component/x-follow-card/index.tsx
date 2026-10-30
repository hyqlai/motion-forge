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
  clickDip: 0.9,
  flipDur: 0.34,
  rollDur: 0.42,
  hold: 0.85,
  START: {x: 1000, y: 470},
  TARGET: {x: 672.05, y: 196.1},
  TIP: {x: 1 / 14 * 30, y: 1 / 21 * 45},
};

const TC = CONFIG.cursorStart + CONFIG.cursorMove + 0.08;
const TOTAL = TC + 0.6 + CONFIG.hold;

export const meta = {width: 960, height: 540, fps: 30, durationInFrames: Math.round((TOTAL + 0.4) * 30)};

const FPS = meta.fps;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const tw = (t: number, t0: number, d: number, ease: (x: number) => number) => ease(clamp01((t - t0) / d));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const power2Out = (x: number) => 1 - Math.pow(1 - x, 3);
const power2In = (x: number) => x * x * x;
const power3Out = (x: number) => 1 - Math.pow(1 - x, 4);
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
  transform: translate(-50%, -50%) scale(0.885);
  transform-origin: 50% 50%;
}
.card {
  position: relative;
  width: 600px;
  background: #16181c;
  border: 1px solid #2f3336;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 24px 70px -18px rgba(0, 0, 0, 0.55);
  transform-origin: 50% 0%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #e7e9ea;
}
.cover {
  position: relative;
  height: 150px;
  background: linear-gradient(135deg, #1d9bf0 0%, rgba(29, 155, 240, 0.6) 55%, rgba(29, 155, 240, 0.33) 100%);
}
.cover .xmark {
  position: absolute;
  right: 20px; top: 18px;
  width: 26px; height: 26px;
  display: block;
  fill: #ffffff;
  opacity: 0.95;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.25));
}
.pad { padding: 0 24px 24px; }
.avatar-slot { margin-top: -55px; }
.avatar {
  width: 110px; height: 110px;
  border-radius: 100%;
  border: 4px solid #16181c;
  box-sizing: border-box;
  background: #5b6771;
  position: relative;
  overflow: hidden;
}
.avatar::after {
  content: "";
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 21% 21% at 50% 35%, #cfd9de 62%, transparent 63%),
              radial-gradient(ellipse 35% 31% at 50% 93%, #cfd9de 62%, transparent 63%);
}
.idblock { display: flex; flex-direction: column; gap: 2px; margin-top: 12px; }
.idline { display: flex; align-items: center; gap: 6px; }
.name {
  font-size: 24px; font-weight: 800;
  color: #e7e9ea;
  letter-spacing: -0.01em;
  line-height: 1.2;
}
.badge { display: block; width: 22px; height: 22px; fill: #1d9bf0; }
.handle { font-size: 16px; font-weight: 400; color: #71767b; line-height: 1.3; }
.bio { margin: 8px 0 0; font-size: 16px; font-weight: 400; color: #e7e9ea; line-height: 1.4; }
.meta { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 14px; font-size: 15px; color: #71767b; }
.meta span { display: flex; align-items: center; gap: 6px; }
.meta svg { width: 16px; height: 16px; fill: currentColor; }
.meta .site { color: #1d9bf0; }
.stats { display: flex; gap: 20px; font-size: 15px; color: #71767b; margin-top: 14px; }
.stats b { color: #e7e9ea; font-weight: 700; margin-right: 4px; }
.stats .roll { display: inline-block; height: 20px; overflow: hidden; vertical-align: top; }
.stats .strip { display: flex; flex-direction: column; }
.stats .strip i { font-style: normal; font-weight: 700; color: #e7e9ea; height: 20px; line-height: 20px; }
.btnrow {
  position: absolute; right: 24px; top: 170px;
  display: flex; align-items: center; gap: 12px;
}
.msg {
  width: 44px; height: 44px;
  border-radius: 50%;
  border: 1px solid #536471;
  display: flex; align-items: center; justify-content: center;
}
.msg svg { width: 20px; height: 20px; fill: #e7e9ea; }
.follow {
  position: relative;
  min-width: 104px; height: 44px;
  border-radius: 999px;
  transform-origin: 50% 50%;
}
.follow > div {
  position: absolute; inset: 0;
  border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 700;
  box-sizing: border-box;
}
.f-off { background: #eff3f4; color: #0f1419; }
.f-on  { background: transparent; color: #eff3f4; border: 1px solid #536471; }
.follow .rip {
  position: absolute; inset: -6px;
  border: 2px solid #1d9bf0;
  border-radius: 999px;
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

export type XFollowCardProps = {
  name?: string;
  theme?: Theme;
  durationInFrames?: number;
};

export const XFollowCard: React.FC<XFollowCardProps> = ({name = '陈叙白'}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 960, height / 540);
  const t = frame / FPS;
  const C = CONFIG;
  const target = {x: C.TARGET.x - C.TIP.x, y: C.TARGET.y - C.TIP.y};

  const cp = tw(t, 0, C.cardIn, backOut(1.35));
  const cardY = lerp(46, 0, cp);
  const cardS = lerp(0.9, 1, cp);
  const cardO = tw(t, 0.05, 0.3, power2Out);

  const layer = (i: number) => {
    const p = tw(t, 0.34 + i * C.layerStagger, C.layerDur, power2Out);
    return {
      opacity: p,
      transform: `translateY(${lerp(8, 0, p)}px)`,
      filter: `blur(${lerp(C.layerBlur, 0, p)}px)`,
    } as React.CSSProperties;
  };

  const outStart = TC + 0.22;
  const curX = t < outStart
    ? lerp(C.START.x, target.x, tw(t, C.cursorStart, C.cursorMove, power2InOut))
    : lerp(target.x, target.x + 92, tw(t, outStart, 0.45, power2In));
  const curY = t < outStart
    ? lerp(C.START.y, target.y, tw(t, C.cursorStart, C.cursorMove, sineInOut))
    : lerp(target.y, target.y + 56, tw(t, outStart, 0.45, power2In));
  const curO = t < C.cursorStart ? 0 : 1 - tw(t, outStart, 0.45, power2In);
  const curS = t < TC + 0.09
    ? lerp(1, 0.9, tw(t, TC, 0.09, power2Out))
    : lerp(0.9, 1, tw(t, TC + 0.09, 0.09, power2Out));

  const followS = t < TC + 0.08
    ? lerp(1, C.clickDip, tw(t, TC, 0.08, power2In))
    : lerp(C.clickDip, 1, tw(t, TC + 0.08, 0.22, backOut(3)));
  const offP = tw(t, TC, C.flipDur * 0.7, power2In);
  const onP = tw(t, TC, C.flipDur, backOut(1.7));
  const ripP = tw(t, TC + 0.03, 0.5, power2Out);
  const ripO = t < TC + 0.03 ? 0 : lerp(0.55, 0, ripP);
  const ripS = t < TC + 0.03 ? 0.92 : lerp(0.92, 1.3, ripP);
  const stripY = lerp(0, -20, tw(t, TC + 0.1, C.rollDur, power3Out));

  return (
    <AbsoluteFill style={{background: '#ffffff', color: '#1d1d1f', overflow: 'hidden'}}>
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
        <div className="scaler">
          <div className="card" style={{opacity: cardO, transform: `translateY(${cardY}px) scale(${cardS})`}}>
            <div className="cover" style={layer(0)}>
              <svg className="xmark" viewBox="0 0 24 24">
                <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
              </svg>
            </div>
            <div className="pad">
              <div className="avatar-slot" style={layer(1)}><div className="avatar" /></div>

              <div className="idblock">
                <div className="idline" style={layer(2)}>
                  <span className="name">{name}</span>
                  <svg className="badge" viewBox="0 0 22 22">
                    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
                  </svg>
                </div>
                <div className="handle" style={layer(3)}>@chenxubai</div>
              </div>
              <div className="bio" style={layer(4)}>十年产品设计，现在做独立开发。专注自动化与动效协议。</div>

              <div className="stats" style={layer(5)}>
                <span><b>286</b> 正在关注</span>
                <span><span className="roll"><span className="strip" style={{transform: `translateY(${stripY}px)`}}><i>12.4万</i><i>12.5万</i></span></span> 关注者</span>
              </div>
            </div>

            <div className="btnrow" style={layer(6)}>
              <div className="msg">
                <svg viewBox="0 0 24 24"><path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.638V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-8 3.638-8-3.638V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z" /></svg>
              </div>
              <div className="follow" style={{transform: `scale(${followS})`}}>
                <div className="f-off" style={{opacity: 1 - offP, transform: `scale(${lerp(1, 0.92, offP)})`}}>关注</div>
                <div className="f-on" style={{opacity: Math.min(1, onP), transform: `scale(${lerp(0.86, 1, onP)})`}}>已关注</div>
                <div className="rip" style={{opacity: ripO, transform: `scale(${ripS})`}} />
              </div>
            </div>
          </div>
        </div>

        <svg className="cursor" viewBox="0 0 14 21" style={{
          opacity: curO,
          transform: `translate(${curX}px, ${curY}px) scale(${curS})`,
        }}>
          <path d="M1 1 L1 17.2 L5.3 13.3 L8.1 19.9 L10.8 18.8 L8 12.3 L13.1 12.3 Z" fill="#ffffff" stroke="#1d1d1f" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
