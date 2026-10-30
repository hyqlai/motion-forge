import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {KaraokeFillSync} from '../../_shotcraft_demos/typography/type-rhythm-sync/KaraokeFillSync';
import {FontWeightPump} from '../../_shotcraft_demos/typography/type-rhythm-sync/FontWeightPump';
import type {Theme} from '../../../core/schema';

export type TypeRhythmSyncStyle = 'karaoke-fill-sync' | 'font-weight-pump';

export type TypeRhythmSyncProps = {
  style?: TypeRhythmSyncStyle;
  theme?: Theme;
  durationInFrames?: number;
};

export const TypeRhythmSync: React.FC<TypeRhythmSyncProps> = ({style = 'karaoke-fill-sync'}) => {
  const {width, height} = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  const renderVariant = () => {
    switch (style) {
    case 'karaoke-fill-sync':
      return <KaraokeFillSync />;
    case 'font-weight-pump':
      return <FontWeightPump />;
    default:
      return <KaraokeFillSync />;
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
