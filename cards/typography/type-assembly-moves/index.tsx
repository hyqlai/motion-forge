import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {SplitTextStagger} from './SplitTextStagger';
import {TextOnPath} from './TextOnPath';
import {LetterformDriftAssembly} from './LetterformDriftAssembly';
import type {Theme} from '../../../core/schema';

export type TypeAssemblyMovesStyle = 'split-text-stagger' | 'text-on-path' | 'drift-assembly';

export type TypeAssemblyMovesProps = {
  style?: TypeAssemblyMovesStyle;
  theme?: Theme;
  durationInFrames?: number;
};

export const TypeAssemblyMoves: React.FC<TypeAssemblyMovesProps> = ({style = 'split-text-stagger'}) => {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  const renderVariant = () => {
    switch (style) {
    case 'split-text-stagger':
      return <SplitTextStagger />;
    case 'text-on-path':
      return <TextOnPath />;
    case 'drift-assembly':
      return <LetterformDriftAssembly />;
    default:
      return <SplitTextStagger />;
    }
  };

  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#0b0e14'}}>
      <div style={{
        width: 1920,
        height: 1080,
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: '50% 50%',
      }}>
        {renderVariant()}
      </div>
    </AbsoluteFill>
  );
};
