import type {ComponentType} from 'react';
import type {SceneSpec, Theme} from './schema';

export type SceneComponentProps = {
  scene: SceneSpec;
  theme: Theme;
};

export type SceneDefinition = {
  id: string;
  Component: ComponentType<SceneComponentProps>;
};
