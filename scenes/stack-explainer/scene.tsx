import React from 'react';
import {MotionStage} from '../../core/MotionStage';
import type {SceneComponentProps} from '../../core/scene';

export const StackExplainerScene: React.FC<SceneComponentProps> = ({scene, theme}) => {
  const items = Array.isArray(scene.props.items) ? scene.props.items.map(String) : [];
  return (
    <MotionStage
      scene={scene}
      theme={theme}
      contentParams={{title: String(scene.props.title ?? scene.title), items}}
    />
  );
};
