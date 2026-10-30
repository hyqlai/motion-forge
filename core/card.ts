import type {ComponentType, ReactNode} from 'react';
import type {MotionCardManifest, Theme} from './schema';

export type MotionCardProps = {
  theme: Theme;
  durationInFrames: number;
  children?: ReactNode;
  [key: string]: unknown;
};

export type MotionCardDefinition = {
  manifest: MotionCardManifest;
  Component: ComponentType<any>;
};
