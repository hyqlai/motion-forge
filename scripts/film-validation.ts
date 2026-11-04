import {access, stat} from 'node:fs/promises';
import path from 'node:path';
import {cardRegistry} from '../cards/registry';
import {assertLocalPublicPath, validateAudioTracks} from '../core/audio';
import type {FilmSpec} from '../core/schema';
import {compileTimeline} from '../core/timeline';
import {sceneRegistry} from '../scenes/registry';

const assertPublicFile = async (publicRoot: string, value: string, label: string): Promise<void> => {
  const normalized = assertLocalPublicPath(value, label);
  const file = path.resolve(publicRoot, ...normalized.split('/'));
  const relative = path.relative(path.resolve(publicRoot), file);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} escapes the project public directory: ${value}`);
  }
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error(`${label} is not a file: ${value}`);
    await access(file);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(label)) throw error;
    throw new Error(`${label} does not exist in the project: ${value}`);
  }
};

export const validateFilm = async (
  film: FilmSpec,
  options: {publicRoot: string},
): Promise<void> => {
  const timeline = compileTimeline(film);
  const expectedDuration = film.scenes.reduce((total, scene) => total + scene.durationInFrames, 0);
  if (timeline.durationInFrames !== expectedDuration) throw new Error('Timeline duration mismatch');

  const sceneIds = new Set<string>();
  const assetIds = new Set(film.assets.map((asset) => asset.id));
  if (assetIds.size !== film.assets.length) throw new Error('Film asset ids must be unique');

  for (const scene of film.scenes) {
    if (sceneIds.has(scene.id)) throw new Error(`Duplicate scene id: ${scene.id}`);
    sceneIds.add(scene.id);
    if (!sceneRegistry.has(scene.sceneComponent)) throw new Error(`Missing scene component: ${scene.sceneComponent}`);
    for (const motion of [scene.motion.primary, scene.motion.camera, scene.motion.text, scene.motion.transitionOut]) {
      if (motion && !cardRegistry.has(motion.cardId)) throw new Error(`Missing card: ${motion.cardId}`);
    }
    for (const assetId of scene.assetIds) {
      if (!assetIds.has(assetId)) throw new Error(`Missing asset ${assetId} in ${scene.id}`);
    }
  }

  for (const asset of film.assets) {
    await assertPublicFile(options.publicRoot, asset.path, `Asset ${asset.id}`);
  }

  const tracks = validateAudioTracks(film, timeline);
  if (tracks.bgm) await assertPublicFile(options.publicRoot, tracks.bgm.src, 'BGM source');
  for (const segment of tracks.voice) {
    await assertPublicFile(
      options.publicRoot,
      segment.src,
      `Voice segment ${segment.sceneId} [${segment.start}-${segment.end}]`,
    );
  }
  for (const event of tracks.sfx) {
    await assertPublicFile(options.publicRoot, event.src, `SFX event ${event.sceneId}@${event.frame}`);
  }
};
