import {access, mkdir, readFile, realpath, rename, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';
import {filmSchema, productionStateSchema, type Asset, type FilmSpec} from '../core/schema';
import {resetForDesignRevision} from '../core/production-state';
import {createPexelsResourceProvider} from '../providers/pexels';
import type {ResourceCandidate} from '../providers/resources';
import {validateFilm} from './film-validation';

const projectIdPattern = /^[a-z0-9-]+$/;
const assetIdPattern = /^[a-z0-9-]+$/;
const aspectOrientations = new Set(['16:9', '9:16', '1:1', 'landscape', 'portrait', 'square']);
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const searchRecordSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  provider: z.literal('pexels'),
  query: z.string().min(1),
  sceneId: z.string().min(1),
  aspect: z.string().nullable(),
  searchedAt: z.string().min(1),
  candidates: z.array(z.object({
    id: z.string().min(1),
    kind: z.literal('image'),
    title: z.string().min(1),
    previewUrl: z.string().min(1),
    downloadUrl: z.string().min(1),
    sourceUrl: z.string().min(1),
    provider: z.string().min(1),
    metadata: z.record(z.string(), z.unknown()),
  })),
});

type SearchRecord = z.infer<typeof searchRecordSchema>;

export type ImageAssetDependencies = {
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
  now?: () => Date;
};

const flagValues = (args: string[], name: string): string[] => args.flatMap((value, index) => {
  if (value === name) return [args[index + 1]].filter((next): next is string => Boolean(next) && !next.startsWith('--'));
  if (value.startsWith(`${name}=`)) return [value.slice(name.length + 1)].filter(Boolean);
  return [];
});

const flag = (args: string[], name: string): string | undefined => flagValues(args, name)[0];

const writeJsonAtomic = async (file: string, value: unknown): Promise<void> => {
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporary, file);
};

const readJson = async (file: string): Promise<unknown> => JSON.parse(await readFile(file, 'utf8'));

const assertInsidePublicRoot = async (publicRoot: string, directory: string): Promise<void> => {
  const [realPublicRoot, realDirectory] = await Promise.all([realpath(publicRoot), realpath(directory)]);
  const relative = path.relative(realPublicRoot, realDirectory);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Asset destination escapes the project public directory: ${directory}`);
  }
};

const projectPaths = (root: string, id: string): {directory: string; filmFile: string; assetsFile: string; stateFile: string; publicRoot: string} => {
  if (!projectIdPattern.test(id)) throw new Error('Invalid project id');
  const directory = path.join(root, 'output', 'projects', id);
  return {
    directory,
    filmFile: path.join(directory, 'film.json'),
    assetsFile: path.join(directory, 'assets.json'),
    stateFile: path.join(directory, 'project.json'),
    publicRoot: path.join(root, 'public'),
  };
};

const readFilm = async (filmFile: string, id: string): Promise<FilmSpec> => {
  try {
    return filmSchema.parse(await readJson(filmFile));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new Error(`Project not found: ${id}`);
    throw error;
  }
};

const createProvider = (dependencies: ImageAssetDependencies) => {
  const env = dependencies.env ?? process.env;
  return createPexelsResourceProvider({
    apiKey: env.PEXELS_API_KEY ?? '',
    baseUrl: env.PEXELS_BASE_URL,
    fetchImpl: dependencies.fetchImpl,
  });
};

const sceneIdFor = (film: FilmSpec, requested: string | undefined): string => {
  const sceneId = requested ?? film.scenes[0].id;
  if (!film.scenes.some((scene) => scene.id === sceneId)) {
    throw new Error(`Unknown scene: ${sceneId}`);
  }
  return sceneId;
};

const parseCount = (raw: string | undefined): number => {
  if (raw === undefined) return 15;
  const count = Number(raw);
  if (!Number.isInteger(count) || count < 1 || count > 80) {
    throw new Error('--count must be an integer between 1 and 80');
  }
  return count;
};

const parseAspect = (raw: string | undefined): string | undefined => {
  if (raw === undefined) return undefined;
  if (!aspectOrientations.has(raw)) {
    throw new Error('--aspect must be one of 16:9, 9:16, 1:1, landscape, portrait, square');
  }
  return raw;
};

const extensionFor = (downloadUrl: string): string => {
  let extension = '';
  try {
    extension = path.extname(new URL(downloadUrl).pathname).toLowerCase();
  } catch {
    extension = path.extname(downloadUrl).toLowerCase();
  }
  return imageExtensions.has(extension) ? extension : '.jpg';
};

const assetMetadata = (
  candidate: ResourceCandidate,
  downloadedAt: string,
): Record<string, unknown> => ({
  ...candidate.metadata,
  provider: candidate.provider,
  providerId: candidate.id,
  title: candidate.title,
  previewUrl: candidate.previewUrl,
  sourcePageUrl: candidate.sourceUrl,
  downloadedAt,
});

export const searchPexelsImages = async (
  root: string,
  options: {project: string; query: string; scene?: string; count?: number; aspect?: string},
  dependencies: ImageAssetDependencies = {},
): Promise<SearchRecord> => {
  const paths = projectPaths(root, options.project);
  const film = await readFilm(paths.filmFile, options.project);
  const sceneId = sceneIdFor(film, options.scene);
  const provider = createProvider(dependencies);
  const candidates = await provider.search({
    kind: 'image',
    query: options.query,
    sceneId,
    aspect: options.aspect,
    count: options.count,
  });
  const imageCandidates = candidates.filter(
    (candidate): candidate is ResourceCandidate & {kind: 'image'} => candidate.kind === 'image',
  );
  if (imageCandidates.length !== candidates.length) {
    throw new Error('Pexels provider returned a non-image candidate');
  }
  const record: SearchRecord = {
    schemaVersion: '1.0.0',
    provider: 'pexels',
    query: options.query,
    sceneId,
    aspect: options.aspect ?? null,
    searchedAt: (dependencies.now ?? (() => new Date()))().toISOString(),
    candidates: imageCandidates,
  };
  await writeJsonAtomic(path.join(paths.directory, 'image-search.json'), record);
  return record;
};

export const fetchPexelsImage = async (
  root: string,
  options: {
    project: string;
    candidate: string;
    scene?: string;
    role?: string;
    assetId?: string;
  },
  dependencies: ImageAssetDependencies = {},
): Promise<{asset: Asset; path: string; approvalReset: boolean}> => {
  const paths = projectPaths(root, options.project);
  const film = await readFilm(paths.filmFile, options.project);
  const sceneId = sceneIdFor(film, options.scene);
  const record = searchRecordSchema.parse(await readJson(path.join(paths.directory, 'image-search.json')));
  const candidate = record.candidates.find((entry) => entry.id === options.candidate);
  if (!candidate) {
    const available = record.candidates.map((entry) => entry.id).join(', ') || 'none';
    throw new Error(`Pexels candidate ${options.candidate} is not in image-search.json; available: ${available}`);
  }

  const assetId = options.assetId ?? `pexels-${candidate.id}`;
  if (!assetIdPattern.test(assetId)) throw new Error('Asset id must use lowercase letters, numbers and hyphens');
  if (film.assets.some((asset) => asset.id === assetId)) {
    throw new Error(`Asset already exists in Film IR: ${assetId}`);
  }

  const extension = extensionFor(candidate.downloadUrl);
  const relativePath = path.posix.join('assets', options.project, `${assetId}${extension}`);
  const destination = path.join(paths.publicRoot, ...relativePath.split('/'));
  try {
    await access(destination);
    throw new Error(`Local asset file already exists: ${relativePath}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  await mkdir(path.dirname(destination), {recursive: true});
  await assertInsidePublicRoot(paths.publicRoot, path.dirname(destination));
  const provider = createProvider(dependencies);
  try {
    await provider.download(candidate, destination);
  } catch (error) {
    await rm(destination, {force: true}).catch(() => undefined);
    throw error;
  }

  const downloadedAt = (dependencies.now ?? (() => new Date()))().toISOString();
  const asset: Asset = {
    id: assetId,
    kind: 'image',
    path: relativePath,
    role: options.role ?? 'reference',
    source: candidate.sourceUrl,
    metadata: assetMetadata(candidate, downloadedAt),
  };
  const updatedFilm = filmSchema.parse({
    ...film,
    assets: [...film.assets, asset],
    scenes: film.scenes.map((scene) => scene.id === sceneId
      ? {...scene, assetIds: [...scene.assetIds, assetId]}
      : scene),
  });

  try {
    await validateFilm(updatedFilm, {publicRoot: paths.publicRoot});
  } catch (error) {
    await rm(destination, {force: true}).catch(() => undefined);
    throw error;
  }

  await writeJsonAtomic(paths.assetsFile, {assets: updatedFilm.assets});
  await writeJsonAtomic(paths.filmFile, updatedFilm);

  const state = productionStateSchema.parse(await readJson(paths.stateFile));
  const approvalReset = state.status !== 'design-review';
  if (approvalReset) {
    const note = `Pexels image ${assetId} localized at ${downloadedAt}; G1/G2 must be reconfirmed`;
    await writeJsonAtomic(paths.stateFile, resetForDesignRevision(state, note));
  }

  return {asset, path: relativePath, approvalReset};
};

export const searchImagesCommand = async (root: string, args: string[]): Promise<void> => {
  const project = flag(args, '--project');
  const query = flag(args, '--query');
  if (!project) throw new Error('search-images requires --project <id>');
  if (!query) throw new Error('search-images requires --query <text>');
  const provider = flag(args, '--provider') ?? 'pexels';
  if (provider !== 'pexels') throw new Error(`Unsupported resource provider: ${provider}`);

  const record = await searchPexelsImages(root, {
    project,
    query,
    scene: flag(args, '--scene'),
    count: parseCount(flag(args, '--count')),
    aspect: parseAspect(flag(args, '--aspect')),
  });
  console.log(`Pexels search "${record.query}" (${record.candidates.length} candidates) saved to output/projects/${project}/image-search.json`);
  for (const candidate of record.candidates) {
    console.log(`- ${candidate.id} | ${candidate.title} | ${candidate.sourceUrl}`);
  }
};

export const fetchImageCommand = async (root: string, args: string[]): Promise<void> => {
  const project = flag(args, '--project');
  const candidate = flag(args, '--candidate');
  if (!project) throw new Error('fetch-image requires --project <id>');
  if (!candidate) throw new Error('fetch-image requires --candidate <pexels-photo-id>');
  const provider = flag(args, '--provider') ?? 'pexels';
  if (provider !== 'pexels') throw new Error(`Unsupported resource provider: ${provider}`);

  const result = await fetchPexelsImage(root, {
    project,
    candidate,
    scene: flag(args, '--scene'),
    role: flag(args, '--role'),
    assetId: flag(args, '--asset-id'),
  });
  console.log(`Localized Pexels image ${result.asset.id} -> ${result.path}`);
  if (result.approvalReset) {
    console.log('Film assets changed; project returned to design-review for G1/G2 reconfirmation.');
  } else {
    console.log('Add the asset to the desired scenes before G1 review.');
  }
};
