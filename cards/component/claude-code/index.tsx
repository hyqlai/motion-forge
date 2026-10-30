import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

const CONFIG = {
  introDur: 0.62,
  introY: 21,
  boxFade: [0.20, 0.73] as [number, number],
  colRFade: [0.40, 1.00] as [number, number],
  promptFade: [0.60, 1.20] as [number, number],
  fadeUpY: 9,
  typeStart: 1.60,
  cps: 11,
  submitGap: 0.36,
  cursorHz: 2,
  logRate: 54,
  logChunk: 3,
  dotHz: 1.1,
  tail: 0.9,
  prompt: '改 src/theme.ts，加一个深色模式开关',
  lines: [
    {k: 'tool', t: 'Read(src/theme.ts)', d: 0.42},
    {k: 'res', t: '⎿ 读取 142 行', d: 0.50},
    {k: 'tool', t: 'Edit(src/theme.ts)', d: 0.28},
    {k: 'del', t: '  - const theme = lightTheme', d: 0.34},
    {k: 'add', t: '  + const theme = useColorScheme()', d: 0.14},
    {k: 'res', t: '⎿ 已改 1 处，新增 8 行', d: 0.32},
    {k: 'ok', t: '深色模式开关已接好，跑 pnpm dev 看效果', d: 0.44},
  ] as {k: string; t: string; d: number}[],
};

function buildSchedule() {
  const S = {} as {
    typeStart: number;
    typeDur: number;
    typeEnd: number;
    submitAt: number;
    lines: {start: number; end: number; len: number; text: string; k: string}[];
    total: number;
  };
  S.typeStart = CONFIG.typeStart;
  S.typeDur = CONFIG.prompt.length / CONFIG.cps;
  S.typeEnd = S.typeStart + S.typeDur;
  S.submitAt = S.typeEnd + CONFIG.submitGap;
  let acc = S.submitAt;
  S.lines = CONFIG.lines.map((l) => {
    acc += l.d;
    const start = acc;
    const dur = Math.max(l.t.length - CONFIG.logChunk + 1, 1) / CONFIG.logRate;
    acc = start + dur;
    return {start, end: start + dur, len: l.t.length, text: l.t, k: l.k};
  });
  S.total = acc + CONFIG.tail;
  return S;
}

const S = buildSchedule();

export const meta = {width: 960, height: 540, fps: 30, durationInFrames: Math.round((S.total + 0.4) * 30)};

const cl = (v: number) => Math.max(0, Math.min(1, v));
const out2 = (p: number) => 1 - (1 - p) * (1 - p);
const backOut = (p: number, k: number) => 1 + (k + 1) * Math.pow(p - 1, 3) + k * Math.pow(p - 1, 2);
const fadeUp = (t: number, w: [number, number]) => {
  const p = cl((t - w[0]) / (w[1] - w[0]));
  return {o: p, y: CONFIG.fadeUpY * (1 - p)};
};

const CSS = `
.win {
  position: absolute;
  left: 80px; top: 42px;
  width: 800px; height: 456px;
  border-radius: 12px;
  overflow: hidden;
  background: #1B1A18;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 60px -20px rgba(0, 0, 0, 0.6);
}
.bar {
  height: 32px;
  flex: 0 0 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  background: #3A3633;
}
.bar i { width: 10px; height: 10px; border-radius: 50%; display: block; }
.bar .r { background: #FF5F57; }
.bar .y { background: #FEBC2E; }
.bar .g { background: #28C840; }

.body {
  flex: 1;
  padding: 18px;
  display: flex;
  flex-direction: column;
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  overflow: hidden;
}
.welcome {
  position: relative;
  border: 1px dashed #D97757;
  border-radius: 6px;
  padding: 18px 16px 15px;
}
.welcome .cap {
  position: absolute;
  top: -8px; left: 16px;
  padding: 0 8px;
  background: #1B1A18;
  color: #D97757;
  font-size: 12px;
  font-weight: 700;
}
.cols { display: flex; }
.colL {
  width: 42%;
  padding-right: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  box-sizing: border-box;
}
.hello { font-size: 14px; color: #E8E5DD; }
.mark { align-self: center; }
.mark svg { display: block; width: 68px; height: 68px; fill: #D97757; }
.meta { display: flex; flex-direction: column; gap: 3px; }
.meta div { font-size: 11.5px; color: #8A857C; }

.colR {
  width: 58%;
  padding-left: 16px;
  border-left: 1px dashed #D97757;
  box-sizing: border-box;
}
.colR .h { font-size: 11.5px; font-weight: 700; color: #D97757; margin-bottom: 8px; }
.colR ul { list-style: none; display: flex; flex-direction: column; gap: 5px; }
.colR li { font-size: 11px; color: #E8E5DD; }
.colR li.dim { color: #6B6660; }

.promptWrap { margin-top: 16px; }
.rule { height: 1px; background: #6B6660; opacity: 0.4; margin-bottom: 11px; }
.prow {
  display: flex;
  align-items: center;
  font-size: 13px;
  white-space: pre;
}
.prow .pr { color: #8A857C; }
.prow .txt { color: #E8E5DD; }
.prow.done .txt { color: #8A857C; }
.cur {
  display: inline-block;
  width: 8px; height: 16px;
  margin-left: 2px;
  background: #E8E5DD;
  flex: 0 0 auto;
}
.log { margin-top: 10px; display: flex; flex-direction: column; }
.lg {
  height: 22px;
  display: flex;
  align-items: center;
  font-size: 12.5px;
  white-space: pre;
  color: #8A857C;
}
.lg.tool { color: #E8E5DD; }
.lg.res  { color: #8A857C; }
.lg.del  { color: #6B6660; }
.lg.add  { color: #33d16b; }
.lg.ok   { color: #E8E5DD; }
.lg.ok b { color: #33d16b; font-weight: 400; margin-right: 6px; }
.lg .lcur {
  display: inline-block;
  width: 7px; height: 14px;
  margin-left: 2px;
  background: currentColor;
}
.lg .dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #D97757;
  margin-right: 8px;
  flex: 0 0 auto;
}
`;

export type ClaudeCodeProps = {
  theme?: Theme;
  durationInFrames?: number;
};

export const ClaudeCode: React.FC<ClaudeCodeProps> = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 960, height / 540);
  const t = frame / 30;
  const N = S.lines.length;

  const ip = cl(t / CONFIG.introDur);
  const ie = ip <= 0 ? 0 : backOut(ip, 1.05);
  const winO = out2(cl(t / (CONFIG.introDur * 0.55)));

  const b = fadeUp(t, CONFIG.boxFade);
  const r = fadeUp(t, CONFIG.colRFade);
  const p = fadeUp(t, CONFIG.promptFade);

  const tp = cl((t - S.typeStart) / S.typeDur);
  const n = t < S.typeStart ? 0 : Math.floor(tp * CONFIG.prompt.length);
  const shown = CONFIG.prompt.slice(0, n);
  const showPh = n === 0;
  const done = t >= S.submitAt;

  const blink = (t * CONFIG.cursorHz) % 1 < 0.5;
  const curVisible = !done && (t < S.typeStart || t >= S.typeEnd ? blink : true);

  let activeLine = -1;
  let activeLcur = false;
  for (let i = 0; i < N; i++) {
    const l = S.lines[i];
    if (t >= l.start && t < l.end) {
      activeLine = i;
      activeLcur = true;
      break;
    }
  }

  return (
    <AbsoluteFill style={{background: '#2B2A28', overflow: 'hidden'}}>
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
        <div
          className="win"
          style={{
            transform: `translateY(${CONFIG.introY * (1 - ie)}px) scale(${0.97 + 0.03 * ie})`,
            opacity: winO,
          }}
        >
          <div className="bar">
            <i className="r" /><i className="y" /><i className="g" />
          </div>
          <div className="body">
            <div className="welcome" style={{opacity: b.o, transform: `translateY(${b.y}px)`}}>
              <span className="cap">Claude Code v0.2.29</span>
              <div className="cols">
                <div className="colL">
                  <div className="hello">Welcome back!</div>
                  <div className="mark">
                    <svg viewBox="0 0 24 24">
                      <path d="M4 4h4v4H4zm12 0h4v4h-4zM8 8h8v8H8zm-4 8h4v4H4zm12 0h4v4h-4z" />
                    </svg>
                  </div>
                  <div className="meta">
                    <div>Opus (claude-3-opus)</div>
                    <div>/project/motion-forge</div>
                  </div>
                </div>
                <div className="colR" style={{opacity: r.o, transform: `translateY(${r.y}px)`}}>
                  <div className="h">What's new:</div>
                  <ul>
                    <li>· Instant file editing with AST patch</li>
                    <li>· Auto terminal tool execution</li>
                    <li className="dim">· Esc to interrupt anytime</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="promptWrap" style={{opacity: p.o, transform: `translateY(${p.y}px)`}}>
              <div className="rule" />
              <div className={`prow ${done ? 'done' : ''}`}>
                <span className="pr">&gt; </span>
                <span className="txt">{shown}</span>
                {showPh && <span className="ph">Type a message or /help</span>}
                {curVisible && <span className="cur" />}
              </div>
            </div>

            <div className="log">
              {S.lines.map((l, i) => {
                if (t < l.start) return null;
                const lp = cl((t - l.start) / (l.end - l.start));
                const charN = t >= l.end ? l.len : Math.min(l.len, Math.max(1, Math.floor(lp * l.len)));
                const txt = l.text.slice(0, charN);
                const isTool = l.k === 'tool';
                const pulse = isTool && t < l.end ? 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * CONFIG.dotHz * Math.PI * 2)) : 1;
                return (
                  <div key={i} className={`lg ${l.k}`}>
                    {isTool && <i className="dot" style={{opacity: pulse}} />}
                    <span>{l.k === 'ok' ? <><b>✓</b>{txt}</> : txt}</span>
                    {activeLine === i && activeLcur && <span className="lcur" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
