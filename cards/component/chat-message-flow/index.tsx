import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, clamp01, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type ChatMessage = {
  from: 'me' | 'them';
  text: string;
  react?: string;
};

export type ChatMessageFlowProps = {
  messages?: ChatMessage[];
  theme: Theme;
  durationInFrames: number;
  charDur?: number;
};

type Item = {
  i: number;
  from: 'me' | 'them';
  text: string;
  len: number;
  react?: string;
  typeStart?: number;
  typeDur?: number;
  sendAt?: number;
  thinkStart?: number;
  thinkDur?: number;
  revealAt: number;
  presenceStart: number;
  reactAt?: number;
};

const DEFAULT_MESSAGES: ChatMessage[] = [
  {from: 'me', text: '筛选器默认收起吧？'},
  {from: 'them', text: '同意，第一屏别摆五个下拉'},
  {from: 'them', text: '默认值我改成近 7 天了', react: '👍'},
];

export const ChatMessageFlow: React.FC<ChatMessageFlowProps> = ({
  messages = DEFAULT_MESSAGES,
  theme,
  charDur = 0.12,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const leadIn = 0.40;
  const typeMin = 0.60;
  const typeMax = 2.60;
  const sendGap = 0.33;
  const reveal = 0.47;
  const msgGap = 0.60;
  const thinkPerChar = 0.115;
  const thinkMin = 1.10;
  const thinkMax = 2.30;
  const indIn = 0.27;
  const indOut = 0.20;
  const reactDelay = 0.27;
  const reactDur = 0.47;
  const pushLead = 0.07;
  const sendWindow = 0.23;
  const caretHz = 2;
  const dotCps = 1.1;
  const dotAmp = 5 * scale;

  // 动态排定时刻表
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const sched: Item[] = [];
  let cur = leadIn;
  messages.forEach((m, i) => {
    const len = m.text.length;
    const it = {i, from: m.from, text: m.text, len, react: m.react} as Item;
    if (m.from === 'me') {
      it.typeStart = cur;
      it.typeDur = clamp(len * charDur, typeMin, typeMax);
      it.sendAt = it.typeStart + it.typeDur + sendGap;
      it.revealAt = it.sendAt;
      it.presenceStart = it.revealAt - pushLead;
    } else {
      it.thinkStart = cur;
      it.thinkDur = clamp(len * thinkPerChar, thinkMin, thinkMax);
      it.revealAt = it.thinkStart + it.thinkDur;
      it.presenceStart = it.thinkStart;
    }
    it.reactAt = m.react ? it.revealAt + reveal + reactDelay : undefined;
    sched.push(it);
    cur = it.revealAt + reveal + (m.react ? reactDelay + reactDur : 0) + msgGap;
  });

  // 输入框文字计算
  let comp = '';
  let caretOn = 0;
  for (const s of sched) {
    if (s.from !== 'me' || t < s.typeStart! || t >= s.sendAt!) continue;
    const p = clamp01((t - s.typeStart!) / s.typeDur!);
    comp = s.text.slice(0, Math.floor(p * s.len));
    caretOn = p < 1 ? 1 : (Math.floor(t * caretHz) % 2 === 0 ? 1 : 0);
  }
  const fieldTxt = comp || '输入消息…';

  // 发送按钮反馈
  let pulse = 0;
  for (const s of sched) {
    if (s.sendAt === undefined) continue;
    const d = Math.abs(t - s.sendAt);
    if (d <= sendWindow) pulse = Math.max(pulse, 1 - d / sendWindow);
  }

  // 三点跳动
  const dotPhase = (i: number) => {
    const w = (Math.sin(Math.PI * 2 * (t * dotCps - i / 6)) + 1) / 2;
    return {y: -dotAmp * w, o: 0.45 + 0.55 * w};
  };

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        width: 480 * scale,
        height: 440 * scale,
        background: '#141c2b',
        border: `1px solid ${theme.muted}33`,
        borderRadius: 16 * scale,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      }}>
        {/* 顶部联系人信息 */}
        <div style={{
          height: 52 * scale,
          borderBottom: `1px solid ${theme.muted}22`,
          display: 'flex',
          alignItems: 'center',
          padding: `0 ${18 * scale}px`,
          gap: 12 * scale,
          background: '#111724',
        }}>
          <div style={{
            width: 30 * scale,
            height: 30 * scale,
            borderRadius: 15 * scale,
            background: theme.accent,
            color: '#0c111b',
            display: 'grid',
            placeItems: 'center',
            fontSize: 13 * scale,
            fontWeight: 800,
          }}>
            林
          </div>
          <div>
            <div style={{fontSize: 14 * scale, fontWeight: 700}}>林工 · 产品评审</div>
            <div style={{fontSize: 10 * scale, color: '#4ecb71'}}>● 在线</div>
          </div>
        </div>

        {/* 消息瀑布流 */}
        <div style={{
          flex: 1,
          padding: `${16 * scale}px ${18 * scale}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: 12 * scale,
          overflow: 'hidden',
          justifyContent: 'flex-end',
        }}>
          {sched.map((s) => {
            const present = t >= s.presenceStart;
            if (!present) return null;

            const bp = clamp01((t - s.revealAt) / reveal);
            const e = power3Out(bp);

            const inP = s.from === 'them' ? power2Out(clamp01((t - s.thinkStart!) / indIn)) : 0;
            const outP = s.from === 'them' ? 1 - clamp01((t - (s.revealAt - indOut)) / indOut) : 0;
            const indO = inP * outP;

            const rp = s.reactAt !== undefined ? clamp01((t - s.reactAt) / reactDur) : 0;
            const reactPop = s.reactAt !== undefined ? backOut(1.9)(rp) : 0;

            const isMe = s.from === 'me';

            return (
              <div key={s.i} style={{display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', position: 'relative'}}>
                {/* 对方正在输入跳动气泡 */}
                {!isMe && indO > 0.01 && (
                  <div style={{
                    opacity: indO,
                    background: '#1e293b',
                    borderRadius: 14 * scale,
                    padding: `${8 * scale}px ${14 * scale}px`,
                    display: 'flex',
                    gap: 5 * scale,
                    alignItems: 'center',
                    marginBottom: 4 * scale,
                  }}>
                    {[0, 1, 2].map((dotIdx) => {
                      const dp = dotPhase(dotIdx);
                      return (
                        <div key={dotIdx} style={{
                          width: 5 * scale,
                          height: 5 * scale,
                          borderRadius: '50%',
                          background: theme.accent,
                          transform: `translateY(${dp.y}px)`,
                          opacity: dp.o,
                        }} />
                      );
                    })}
                  </div>
                )}

                {/* 正式消息气泡 */}
                <div style={{
                  maxWidth: '82%',
                  padding: `${10 * scale}px ${14 * scale}px`,
                  borderRadius: 12 * scale,
                  background: isMe ? theme.accent : '#1c2638',
                  color: isMe ? '#0c111b' : theme.foreground,
                  fontSize: 14 * scale,
                  fontWeight: isMe ? 650 : 500,
                  lineHeight: 1.4,
                  opacity: bp,
                  transform: `translateY(${(1 - e) * 12 * scale}px) scale(${0.94 + 0.06 * e})`,
                  transformOrigin: isMe ? 'right bottom' : 'left bottom',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  position: 'relative',
                }}>
                  {s.text}
                  {/* 表情反馈贴纸 */}
                  {s.react && rp > 0.01 && (
                    <div style={{
                      position: 'absolute',
                      right: isMe ? -8 * scale : 'auto',
                      left: isMe ? 'auto' : -8 * scale,
                      bottom: -10 * scale,
                      background: '#141c2b',
                      border: `1px solid ${theme.muted}44`,
                      borderRadius: 12 * scale,
                      padding: `1px ${5 * scale}px`,
                      fontSize: 12 * scale,
                      transform: `scale(${reactPop})`,
                    }}>
                      {s.react}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 底部输入框 */}
        <div style={{
          height: 50 * scale,
          borderTop: `1px solid ${theme.muted}22`,
          display: 'flex',
          alignItems: 'center',
          padding: `0 ${14 * scale}px`,
          gap: 10 * scale,
          background: '#111724',
        }}>
          <div style={{
            flex: 1,
            height: 32 * scale,
            background: '#1a2334',
            borderRadius: 8 * scale,
            display: 'flex',
            alignItems: 'center',
            padding: `0 ${10 * scale}px`,
            fontSize: 13 * scale,
            color: comp ? theme.foreground : theme.muted,
          }}>
            <span>{fieldTxt}</span>
            {comp && caretOn === 1 && (
              <span style={{width: 2, height: 14 * scale, background: theme.accent, marginLeft: 2}} />
            )}
          </div>
          <div style={{
            width: 32 * scale,
            height: 32 * scale,
            borderRadius: 8 * scale,
            background: comp ? theme.accent : '#253042',
            color: comp ? '#0c111b' : theme.muted,
            display: 'grid',
            placeItems: 'center',
            fontSize: 14 * scale,
            transform: `scale(${1 - pulse * 0.16})`,
            transition: 'background 0.1s',
          }}>
            ↑
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
