import React from 'react';
import {MotionStage} from '../../core/MotionStage';
import type {SceneComponentProps} from '../../core/scene';

export const KineticTitleScene: React.FC<SceneComponentProps> = ({scene, theme}) => {
  return (
    <MotionStage
      scene={scene}
      theme={theme}
      contentParams={{
        text: String(scene.props.text ?? scene.onScreenText.join('\n')),
        eyebrow: scene.props.eyebrow,
        accentWord: scene.props.accentWord,
      }}
    />
  );
};
