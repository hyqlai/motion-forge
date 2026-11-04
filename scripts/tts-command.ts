import {mkdir, readFile, rename, stat, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {filmSchema} from '../core/schema';
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
  const scene = film.scenes.find((item) => item.id === options.sceneId);
  if (!scene) throw new Error(`Unknown scene: ${options.sceneId}`);

  const text = options.text?.trim() || scene.narration?.trim();
  if (!text) throw new Error(`Scene ${scene.id} has no narration; pass --text <text>`);

  const outputPath = options.output ? normalizePublicPath(options.output) : undefined;
  const format = resolveFormat(options.format, outputPath ?? '');
  const relativePath = outputPath
    ?? path.posix.join('assets', options.projectId, `voice-${scene.id}.${format}`);
  const destination = path.resolve(publicRoot, ...relativePath.split('/'));
  const relativeToPublic = path.relative(publicRoot, destination);
  if (relativeToPublic.startsWith('..') || path.isAbsolute(relativeToPublic)) {
    throw new Error(`Output escapes the project public directory: ${relativePath}`);
  }

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

  const existed = await stat(destination).then(() => true).catch(() => false);
  await mkdir(path.dirname(destination), {recursive: true});
  const temporary = `${destination}.tmp-${process.pid}`;
  try {
    await writeFile(temporary, result.audio);
    await rename(temporary, destination);
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }

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

  const updated = filmSchema.parse(film);
  try {
    await validateFilm(updated, {publicRoot});
  } catch (error) {
    if (!existed) await unlink(destination).catch(() => undefined);
    throw error;
  }
  await writeJson(filmFile, updated);
  await writeJson(path.join(projectDirectory, 'assets.json'), {assets: updated.assets});

  console.log(`Generated narration for ${scene.id} via ${result.provider} (${result.model ?? 'default model'}): public/${relativePath}`);
  console.log(`Registered asset ${assetId} in film.json`);
  return {assetId, relativePath};
};
