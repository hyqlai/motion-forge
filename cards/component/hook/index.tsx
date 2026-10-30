import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import ShotComponent from '../../_brewreel/shots/hook';
import {ThemeProvider, resolveTheme} from '../../_brewreel/core/theme';
import type {Theme} from '../../../core/schema';

export type HookProps = {
  theme?: Theme;
  durationInFrames?: number;
  params?: Record<string, unknown>;
};

const defaultParams: any = {"visual": "stat", "text": "3 分钟搭建全自动视频流水线", "badge": "代码生成视频"};

export const Hook: React.FC<HookProps> = ({theme, params: userParams}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const dur = 75 / fps;
  const t = (frame / fps) % dur;

  // 画幅双模自适应计算：
  // 1. 竖屏 (9:16 / 4:5): 采用整屏 1080x1920 完整映射
  // 2. 横屏 (16:9 / 宽屏): 自动锚定核心动画区 (中心 540, 950，包围盒 840x880)，
  //    等比放大并居中对齐，消除上下冗余留白造成的微缩过小问题，横竖屏两用饱满。
  const isPortrait = height > width;
  const scale = isPortrait
    ? Math.min(width / 1080, height / 1920)
    : Math.min((height * 0.88) / 880, (width * 0.88) / 840);

  const containerStyle: React.CSSProperties = isPortrait
    ? {
        width: 1080,
        height: 1920,
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: '50% 50%',
      }
    : {
        width: 1080,
        height: 1920,
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-540px, -950px) scale(${scale})`,
        transformOrigin: '540px 950px',
      };

  const runtimeTheme = resolveTheme('aurora', theme?.accent);

  const mockMeta: any = {
    title: 'Brand Story',
    product: 'Motion Forge',
    theme: 'aurora',
    aspect: isPortrait ? '9:16' : '16:9',
    industry: 'tech',
  };

  const mergedParams = {...defaultParams, ...(userParams ?? {})};

  return (
    <AbsoluteFill style={{overflow: 'hidden', background: theme?.background ?? '#0b0e14'}}>
      {!isPortrait && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 70% 65% at 50% 50%, ${theme?.accent ?? '#3d63ff'}22 0%, transparent 72%)`,
          pointerEvents: 'none',
        }} />
      )}
      <div style={containerStyle}>
        <ThemeProvider theme={runtimeTheme}>
          <ShotComponent
            params={mergedParams}
            t={t}
            dur={dur}
            beat={0.5}
            index={0}
            isLast={false}
            mood={0.85}
            meta={mockMeta}
          />
        </ThemeProvider>
      </div>
    </AbsoluteFill>
  );
};
