import type {Asset, FilmSpec, SceneSpec} from './schema';
import {compileTimeline, type Timeline} from './timeline';

export const SFX_VOLUME = 0.8;

export type CompiledVoiceSegment = {
  sceneId: string;
  start: number;
  end: number;
  text: string;
  from: number;
  durationInFrames: number;
  src: string;
};

export type CompiledSfxEvent = {
  sceneId: string;
  frame: number;
  kind: string;
  at: number;
  src: string;
};

export type CompiledAudioTracks = {
  bgm?: FilmSpec['audio']['bgm'];
  voice: CompiledVoiceSegment[];
  sfx: CompiledSfxEvent[];
};

// 路径策略保持纯字符串实现，渲染器可以把本模块打包进浏览器；文件存在性由 CLI 校验补充。
export const assertLocalPublicPath = (value: string, label: string): string => {
  if (value.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(value) || /^[a-z][a-z\d+.-]*:/i.test(value)) {
    throw new Error(`${label} must be a project-local public path: ${value}`);
  }
  const parts: string[] = [];
  for (const part of value.replace(/\\/g, '/').split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (parts.length === 0) throw new Error(`${label} escapes the project public directory: ${value}`);
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  if (parts.length === 0) throw new Error(`${label} escapes the project public directory: ${value}`);
  return parts.join('/');
};

export const voiceAssetForScene = (film: FilmSpec, scene: SceneSpec): Asset | undefined => {
  const assets = scene.assetIds
    .map((id) => film.assets.find((asset) => asset.id === id))
    .filter((asset): asset is Asset => Boolean(asset))
    .filter((asset) => asset.kind === 'voice');
  if (assets.length > 1) {
    throw new Error(`Scene ${scene.id} has multiple voice assets; a scene can provide one narration source`);
  }
  return assets[0];
};

export const sfxAssetForKind = (film: FilmSpec, kind: string): Asset | undefined => {
  return film.assets.find((asset) => asset.id === kind && asset.kind === 'audio' && asset.role === 'sfx');
};

// 三轨结构校验与全片绝对帧换算共用同一入口，避免工作台和 CLI 出现两份事实源。
export const validateAudioTracks = (
  film: FilmSpec,
  timeline: Timeline = compileTimeline(film),
): CompiledAudioTracks => {
  if (film.audio.bgm) {
    assertLocalPublicPath(film.audio.bgm.src, 'BGM source');
  }

  const scenes = new Map(timeline.scenes.map((scene) => [scene.id, scene]));
  const voice: CompiledVoiceSegment[] = [];
  const voicesByScene = new Map<string, {start: number; end: number}[]>();

  for (const segment of film.audio.voice?.segments ?? []) {
    const scene = scenes.get(segment.sceneId);
    if (!scene) throw new Error(`Voice segment references unknown scene: ${segment.sceneId}`);
    if (segment.start >= segment.end) {
      throw new Error(`Voice segment start must be before end in scene ${segment.sceneId}: ${segment.start} -> ${segment.end}`);
    }
    if (segment.end > scene.durationInFrames) {
      throw new Error(`Voice segment ends after scene duration in ${segment.sceneId}: ${segment.end} > ${scene.durationInFrames}`);
    }
    const asset = voiceAssetForScene(film, scene);
    if (!asset) {
      throw new Error(`Voice segment in ${segment.sceneId} has no voice asset; register a kind "voice" asset and reference it from scene.assetIds`);
    }
    assertLocalPublicPath(asset.path, `Voice asset ${asset.id}`);
    voice.push({
      sceneId: segment.sceneId,
      start: segment.start,
      end: segment.end,
      text: segment.text,
      from: scene.from + segment.start,
      durationInFrames: segment.end - segment.start,
      src: asset.path,
    });
    const ranges = voicesByScene.get(segment.sceneId) ?? [];
    ranges.push({start: segment.start, end: segment.end});
    voicesByScene.set(segment.sceneId, ranges);
  }

  for (const [sceneId, ranges] of voicesByScene) {
    const sorted = [...ranges].sort((left, right) => left.start - right.start);
    for (let index = 1; index < sorted.length; index += 1) {
      if (sorted[index].start < sorted[index - 1].end) {
        throw new Error(`Voice segments overlap in scene ${sceneId}: ${sorted[index - 1].end} > ${sorted[index].start}`);
      }
    }
  }

  const sfx: CompiledSfxEvent[] = [];
  for (const event of film.audio.sfx?.events ?? []) {
    const scene = scenes.get(event.sceneId);
    if (!scene) throw new Error(`SFX event references unknown scene: ${event.sceneId}`);
    if (event.frame >= scene.durationInFrames) {
      throw new Error(`SFX event frame is outside scene duration in ${event.sceneId}: ${event.frame} >= ${scene.durationInFrames}`);
    }
    const asset = sfxAssetForKind(film, event.kind);
    if (!asset) {
      throw new Error(`SFX event kind "${event.kind}" has no SFX asset; register an audio asset with role "sfx" and use its id as kind`);
    }
    assertLocalPublicPath(asset.path, `SFX asset ${asset.id}`);
    sfx.push({
      sceneId: event.sceneId,
      frame: event.frame,
      kind: event.kind,
      at: scene.from + event.frame,
      src: asset.path,
    });
  }

  return {bgm: film.audio.bgm, voice, sfx};
};

export const compileAudioTracks = (
  film: FilmSpec,
  timeline: Timeline = compileTimeline(film),
): CompiledAudioTracks => validateAudioTracks(film, timeline);
