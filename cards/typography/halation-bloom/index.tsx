import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

export type HalationBloomProps = {
  text?: string;
  theme?: Theme;
  durationInFrames?: number;
};

const ZOOM_START = 8;
const IMPACT = 15;
const REBOUND_END = 17;
const POP_END = IMPACT + 6;
const FALL_END = POP_END + 20;
const SETTLE_END = FALL_END + 15;

export const HalationBloom: React.FC<HalationBloomProps> = ({
  text = '10x',
  theme,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);
  const accent = theme?.accent ?? '#ff3366';

  const zoomIn = interpolate(frame, [ZOOM_START, IMPACT], [2.4, 0.94], {
    easing: Easing.in(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rebound = interpolate(frame, [IMPACT, REBOUND_END], [0.94, 1], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const textScale = frame < IMPACT ? zoomIn : rebound;
  const textOpacity = interpolate(frame, [ZOOM_START, ZOOM_START + 3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const bloomScale = interpolate(frame, [IMPACT, POP_END], [1, 1.3], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const bloomFall = interpolate(frame, [POP_END, FALL_END], [1, 0.35], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bloomSettle = interpolate(frame, [FALL_END, SETTLE_END], [0.35, 0.22], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bloomAlpha = frame < POP_END ? 1 : frame < FALL_END ? bloomFall : bloomSettle;

  return (
    <AbsoluteFill style={{background: '#18181b', overflow: 'hidden'}}>
      <div style={{
        width: 1920,
        height: 1080,
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: '50% 50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* 底层高光晕层（Halation）：红青漫射炸裂 */}
        {frame >= IMPACT && (
          <div
            style={{
              position: 'absolute',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontSize: 280,
              fontWeight: 900,
              color: accent,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              transform: `scale(${bloomScale})`,
              opacity: bloomAlpha * 0.9,
              filter: `blur(${35 * bloomAlpha}px)`,
              textShadow: `0 0 60px ${accent}`,
              pointerEvents: 'none',
            }}
          >
            {text}
          </div>
        )}

        {/* 主体大字 */}
        <div
          style={{
            position: 'relative',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: 280,
            fontWeight: 900,
            color: '#f8fafc',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            transform: `scale(${textScale})`,
            opacity: textOpacity,
            textShadow: '0 20px 50px rgba(0,0,0,0.8)',
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
