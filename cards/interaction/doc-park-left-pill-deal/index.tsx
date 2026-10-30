import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {backOut, clamp01, lerp, power1Out, power2In, power2InOut, power2Out} from '../../../core/motion';
import type {Theme} from '../../../core/schema';

export type DocParkLeftPillDealProps = {
  docTitle?: string;
  pills?: string[];
  notes?: string[];
  theme: Theme;
  durationInFrames: number;
};

export const DocParkLeftPillDeal: React.FC<DocParkLeftPillDealProps> = ({
  docTitle = '2026 行业研究报告 · 结论提炼',
  pills = ['核心壁垒在自研渲染管线', '全流程代码化替代工程文件', '交付吞吐量提升 300%'],
  notes = ['底层统一协议保障多端对齐', '不依赖本地软件即时云端出片', '每分钟制作成本降低至原本的十分之一'],
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const scale = width / 960;

  const parkAt = 0.9;
  const parkDur = 0.8;
  const parkX = -514 * scale;
  const parkScale = 0.92;
  const T0 = [1.9, 3.2, 4.5];
  const pillIn = 0.2;
  const pillLand = 0.37;
  const scrollRate = -18.75 * scale;

  // 文档驻留
  const parkP = power2InOut(clamp01((t - parkAt) / parkDur));
  const docX = lerp(0, parkX, parkP);
  const docS = lerp(1, parkScale, parkP);
  const docScrollY = scrollRate * t;

  const hintP = power1Out(clamp01((t - 1.4) / 0.4));

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      overflow: 'hidden',
    }}>
      {/* 驻留文档 */}
      <div style={{
        position: 'absolute',
        left: 130 * scale,
        top: 60 * scale,
        width: 700 * scale,
        height: 420 * scale,
        background: '#141c2b',
        border: `1px solid ${theme.muted}33`,
        borderRadius: 14 * scale,
        overflow: 'hidden',
        transformOrigin: '0% 50%',
        transform: `translateX(${docX}px) scale(${docS})`,
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          padding: `${34 * scale}px ${40 * scale}px`,
          transform: `translateY(${docScrollY}px)`,
        }}>
          <div style={{fontSize: 26 * scale, fontWeight: 700, marginBottom: 16 * scale}}>
            {docTitle}
          </div>
          <div style={{height: 12 * scale, width: '90%', background: '#223048', borderRadius: 6 * scale, marginBottom: 14 * scale}} />
          <div style={{height: 12 * scale, width: '85%', background: '#223048', borderRadius: 6 * scale, marginBottom: 14 * scale}} />
          <div style={{height: 12 * scale, width: '95%', background: '#223048', borderRadius: 6 * scale, marginBottom: 14 * scale}} />
          <div style={{height: 16 * scale, width: '60%', background: theme.accent, borderRadius: 6 * scale, marginTop: 22 * scale, opacity: 0.6}} />
          <div style={{height: 12 * scale, width: '75%', background: '#223048', borderRadius: 6 * scale, marginTop: 14 * scale}} />
          <div style={{height: 12 * scale, width: '88%', background: '#223048', borderRadius: 6 * scale, marginTop: 14 * scale}} />
        </div>
      </div>

      {/* 右侧提示 */}
      <div style={{
        position: 'absolute',
        left: 380 * scale,
        top: 68 * scale,
        fontSize: 14 * scale,
        color: theme.muted,
        letterSpacing: 1,
        opacity: hintP,
      }}>
        提炼出 3 条核心论断：
      </div>

      {/* 右侧逐张发牌药丸胶囊 */}
      <div style={{position: 'absolute', left: 380 * scale, top: 110 * scale, width: 500 * scale}}>
        {pills.slice(0, 3).map((pill, i) => {
          const at = T0[i];
          const shown = t >= at;
          if (!shown) return null;

          const op = power2Out(clamp01((t - at) / pillIn));
          const landP = backOut(1.7)(clamp01((t - at) / pillLand));
          const y = lerp(14 * scale, 0, landP);
          const s = lerp(0.94, 1, landP);

          const noteOp = power1Out(clamp01((t - (at + 0.3)) / 0.5));

          return (
            <div key={i} style={{marginBottom: 36 * scale}}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 52 * scale,
                padding: `0 ${22 * scale}px`,
                borderRadius: 26 * scale,
                background: '#192336',
                border: `1.5px solid ${i === 2 ? theme.accent : `${theme.muted}44`}`,
                fontSize: 20 * scale,
                fontWeight: 650,
                color: i === 2 ? theme.accent : theme.foreground,
                opacity: op,
                transform: `translateY(${y}px) scale(${s})`,
                transformOrigin: 'left center',
                boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
              }}>
                <i style={{
                  display: 'inline-block',
                  width: 8 * scale,
                  height: 8 * scale,
                  borderRadius: '50%',
                  background: theme.accent,
                  marginRight: 10 * scale,
                }} />
                {pill}
              </div>
              {notes[i] && (
                <div style={{
                  fontSize: 14 * scale,
                  color: theme.muted,
                  marginTop: 6 * scale,
                  marginLeft: 12 * scale,
                  opacity: noteOp,
                  lineHeight: 1.4,
                }}>
                  {notes[i]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
