import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, power2Out, power3Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type ChatGptProps = {
  promptText?: string;
  responseText?: string;
  theme: Theme;
  durationInFrames: number;
};

export const ChatGpt: React.FC<ChatGptProps> = ({
  promptText = '用三句话讲清楚什么是纯代码视频生成',
  responseText = '1. 动画所有参数全部由代码精确定义；\n2. 渲染结果 100% 幂等可复现；\n3. 彻底告别剪辑软件工程文件与黑盒渲染。',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const promptStart = 0.4;
  const promptDur = 1.0;
  const thinkDur = 0.5;
  const respStart = promptStart + promptDur + thinkDur;
  const respDur = 2.4;

  let compPrompt = '';
  if (t >= promptStart) {
    const p = clamp01((t - promptStart) / promptDur);
    compPrompt = promptText.slice(0, Math.floor(p * promptText.length));
  }

  let compResp = '';
  if (t >= respStart) {
    const p = clamp01((t - respStart) / respDur);
    compResp = responseText.slice(0, Math.floor(p * responseText.length));
  }

  const blinkOn = Math.floor(t * 2) % 2 === 0;

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
        width: 620 * scale,
        background: '#141c2b',
        border: `1px solid ${theme.muted}33`,
        borderRadius: 16 * scale,
        padding: `${24 * scale}px ${28 * scale}px`,
        boxSizing: 'border-box',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 18 * scale,
      }}>
        {/* 顶部 ChatGPT 标识 */}
        <div style={{display: 'flex', alignItems: 'center', gap: 10 * scale, borderBottom: `1px solid ${theme.muted}22`, paddingBottom: 12 * scale}}>
          <div style={{width: 24 * scale, height: 24 * scale, borderRadius: 6 * scale, background: '#10a37f', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 13 * scale, fontWeight: 900}}>
            ✦
          </div>
          <span style={{fontSize: 15 * scale, fontWeight: 750}}>ChatGPT 4o · 模型对话</span>
        </div>

        {/* 用户提问气泡 */}
        <div style={{display: 'flex', justifyContent: 'flex-end'}}>
          <div style={{
            background: '#202b3d',
            padding: `${10 * scale}px ${16 * scale}px`,
            borderRadius: 12 * scale,
            fontSize: 15 * scale,
            color: theme.foreground,
            maxWidth: '85%',
          }}>
            {compPrompt}
            {t >= promptStart && t < respStart && blinkOn && (
              <span style={{width: 2, height: 14 * scale, background: theme.accent, marginLeft: 2, display: 'inline-block'}} />
            )}
          </div>
        </div>

        {/* AI 回答气泡 */}
        {t >= respStart && (
          <div style={{display: 'flex', gap: 12 * scale, alignItems: 'flex-start'}}>
            <div style={{width: 28 * scale, height: 28 * scale, borderRadius: 6 * scale, background: '#10a37f', flexShrink: 0, display: 'grid', placeItems: 'center', color: '#fff', fontSize: 14 * scale, fontWeight: 900}}>
              ✦
            </div>
            <div style={{
              flex: 1,
              fontSize: 14 * scale,
              lineHeight: 1.6,
              color: theme.foreground,
              whiteSpace: 'pre-line',
            }}>
              {compResp}
              {t >= respStart && t < respStart + respDur && blinkOn && (
                <span style={{width: 2, height: 14 * scale, background: theme.accent, marginLeft: 2, display: 'inline-block'}} />
              )}
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
