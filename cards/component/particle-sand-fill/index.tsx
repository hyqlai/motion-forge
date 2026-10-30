import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

export type ParticleSandFillProps = {
  theme?: Theme;
  durationInFrames?: number;
};

const frac = (x: number) => x - Math.floor(x);
const rnd = (i: number, salt: number) => frac(Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453);

const CARD = {x: 460, y: 300, w: 1000, h: 560};
const PLOT_BOTTOM = CARD.y + CARD.h - 70;
const GRAIN = 14;
const PER_LAYER = 9;
const BAR_W = GRAIN * PER_LAYER;
const DROP_FROM = 230;
const GRAV = 1.6;
const STAGGER = 6;
const RATE = 0.28;

const BARS = [
  {cx: CARD.x + 175, h: 238, label: '238'},
  {cx: CARD.x + 395, h: 336, label: '336'},
  {cx: CARD.x + 615, h: 182, label: '182'},
  {cx: CARD.x + 835, h: 294, label: '294'},
].map((b) => ({...b, layers: Math.round(b.h / GRAIN), n: Math.round(b.h / GRAIN) * PER_LAYER}));

const fallTime = (dist: number) => Math.sqrt((2 * dist) / GRAV);
const departOf = (bar: number, i: number) => 8 + bar * STAGGER + i * RATE + rnd(i, bar * 7 + 1) * 1.5;

export const ParticleSandFill: React.FC<ParticleSandFillProps> = ({theme}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);
  const accent = theme?.accent ?? '#38bdf8';

  return (
    <AbsoluteFill style={{background: theme?.background ?? '#0b0e14', overflow: 'hidden'}}>
      <div style={{
        width: 1920,
        height: 1080,
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: '50% 50%',
      }}>
        <div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center'}}>
          <div style={{fontSize: 22, letterSpacing: 8, color: accent, fontWeight: 700, marginBottom: 12}}>PHYSICAL DATAFLOW</div>
          <div style={{fontSize: 72, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em'}}>粒子落砂成柱</div>
        </div>

        {/* 玻璃图表卡底板 */}
        <div style={{
          position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h,
          background: '#141c2b', border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 20,
          boxSizing: 'border-box', padding: 32, boxShadow: '0 24px 70px rgba(0,0,0,0.5)',
        }}>
          <div style={{height: 16, width: 260, background: 'rgba(255,255,255,0.15)', borderRadius: 8}} />
          <div style={{height: 10, width: 160, background: 'rgba(255,255,255,0.08)', borderRadius: 5, marginTop: 12}} />
        </div>

        {/* 堆积基准地面 */}
        <div style={{position: 'absolute', left: CARD.x + 40, top: PLOT_BOTTOM, width: CARD.w - 80, height: 2, background: 'rgba(255,255,255,0.16)'}} />

        {BARS.map((bar, b) => {
          const left = bar.cx - BAR_W / 2;
          const lastLand = departOf(b, bar.n - 1) + fallTime(DROP_FROM);
          const doneAt = lastLand + 7;
          const solidOp = interpolate(frame, [doneAt, doneAt + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const labelScale = interpolate(frame, [doneAt + 6, doneAt + 18], [0, 1], {
            easing: Easing.out(Easing.back(2.2)),
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });

          return (
            <React.Fragment key={b}>
              {/* 实体柱交接层 */}
              <div
                style={{
                  position: 'absolute',
                  left,
                  top: PLOT_BOTTOM - bar.h,
                  width: BAR_W,
                  height: bar.h,
                  background: `linear-gradient(180deg, ${accent} 0%, rgba(56,189,248,0.2) 100%)`,
                  borderRadius: '6px 6px 0 0',
                  opacity: solidOp,
                  boxShadow: `0 0 30px ${accent}44`,
                }}
              />

              {/* 顶部数值标签 */}
              <div
                style={{
                  position: 'absolute',
                  left: bar.cx,
                  top: PLOT_BOTTOM - bar.h - 56,
                  transform: `translateX(-50%) scale(${labelScale})`,
                  background: '#1e293b',
                  color: accent,
                  border: `1px solid ${accent}`,
                  padding: '6px 16px',
                  borderRadius: 20,
                  fontSize: 22,
                  fontWeight: 800,
                  fontFamily: 'monospace',
                }}
              >
                {bar.label}
              </div>

              {/* 逐颗下落粒子 */}
              {Array.from({length: bar.n}, (_, i) => {
                const layer = Math.floor(i / PER_LAYER);
                const col = i % PER_LAYER;
                const landY = PLOT_BOTTOM - (layer + 1) * GRAIN;
                const startY = landY - DROP_FROM - rnd(i, b * 3) * 30;
                const dep = departOf(b, i);
                const dur = fallTime(landY - startY);
                const land = dep + dur;

                if (frame < dep || frame > doneAt + 12) return null;

                let y: number;
                if (frame < land) {
                  const p = (frame - dep) / dur;
                  y = startY + (landY - startY) * p * p;
                } else if (frame < land + 5) {
                  const bp = (frame - land) / 5;
                  y = landY - Math.sin(bp * Math.PI) * 4;
                } else {
                  y = landY;
                }

                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: left + col * GRAIN,
                      top: y,
                      width: GRAIN - 1.5,
                      height: GRAIN - 1.5,
                      borderRadius: 2,
                      background: accent,
                      opacity: 1 - solidOp,
                    }}
                  />
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
