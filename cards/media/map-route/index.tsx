import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

export const meta = {width: 960, height: 540, fps: 30, durationInFrames: 155};
const FPS = meta.fps;

const CONFIG = {
  routeGrow: 1.1,
  pinDropFrom: 60,
  pinDrop: 0.25,
  squashX: 1.3,
  squashY: 0.7,
  rebound: 0.28,
  labelSlide: 0.2,
  legPause: 0.4,
  planeAngle: 0,
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const tw = (t: number, t0: number, d: number, ease: (x: number) => number) => ease(clamp01((t - t0) / d));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const power1In = (x: number) => x * x;
const power2In = (x: number) => x * x * x;
const power2Out = (x: number) => 1 - Math.pow(1 - x, 3);
const power1InOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const backOut = (s = 1.70158) => (x: number) => {
  const u = x - 1;
  return 1 + (s + 1) * u * u * u + s * u * u;
};

type Pt = {x: number; y: number};
const buildRoute = (P0: Pt, P1: Pt, P2: Pt, N = 240) => {
  const pts: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, v = 1 - u;
    pts.push({
      x: v * v * P0.x + 2 * v * u * P1.x + u * u * P2.x,
      y: v * v * P0.y + 2 * v * u * P1.y + u * u * P2.y,
    });
  }
  const cum = [0];
  for (let i = 1; i <= N; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  const len = cum[N];
  const pointAt = (s: number): Pt => {
    const target = Math.max(0, Math.min(len, s));
    let lo = 0, hi = N;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    const i = Math.max(1, lo);
    const seg = cum[i] - cum[i - 1] || 1;
    const f = (target - cum[i - 1]) / seg;
    return {x: lerp(pts[i - 1].x, pts[i].x, f), y: lerp(pts[i - 1].y, pts[i].y, f)};
  };
  return {len, pointAt};
};

const CITY = [{x: 430, y: 150}, {x: 612, y: 292}, {x: 472, y: 458}];
const ROUTES = [
  buildRoute({x: 430, y: 150}, {x: 580, y: 170}, {x: 612, y: 292}),
  buildRoute({x: 612, y: 292}, {x: 622, y: 420}, {x: 472, y: 458}),
];
const ROUTE_D = ['M 430,150 Q 580,170 612,292', 'M 612,292 Q 622,420 472,458'];
const LABELS = ['北京 · 总部', '上海 · 中转仓', '深圳 · 工厂'];

const PIN_AT = [0.15, 0.85 + CONFIG.routeGrow, 0.85 + CONFIG.routeGrow + 0.6 + CONFIG.legPause + CONFIG.routeGrow];
const ROUTE_AT = [0.85, 0.85 + CONFIG.routeGrow + 0.6 + CONFIG.legPause];

const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
.pin-anchor { position: absolute; width: 0; height: 0; z-index: 4; }
.pin {
  position: absolute;
  left: -13px; bottom: 0;
  width: 26px; height: 32px;
  transform-origin: 50% 100%;
}
.pin-head {
  position: absolute;
  left: 0; top: 0;
  width: 26px; height: 26px;
  background: #d8383a;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
}
.pin-head::after {
  content: "";
  position: absolute;
  left: 8px; top: 8px;
  width: 10px; height: 10px;
  background: #ffffff;
  border-radius: 50%;
}
.pin-anchor.start .pin-head { background: #1d1d1f; }
.ring {
  position: absolute;
  left: -16px; top: -8px;
  width: 32px; height: 16px;
  border: 2px solid rgba(29, 29, 31, .55);
  border-radius: 50%;
}
.pin-label {
  position: absolute;
  left: 18px; top: -34px;
  padding: 3px 10px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 700;
  color: #1d1d1f;
  white-space: nowrap;
}
`;

export type MapRouteProps = {
  theme?: Theme;
  durationInFrames?: number;
};

export const MapRoute: React.FC<MapRouteProps> = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 960, height / 540);
  const t = frame / FPS;

  const pinState = (i: number) => {
    const at = PIN_AT[i];
    const y = lerp(-CONFIG.pinDropFrom, 0, tw(t, at, CONFIG.pinDrop, power2In));
    const squashAt = at + CONFIG.pinDrop;
    const reboundAt = squashAt + 0.06;
    let sx = 1, sy = 1;
    if (t >= squashAt && t < reboundAt) {
      const p = tw(t, squashAt, 0.06, power1In);
      sx = lerp(1, CONFIG.squashX, p);
      sy = lerp(1, CONFIG.squashY, p);
    } else if (t >= reboundAt) {
      const p = tw(t, reboundAt, CONFIG.rebound, backOut(3));
      sx = lerp(CONFIG.squashX, 1, p);
      sy = lerp(CONFIG.squashY, 1, p);
    }
    const fxAt = reboundAt - 0.05;
    const ringP = tw(t, fxAt, 0.45, power2Out);
    const labelP = tw(t, fxAt, CONFIG.labelSlide, power2Out);
    return {visible: t >= at, y, sx, sy, ringP, labelP};
  };

  const routeP = (i: number) => tw(t, ROUTE_AT[i], CONFIG.routeGrow, power1InOut);

  let plane: {x: number; y: number; deg: number; opacity: number; scale: number} | null = null;
  if (t >= ROUTE_AT[0]) {
    const leg = t >= ROUTE_AT[1] ? 1 : 0;
    const r = ROUTES[leg];
    const p = routeP(leg);
    const pt = r.pointAt(p * r.len);
    const next = r.pointAt(Math.min(p * r.len + 2, r.len));
    const deg = (Math.atan2(next.y - pt.y, next.x - pt.x) * 180) / Math.PI;
    const fadeP = tw(t, ROUTE_AT[1] + CONFIG.routeGrow + 0.1, 0.25, power2In);
    plane = {
      x: pt.x,
      y: pt.y,
      deg: deg + CONFIG.planeAngle,
      opacity: 1 - fadeP,
      scale: lerp(1, 0.4, fadeP),
    };
  }

  return (
    <AbsoluteFill style={{
      background: '#ffffff',
      color: '#1d1d1f',
      overflow: 'hidden',
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

        <svg style={{position: 'absolute', inset: 0, display: 'block'}} viewBox="0 0 960 540">
          <defs>
            {ROUTE_D.map((d, i) => {
              const L = ROUTES[i].len + 2;
              return (
                <mask id={`map-reveal-${i + 1}`} key={i}>
                  <path
                    d={d}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={10}
                    strokeLinecap="butt"
                    strokeDasharray={L}
                    strokeDashoffset={L * (1 - routeP(i))}
                  />
                </mask>
              );
            })}
          </defs>

          <g stroke="#ececef" strokeWidth={1}>
            <path d="M 120,0 V 540 M 240,0 V 540 M 360,0 V 540 M 480,0 V 540 M 600,0 V 540 M 720,0 V 540 M 840,0 V 540" />
            <path d="M 0,90 H 960 M 0,180 H 960 M 0,270 H 960 M 0,360 H 960 M 0,450 H 960" />
          </g>

          <g>
            <path
              d="M -20,-20 L 690,-20 C 655,55 705,105 645,168 C 602,214 690,238 648,302 C 615,352 566,342 548,398 C 528,458 480,472 442,560 L -20,560 Z"
              fill="#f5f5f7"
              stroke="#d2d2d7"
              strokeWidth={2}
            />
            <ellipse cx={768} cy={196} rx={26} ry={13} fill="#f5f5f7" stroke="#d2d2d7" strokeWidth={1.5} transform="rotate(-18 768 196)" />
            <ellipse cx={812} cy={392} rx={18} ry={9} fill="#f5f5f7" stroke="#d2d2d7" strokeWidth={1.5} transform="rotate(12 812 392)" />
            <path d="M 200,60 C 260,140 210,230 300,300 M 430,-10 C 400,90 470,140 430,150" fill="none" stroke="#d8d8dc" strokeWidth={1.2} strokeDasharray="3 6" />
          </g>

          <g fill="#8a8a8a">
            {CITY.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={3.5} />)}
          </g>

          {ROUTE_D.map((d, i) => (
            <path
              key={i}
              d={d}
              mask={`url(#map-reveal-${i + 1})`}
              fill="none"
              stroke="#d8383a"
              strokeWidth={3.5}
              strokeDasharray="9 9"
              strokeLinecap="round"
            />
          ))}
        </svg>

        {CITY.map((c, i) => {
          const s = pinState(i);
          return (
            <div key={i} className={`pin-anchor${i === 0 ? ' start' : ''}`} style={{left: c.x, top: c.y}}>
              <div
                className="ring"
                style={{
                  opacity: t < PIN_AT[i] + CONFIG.pinDrop + 0.01 ? 0.9 : lerp(0.9, 0, s.ringP),
                  transform: `scale(${t < PIN_AT[i] + CONFIG.pinDrop + 0.01 ? 0.2 : lerp(0.2, 1.6, s.ringP)})`,
                }}
              />
              <div
                className="pin"
                style={{
                  opacity: s.visible ? 1 : 0,
                  transform: `translateY(${s.y}px) scale(${s.sx}, ${s.sy})`,
                }}
              >
                <div className="pin-head" />
              </div>
              <div
                className="pin-label"
                style={{
                  opacity: s.labelP,
                  transform: `translateX(${lerp(-14, 0, s.labelP)}px)`,
                }}
              >
                {LABELS[i]}
              </div>
            </div>
          );
        })}

        {plane && (
          <svg
            viewBox="0 0 24 24"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 22,
              height: 22,
              zIndex: 3,
              opacity: plane.opacity,
              transform: `translate(${plane.x}px, ${plane.y}px) translate(-50%, -50%) rotate(${plane.deg}deg) scale(${plane.scale})`,
            }}
          >
            <path d="M 21,12 L 3,4 L 8,12 L 3,20 Z" fill="#1d1d1f" />
          </svg>
        )}
      </div>
    </AbsoluteFill>
  );
};
