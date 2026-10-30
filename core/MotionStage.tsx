import React from 'react';
import {CardRenderer} from './CardRenderer';
import type {SceneSpec, Theme} from './schema';

export type MotionStageProps = {
  scene: SceneSpec;
  theme: Theme;
  contentParams: Record<string, unknown>;
};

export const MotionStage: React.FC<MotionStageProps> = ({scene, theme, contentParams}) => {
  const primary = scene.motion.primary;
  if (!primary) {
    throw new Error(`Scene ${scene.id} has no primary motion card`);
  }

  const content = (
    <CardRenderer
      cardId={primary.cardId}
      params={{...contentParams, ...primary.params}}
      theme={theme}
      durationInFrames={scene.durationInFrames}
    />
  );

  if (!scene.motion.camera) return content;
  return (
    <CardRenderer
      cardId={scene.motion.camera.cardId}
      params={scene.motion.camera.params}
      theme={theme}
      durationInFrames={scene.durationInFrames}
    >
      {content}
    </CardRenderer>
  );
};
