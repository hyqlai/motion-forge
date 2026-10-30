import React from 'react';
import {MotionStage} from '../../core/MotionStage';
import type {SceneComponentProps} from '../../core/scene';

export const SvgJourneyScene: React.FC<SceneComponentProps> = ({scene, theme}) => {
  const steps = Array.isArray(scene.props.steps) ? scene.props.steps.map(String) : [];
  return (
    <MotionStage
      scene={scene}
      theme={theme}
      contentParams={{title: String(scene.props.title ?? scene.title), steps}}
    />
  );
};
