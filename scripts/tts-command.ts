import {readFile, rename, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {resetForDesignRevision} from '../core/production-state';
import {filmSchema, productionStateSchema} from '../core/schema';
import {probeAudio} from '../providers/audio';
import {createFishAudioTTSProvider, FISH_AUDIO_PROVIDER_ID} from '../providers/fish-audio';
import {
  getTTSProvider,
  hasTTSProvider,
  registerTTSProvider,
  TTS_FORMATS,
  TTSProviderError,
  type TTSFormat,
  type TTSResult,
} from '../providers/tts';
import {validateFilm} from './film-validation';
import {preparePublicAssetDestination} from './public-asset-path';

export type GenerateNarrationOptions = {
  projectRoot: string;
  projectId: string;
  sceneId: string;
  providerId?: string;
  text?: string;
  voice?: string;
  format?: string;
  model?: string;
  output?: string;
};

const writeJson = async (file: string, value: unknown): Promise<void> => {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
};

const normalizePublicPath = (value: string): string => {
  if (!value.trim()) throw new Error('--out must not be empty');
  if (path.isAbsolute(value) || /^[a-z][a-z\d+.-]*:/i.test(value)) {
    throw new Error(`--out must be a project-local public path: ${value}`);
  }
  const normalized = path.posix.normalize(value.replace(/\\/g, '/'));
  if (normalized === '.' || normalized === '..' || normalized.startsWith('../') || normalized.startsWith('/')) {
    throw new Error(`--out escapes the project public directory: ${value}`);
  }
  return normalized;
};

const resolveFormat = (requested: string | undefined, outputPath: string): TTSFormat => {
  if (requested) {
    if (!TTS_FORMATS.includes(requested as TTSFormat)) {
      throw new Error(`Unsupported TTS format: ${requested} (expected ${TTS_FORMATS.join(', ')})`);
    }
    return requested as TTSFormat;
  }
  const extension = path.posix.extname(outputPath).slice(1).toLowerCase();
  return TTS_FORMATS.includes(extension as TTSFormat) ? extension as TTSFormat : 'mp3';
};

const ensureDefaultTTSProviders = (): void => {
  if (!hasTTSProvider(FISH_AUDIO_PROVIDER_ID)) {
    registerTTSProvider(createFishAudioTTSProvider());
  }
};

export const generateNarration = async (
  options: GenerateNarrationOptions,
): Promise<{assetId: string; relativePath: string}> => {
  if (!/^[a-z0-9-]+$/.test(options.projectId)) throw new Error('Invalid project id');
  const projectDirectory = path.join(options.projectRoot, 'output', 'projects', options.projectId);
  const publicRoot = path.join(options.projectRoot, 'public');
  const filmFile = path.join(projectDirectory, 'film.json');
  const film = filmSchema.parse(JSON.parse(await readFile(filmFile, 'utf8')));
  const previousFilm = JSON.stringify(film);
  const scene = film.scenes.find((item) => item.id === options.sceneId);
  if (!scene) throw new Error(`Unknown scene: ${options.sceneId}`);

  const text = options.text?.trim() || scene.narration?.trim();
  if (!text) throw new Error(`Scene ${scene.id} has no narration; pass --text <text>`);

  const outputPath = options.output ? normalizePublicPath(options.output) : undefined;
  const format = resolveFormat(options.format, outputPath ?? '');
  const relativePath = outputPath
    ?? path.posix.join('assets', options.projectId, `voice-${scene.id}.${format}`);
  const destination = await preparePublicAssetDestination({
    projectRoot: options.projectRoot,
    publicRoot,
    relativePath,
  });

  ensureDefaultTTSProviders();
  const provider = getTTSProvider(options.providerId ?? FISH_AUDIO_PROVIDER_ID);

  let result: TTSResult;
  try {
    result = await provider.synthesize({
      text,
      voice: options.voice,
      format,
      model: options.model,
    });
  } catch (error) {
    if (error instanceof TTSProviderError) {
      const status = error.status ? ` (HTTP ${error.status})` : '';
      throw new Error(`TTS ${error.code}${status}: ${error.message}`);
    }
    throw error;
  }

  const previousAudio = await readFile(destination).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
  const temporary = `${destination}.tmp-${process.pid}`;
  let probe;
  try {
    await writeFile(temporary, result.audio);
    probe = await probeAudio(temporary);
    await rename(temporary, destination);
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw new Error(`Generated narration is not decodable audio: ${relativePath} (${error instanceof Error ? error.message : error})`);
  }
  await preparePublicAssetDestination({projectRoot: options.projectRoot, publicRoot, relativePath});

  const assetId = `voice-${scene.id}`;
  const metadata = {
    provider: result.provider,
    model: result.model,
    format: result.format,
    ...(options.voice ? {voice: options.voice} : {}),
    sceneId: scene.id,
  };
  const existingIndex = film.assets.findIndex((asset) => asset.id === assetId);
  if (existingIndex >= 0) {
    const existing = film.assets[existingIndex];
    film.assets[existingIndex] = {
      ...existing,
      kind: 'voice',
      path: relativePath,
      role: 'narration',
      metadata: {...existing.metadata, ...metadata},
    };
  } else {
    film.assets.push({
      id: assetId,
      kind: 'voice',
      path: relativePath,
      role: 'narration',
      metadata,
    });
  }
  if (!scene.assetIds.includes(assetId)) scene.assetIds.push(assetId);

  // Voice 区间只使用已成功探测的真实音频时长；坏音频在写回 Film 前已经失败。
  const audioFrames = Math.max(1, Math.round(probe.durationSeconds * film.output.fps));
  const end = Math.min(scene.durationInFrames, audioFrames);
  film.audio.voice.segments = [
    ...film.audio.voice.segments.filter((segment) => segment.sceneId !== scene.id),
    {sceneId: scene.id, start: 0, end, text},
  ];

  const updated = filmSchema.parse(film);
  try {
    await validateFilm(updated, {publicRoot});
  } catch (error) {
    if (previousAudio) await writeFile(destination, previousAudio);
    else await unlink(destination).catch(() => undefined);
    throw error;
  }
  await writeJson(filmFile, updated);
  await writeJson(path.join(projectDirectory, 'assets.json'), {assets: updated.assets});

  const contentChanged = previousFilm !== JSON.stringify(updated)
    || previousAudio === undefined
    || !previousAudio.equals(result.audio);
  if (contentChanged) {
    const state = productionStateSchema.parse(JSON.parse(
      await readFile(path.join(projectDirectory, 'project.json'), 'utf8'),
    ));
    if (state.status !== 'design-review') {
      const revised = resetForDesignRevision(state, `TTS 旁白已更新（${scene.id}），原 G1/G2 审批失效`);
      await writeJson(path.join(projectDirectory, 'project.json'), revised);
    }
  }

  console.log(`Generated narration for ${scene.id} via ${result.provider} (${result.model ?? 'default model'}): public/${relativePath}`);
  console.log(`Registered asset ${assetId} in film.json`);
  return {assetId, relativePath};
};
