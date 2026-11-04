import {readFile, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {filmSchema, productionStateSchema, type Asset, type FilmSpec} from '../core/schema';
import {resetForDesignRevision} from '../core/production-state';
import {probeAudio} from '../providers/audio';
import {createPixabayMusicProvider, PixabayMusicError} from '../providers/pixabay-music';
import type {ResourceCandidate} from '../providers/resources';
import {validateFilm} from './film-validation';

type BgmCommandOptions = {
  projectId: string;
  query: string;
  candidateId?: string;
  volume: number;
  loop: boolean;
  searchOnly: boolean;
};

const audioExtensions = new Set(['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac']);

const parseOptions = (args: string[]): BgmCommandOptions => {
  const values = new Map<string, string>();
  const flags = new Set<string>();
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (!value.startsWith('--')) throw new Error(`Unexpected bgm argument: ${value}`);
    const equals = value.indexOf('=');
    if (equals >= 0) {
      values.set(value.slice(0, equals), value.slice(equals + 1));
      continue;
    }
    if (['--search-only', '--loop', '--no-loop'].includes(value)) {
      flags.add(value);
      continue;
    }
    const next = args[index + 1];
    if (!next || next.startsWith('--')) throw new Error(`${value} requires a value`);
    values.set(value, next);
    index += 1;
  }

  const projectId = values.get('--project');
  if (!projectId || !/^[a-z0-9-]+$/.test(projectId)) throw new Error('bgm requires --project <id>');
  const query = values.get('--query')?.trim();
  if (!query) throw new Error('bgm requires --query "<search terms>"');
  const rawVolume = values.get('--volume');
  const volume = rawVolume === undefined ? 0.2 : Number(rawVolume);
  if (!Number.isFinite(volume) || volume < 0 || volume > 1) throw new Error('--volume must be a number between 0 and 1');
  if (flags.has('--loop') && flags.has('--no-loop')) throw new Error('--loop and --no-loop cannot be used together');

  return {
    projectId,
    query,
    candidateId: values.get('--candidate'),
    volume,
    loop: !flags.has('--no-loop'),
    searchOnly: flags.has('--search-only'),
  };
};

const formatError = (error: unknown): Error => {
  if (error instanceof PixabayMusicError) {
    return new Error(`Pixabay Music ${error.code}: ${error.message}`);
  }
  return error instanceof Error ? error : new Error(String(error));
};

const describeCandidate = (candidate: ResourceCandidate): string => {
  const author = String(candidate.metadata.author ?? 'unknown');
  const duration = Number(candidate.metadata.durationSeconds);
  const durationLabel = Number.isFinite(duration) ? `, ${duration}s` : '';
  return `- ${candidate.id} — ${candidate.title} (${author}${durationLabel})\n  ${candidate.sourceUrl}`;
};

const selectCandidate = (candidates: ResourceCandidate[], requested?: string): ResourceCandidate => {
  if (requested) {
    const match = candidates.find((candidate) =>
      candidate.id === requested || String(candidate.metadata.pixabayId) === requested,
    );
    if (!match) throw new Error(`Pixabay Music candidate not found in current results: ${requested}`);
    return match;
  }
  if (candidates.length > 1) {
    throw new Error(`Pixabay Music returned ${candidates.length} tracks; rerun with --candidate <id>:\n${candidates.map(describeCandidate).join('\n')}`);
  }
  return candidates[0];
};

const extensionFor = (candidate: ResourceCandidate): string => {
  const declared = String(candidate.metadata.fileExtension ?? '').toLowerCase();
  if (audioExtensions.has(declared)) return declared;
  try {
    const extension = path.extname(new URL(candidate.downloadUrl).pathname).toLowerCase();
    if (audioExtensions.has(extension)) return extension;
  } catch {
    // URL 由 provider 生成；解析失败时退回 mp3，并在 probe 阶段验证是否是真实音频。
  }
  return '.mp3';
};

const writeJson = async (file: string, value: unknown): Promise<void> => {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
};

const attachBgm = async (
  root: string,
  directory: string,
  film: FilmSpec,
  candidate: ResourceCandidate,
  options: BgmCommandOptions,
): Promise<void> => {
  const pixabayId = String(candidate.metadata.pixabayId ?? candidate.id).replace(/[^a-zA-Z0-9-]+/g, '-');
  const assetId = `bgm-${pixabayId}`;
  const filename = `${assetId}${extensionFor(candidate)}`;
  const relativePath = path.posix.join('assets', film.id, filename);
  const destination = path.join(root, 'public', 'assets', film.id, filename);
  const previousBgm = film.audio.bgm;

  const provider = createPixabayMusicProvider();
  try {
    await provider.download(candidate, destination);
  } catch (error) {
    throw formatError(error);
  }

  let probe;
  try {
    probe = await probeAudio(destination);
  } catch (error) {
    await rm(destination, {force: true});
    throw new Error(`Downloaded Pixabay Music file is not decodable audio: ${relativePath} (${error instanceof Error ? error.message : error})`);
  }

  const previousAsset = previousBgm ? film.assets.find((asset) => asset.path === previousBgm.src) : undefined;
  const previousInUse = previousAsset ? film.scenes.some((scene) => scene.assetIds.includes(previousAsset.id)) : false;
  const previousIsLocalBgm = previousBgm
    && previousBgm.src.startsWith(`assets/${film.id}/`)
    && !previousBgm.src.split('/').includes('..');
  if (previousAsset && previousAsset.id !== assetId && !previousInUse) {
    film.assets = film.assets.filter((asset) => asset !== previousAsset);
    if (previousAsset.id.startsWith('bgm-') && previousIsLocalBgm && previousBgm.src !== relativePath) {
      await rm(path.join(root, 'public', previousBgm.src), {force: true}).catch(() => undefined);
    }
  }

  const asset: Asset = {
    id: assetId,
    kind: 'audio',
    path: relativePath,
    role: 'bgm',
    source: candidate.sourceUrl,
    metadata: {
      ...candidate.metadata,
      provider: candidate.provider,
      title: candidate.title,
      downloadedAt: new Date().toISOString(),
      probe: {
        durationSeconds: probe.durationSeconds,
        format: probe.format,
        sampleRate: probe.sampleRate,
        channels: probe.channels,
      },
    },
  };
  film.assets = [...film.assets.filter((item) => item.id !== assetId), asset];
  film.audio.bgm = {src: relativePath, volume: options.volume, loop: options.loop};

  await validateFilm(film, {publicRoot: path.join(root, 'public')});
  await writeJson(path.join(directory, 'film.json'), film);
  await writeJson(path.join(directory, 'assets.json'), {assets: film.assets});

  const state = productionStateSchema.parse(JSON.parse(await readFile(path.join(directory, 'project.json'), 'utf8')));
  const updatedState = state.status === 'design-review'
    ? state
    : resetForDesignRevision(state, `BGM 已更换为 Pixabay Music：${candidate.title}`);
  await writeJson(path.join(directory, 'project.json'), updatedState);

  console.log(`Attached Pixabay Music BGM: ${candidate.title} by ${candidate.metadata.author ?? 'unknown'}`);
  console.log(`  source:  ${candidate.sourceUrl}`);
  console.log(`  license: Pixabay Content License (${candidate.metadata.licenseUrl ?? 'https://pixabay.com/service/license-summary/'})`);
  console.log(`  file:    public/${relativePath} (${probe.durationSeconds.toFixed(2)}s, ${probe.format})`);
  console.log(`  cue:     volume=${options.volume} loop=${options.loop}`);
  console.log(`Updated output/projects/${film.id}/film.json; project status=${updatedState.status}`);
};

export const runBgmCommand = async (root: string, args: string[]): Promise<void> => {
  const options = parseOptions(args);
  const directory = path.join(root, 'output', 'projects', options.projectId);
  const film = filmSchema.parse(JSON.parse(await readFile(path.join(directory, 'film.json'), 'utf8')));
  if (film.id !== options.projectId) {
    throw new Error(`film.id (${film.id}) must match --project (${options.projectId}) before attaching BGM`);
  }
  const provider = createPixabayMusicProvider();

  let candidates: ResourceCandidate[];
  try {
    candidates = await provider.search({
      kind: 'audio',
      query: options.query,
      sceneId: film.scenes[0].id,
    });
  } catch (error) {
    throw formatError(error);
  }

  if (candidates.length === 0) {
    throw new Error(`Pixabay Music returned no results for "${options.query}"; no BGM was downloaded and film.json was not changed`);
  }
  console.log(`Pixabay Music results for "${options.query}":`);
  for (const candidate of candidates) console.log(describeCandidate(candidate));
  if (options.searchOnly) {
    console.log('Search-only mode: film.json was not changed.');
    return;
  }

  const candidate = selectCandidate(candidates, options.candidateId);
  await attachBgm(root, directory, film, candidate, options);
};
