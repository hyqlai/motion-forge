import type {FilmSpec, SceneSpec} from './schema';

export type TimelineScene = SceneSpec & {
  from: number;
  end: number;
};

export type Timeline = {
  fps: number;
  durationInFrames: number;
  scenes: TimelineScene[];
};

// 全片绝对帧只在编译边界生成，分镜实现始终使用局部帧。
export const compileTimeline = (film: FilmSpec): Timeline => {
  let cursor = 0;
  const scenes = film.scenes.map((scene) => {
    const from = cursor;
    cursor += scene.durationInFrames;
    return {...scene, from, end: cursor};
  });

  return {
    fps: film.output.fps,
    durationInFrames: cursor,
    scenes,
  };
};

export const getTimelineScene = (timeline: Timeline, sceneId: string): TimelineScene => {
  const scene = timeline.scenes.find((item) => item.id === sceneId);
  if (!scene) {
    throw new Error(`Unknown scene: ${sceneId}`);
  }
  return scene;
};
