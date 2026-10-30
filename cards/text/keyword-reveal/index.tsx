import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

export type KeywordRevealProps = {
  text: string;
  eyebrow?: string;
  accentWord?: string;
  theme: Theme;
  durationInFrames: number;
};

export const KeywordReveal: React.FC<KeywordRevealProps> = ({
  text,
  eyebrow,
  accentWord,
  theme,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const lines = text.split('\n');
  const scale = width / 960;

  return (
    <AbsoluteFill style={{
      background: theme.background,
      color: theme.foreground,
      fontFamily: theme.fontFamily,
      justifyContent: 'center',
      padding: 72 * scale,
    }}>
      {eyebrow ? <div style={{
        color: theme.muted,
        fontSize: 18 * scale,
        letterSpacing: 5 * scale,
        marginBottom: 30 * scale,
        textTransform: 'uppercase',
      }}>{eyebrow}</div> : null}
      <div style={{fontSize: 64 * scale, fontWeight: 760, lineHeight: 1.18}}>
        {lines.map((line, index) => {
          const enter = spring({
            frame: frame - index * 8,
            fps,
            config: {damping: 18, stiffness: 130, mass: 0.8},
          });
          const y = interpolate(enter, [0, 1], [54 * scale, 0]);
          const content = accentWord && line.includes(accentWord)
            ? line.split(accentWord).flatMap((part, partIndex) => [
                <span key={`part-${partIndex}`}>{part}</span>,
                ...(partIndex === 0 ? [<span key="accent" style={{color: theme.accent}}>{accentWord}</span>] : []),
              ])
            : line;
          return (
            <div key={`${line}-${index}`} style={{overflow: 'hidden'}}>
              <div style={{opacity: enter, transform: `translateY(${y}px)`}}>{content}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
