import type {SceneDefinition} from '../core/scene';
import {KineticTitleScene} from './kinetic-title/scene';
import {StackExplainerScene} from './stack-explainer/scene';
import {SvgJourneyScene} from './svg-journey/scene';
import {CanvasMusicScene} from './canvas-music/scene';
import {ThreeLaunchScene} from './three-launch/scene';

export const sceneDefinitions: SceneDefinition[] = [
  {id: 'scene/kinetic-title', Component: KineticTitleScene},
  {id: 'scene/stack-explainer', Component: StackExplainerScene},
  {id: 'scene/svg-journey', Component: SvgJourneyScene},
  {id: 'scene/canvas-music', Component: CanvasMusicScene},
  {id: 'scene/three-launch', Component: ThreeLaunchScene},
];

export const sceneRegistry = new Map(sceneDefinitions.map((scene) => [scene.id, scene]));
