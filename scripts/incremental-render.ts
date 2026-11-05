import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {access, mkdir, readFile, readdir, rename, rm, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {compileAudioTracks} from '../core/audio';
import type {Asset, FilmSpec, SceneSpec} from '../core/schema';
import {compileTimeline, type TimelineScene} from '../core/timeline';
import {validateFinalFilm} from './final-media-validation';

const CACHE_VERSION = 2;
const HASH_VERSION = 4;
const VIDEO_DIRECTORY = 'video';
const AUDIO_DIRECTORY = 'audio';
const TEMP_DIRECTORY = 'tmp';
const RUNTIME_DIRECTORIES = ['core', 'cards', 'scenes'];
const RUNTIME_PUBLIC_DIRECTORIES = ['public/textures', 'public/legacy-textures', 'public/audio', 'public/photos'];
const RUNTIME_FILES = [
  'remotion.config.ts', 'package.json', 'package-lock.json',
  'scripts/incremental-render.ts', 'scripts/final-media-validation.ts', 'scripts/motion-forge.ts',
];
const RUNTIME_EXTENSIONS = new Set([
  '.ts', '.tsx', '.json', '.png', '.jpg', '.jpeg', '.svg', '.webp',
  '.mp3', '.wav', '.mp4', '.webm', '.woff', '.woff2', '.ttf', '.glsl', '.glb', '.hdr',
]);
// 仅剔除明确不参与画面的时间戳与临时路径；metadata 内的视觉参数必须保留。
const UNSTABLE_HASH_KEYS = new Set([
  'downloadedat', 'createdat', 'updatedat', 'renderedat', 'generatedat',
  'transcribedat', 'timestamp', 'expiresat', 'temppath', 'temporarypath', 'tmppath',
  'tmpdir', 'tempdir', 'cachepath', 'cachedirectory', 'sourcepath',
]);
const FFMPEG = process.env.FFMPEG_PATH ?? 'ffmpeg';
const FFPROBE = process.env.FFPROBE_PATH ?? 'ffprobe';
const AUDIO_BITRATE = '320k';

export type IncrementalRenderOptions = {
  projectRoot: string;
  projectDirectory: string;
  film: FilmSpec;
  remotionFlags: string[];
  runRemotion: (args: string[]) => Promise<void>;
  log?: (message: string) => void;
};

type MediaProbe = {
  format?: {duration?: string};
  streams?: {
    codec_type?: string;
    codec_name?: string;
    width?: number;
    height?: number;
    nb_frames?: string;
    duration?: string;
  }[];
};

type AssetFingerprint = {
  id: string;
  kind: string;
  path: string;
  role: string;
  sha256: string;
};

type CachedScene = {
  sceneId: string;
  sceneHash: string;
  videoHash: string;
  from: number;
  durationInFrames: number;
  file: string;
  bytes: number;
  sha256: string;
  renderedAt: string;
};

type CachedAudio = {
  hash: string;
  file: string;
  bytes: number;
  sha256: string;
  renderedAt: string;
};

type RenderManifest = {
  version: number;
  hashVersion: number;
  projectId: string;
  filmId: string;
  output: {width: number; height: number; fps: number; durationInFrames: number};
  rendererFingerprint: string;
  scenes: CachedScene[];
  audio: CachedAudio | null;
  completedAt: string;
};

type RenderReason = 'content' | 'boundary' | 'cache-miss';

type ScenePlan = {
  scene: TimelineScene;
  sceneHash: string;
  videoHash: string;
  file: string;
  reuse: boolean;
  renderReason?: RenderReason;
  audioChanged: boolean;
  previous?: CachedScene;
};

type AudioPlan = {
  enabled: boolean;
  hash: string;
  file: string;
  reuse: boolean;
  previous?: CachedAudio;
};

type RenderPlan = {
  scenes: ScenePlan[];
  audio: AudioPlan;
};

const sha256 = (value: string | Buffer): string => createHash('sha256').update(value).digest('hex');

const hashFile = (file: string): Promise<string> => new Promise((resolve, reject) => {
  const hash = createHash('sha256');
  const stream = createReadStream(file);
  stream.on('data', (chunk) => hash.update(chunk));
  stream.once('error', reject);
  stream.once('end', () => resolve(hash.digest('hex')));
});

const OMIT_FROM_HASH = Symbol('omit-from-hash');

// 哈希输入必须与对象键顺序、JSON 格式和临时 metadata 无关；下载时间、生成时间与临时路径不参与内容版本。
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize).filter((entry) => entry !== OMIT_FROM_HASH);
  if (value && typeof value === 'object') {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .filter((key) => !UNSTABLE_HASH_KEYS.has(key.toLowerCase()))
      .map((key) => [key, canonicalize((value as Record<string, unknown>)[key])] as const)
      .filter((entry) => entry[1] !== OMIT_FROM_HASH);
    if (entries.length === 0 && Object.keys(value as Record<string, unknown>).length > 0) return OMIT_FROM_HASH;
    return Object.fromEntries(entries);
  }
  return value;
};

const hashJson = (value: unknown): string => sha256(JSON.stringify(canonicalize(value)));

// gl 等渲染参数会改变画面，但浏览器绝对路径属于临时环境信息，只保留可执行文件名。
const renderSettingsFor = (remotionFlags: string[]): Record<string, string | null> => {
  const value = (name: string): string | null => {
    const flag = remotionFlags.find((item) => item.startsWith(`${name}=`));
    return flag ? flag.slice(name.length + 1) : null;
  };
  const browser = value('--browser-executable');
  return {
    gl: value('--gl') ?? 'swangle',
    concurrency: value('--concurrency'),
    browserExecutable: browser ? path.basename(browser) : null,
  };
};

const listRuntimeFiles = async (root: string, directory: string, optional = false): Promise<string[]> => {
  const absolute = path.join(root, directory);
  let entries;
  try {
    entries = await readdir(absolute, {withFileTypes: true});
  } catch (error) {
    if (optional && (error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  const files: string[] = [];
  for (const entry of entries) {
    const relative = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listRuntimeFiles(root, relative, optional));
      continue;
    }
    if (entry.isFile() && RUNTIME_EXTENSIONS.has(path.extname(entry.name))) files.push(relative);
  }
  return files;
};

// 运行时代码、卡片资源和全局静态素材都可能改变画面，统一纳入渲染器内容版本，不能只信任 film.json。
const computeRendererFingerprint = async (root: string): Promise<string> => {
  const files: string[] = [...RUNTIME_FILES];
  for (const directory of RUNTIME_DIRECTORIES) files.push(...await listRuntimeFiles(root, directory));
  for (const directory of RUNTIME_PUBLIC_DIRECTORIES) files.push(...await listRuntimeFiles(root, directory, true));
  files.sort();
  const hash = createHash('sha256');
  hash.update(`motion-forge-renderer-v${HASH_VERSION}\0`);
  for (const relative of files) {
    hash.update(`${relative}\0`);
    hash.update(await readFile(path.join(root, ...relative.split('/'))));
    hash.update('\0');
  }
  return hash.digest('hex');
};

const publicFile = (projectRoot: string, relative: string): string => {
  return path.join(projectRoot, 'public', ...relative.replace(/\\/g, '/').split('/'));
};

const runCommand = async (command: string, args: string[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    const child = execFile(command, args, {maxBuffer: 40 * 1024 * 1024}, (error, stdout, stderr) => {
      if (!error) {
        resolve(`${stdout}${stderr}`);
        return;
      }
      const message = `${command} ${args.join(' ')} failed: ${error.message}\n${stderr || stdout}`.trim();
      reject(new Error(message));
    });
    child.once('error', reject);
  });
};

const probeMedia = async (file: string): Promise<MediaProbe> => JSON.parse(await runCommand(FFPROBE, [
  '-v', 'error',
  '-show_entries', 'format=duration:stream=codec_type,codec_name,width,height,nb_frames,duration',
  '-of', 'json',
  file,
])) as MediaProbe;

const decodeMedia = async (file: string): Promise<void> => {
  await runCommand(FFMPEG, ['-v', 'error', '-xerror', '-i', file, '-f', 'null', '-']);
};

const isFile = async (file: string): Promise<boolean> => {
  try {
    await access(file);
    const info = await stat(file);
    return info.isFile() && info.size > 0;
  } catch {
    return false;
  }
};

const videoCacheFile = (hash: string): string => path.posix.join(VIDEO_DIRECTORY, `${hash}.mp4`);
const audioCacheFile = (hash: string): string => path.posix.join(AUDIO_DIRECTORY, `${hash}.wav`);

const readManifest = async (file: string, projectDirectory: string, film: FilmSpec): Promise<RenderManifest | undefined> => {
  let value: unknown;
  try {
    value = JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return undefined;
  }
  if (!value || typeof value !== 'object') return undefined;
  const manifest = value as Partial<RenderManifest>;
  if (manifest.version !== CACHE_VERSION || manifest.hashVersion !== HASH_VERSION) return undefined;
  if (manifest.projectId !== path.basename(projectDirectory) || manifest.filmId !== film.id) return undefined;
  if (typeof manifest.rendererFingerprint !== 'string' || !Array.isArray(manifest.scenes)) return undefined;
  const output = manifest.output;
  if (!output
    || output.width !== film.output.width
    || output.height !== film.output.height
    || output.fps !== film.output.fps) {
    return undefined;
  }
  return manifest as RenderManifest;
};

// 视频段只按视觉内容版本与文件哈希复用；音频引用变化由独立音频轨道处理，避免无谓重渲画面。
const usableVideoCache = async (projectDirectory: string, entry: CachedScene | undefined, scene: SceneSpec): Promise<boolean> => {
  if (!entry || entry.sceneId !== scene.id || entry.file !== videoCacheFile(entry.videoHash)) return false;
  if (entry.durationInFrames !== scene.durationInFrames) return false;
  const file = path.join(projectDirectory, '.render-cache', ...entry.file.split('/'));
  if (!await isFile(file)) return false;
  try {
    if (entry.sha256 !== await hashFile(file)) return false;
    const probe = await probeMedia(file);
    const video = probe.streams?.find((stream) => stream.codec_type === 'video');
    if (!video) return false;
    if (Number(video.nb_frames) !== scene.durationInFrames) return false;
    return Number.isFinite(Number(probe.format?.duration));
  } catch {
    return false;
  }
};

const usableAudioCache = async (projectDirectory: string, entry: CachedAudio | undefined, expectedFrames: number, fps: number): Promise<boolean> => {
  if (!entry || entry.file !== audioCacheFile(entry.hash)) return false;
  const file = path.join(projectDirectory, '.render-cache', ...entry.file.split('/'));
  if (!await isFile(file)) return false;
  try {
    if (entry.sha256 !== await hashFile(file)) return false;
    const probe = await probeMedia(file);
    const audio = probe.streams?.find((stream) => stream.codec_type === 'audio');
    if (!audio) return false;
    const duration = Number(probe.format?.duration);
    return Number.isFinite(duration) && Math.abs(duration - expectedFrames / fps) <= 0.1;
  } catch {
    return false;
  }
};

const collectAssetFingerprints = async (
  projectRoot: string,
  assets: Asset[],
  cache: Map<string, string>,
): Promise<AssetFingerprint[]> => {
  const result: AssetFingerprint[] = [];
  for (const asset of assets) {
    let digest = cache.get(asset.path);
    if (!digest) {
      digest = await hashFile(publicFile(projectRoot, asset.path));
      cache.set(asset.path, digest);
    }
    result.push({id: asset.id, kind: asset.kind, path: asset.path, role: asset.role, sha256: digest});
  }
  return result;
};

const digestPublicFile = async (projectRoot: string, relative: string, cache: Map<string, string>): Promise<string> => {
  let digest = cache.get(relative);
  if (digest) return digest;
  digest = await hashFile(publicFile(projectRoot, relative));
  cache.set(relative, digest);
  return digest;
};

const sceneVisualPayload = (
  film: FilmSpec,
  scene: SceneSpec,
  assets: AssetFingerprint[],
  rendererFingerprint: string,
  renderSettings: Record<string, string | null>,
  boundary: {incomingTransitionFrom: string | null; outgoingTransitionTo: string | null},
): Record<string, unknown> => ({
  version: HASH_VERSION,
  output: film.output,
  theme: film.theme,
  rendererFingerprint,
  renderSettings,
  boundary,
  scene: {
    id: scene.id,
    title: scene.title,
    intent: scene.intent,
    semantic: scene.semantic,
    durationInFrames: scene.durationInFrames,
    onScreenText: scene.onScreenText,
    narration: scene.narration,
    assetIds: scene.assetIds,
    layout: scene.layout,
    renderer: scene.renderer,
    sceneComponent: scene.sceneComponent,
    motion: scene.motion,
    props: scene.props,
  },
  assets,
});

const buildPlan = async (
  projectRoot: string,
  projectDirectory: string,
  film: FilmSpec,
  previous: RenderManifest | undefined,
  remotionFlags: string[],
): Promise<{plan: RenderPlan; rendererFingerprint: string}> => {
  const timeline = compileTimeline(film);
  const audio = compileAudioTracks(film, timeline);
  const rendererFingerprint = await computeRendererFingerprint(projectRoot);
  const renderSettings = renderSettingsFor(remotionFlags);
  // 渲染器内容版本变化会让全部旧帧失效，不能沿用旧基线，即使分镜 ID 与脚本都没变。
  const baseline = previous?.rendererFingerprint === rendererFingerprint ? previous : undefined;
  const assetDigestCache = new Map<string, string>();
  const assetsById = new Map(film.assets.map((asset) => [asset.id, asset]));
  const bgm = audio.bgm
    ? {
      src: audio.bgm.src,
      volume: audio.bgm.volume,
      loop: audio.bgm.loop,
      sha256: await digestPublicFile(projectRoot, audio.bgm.src, assetDigestCache),
    }
    : null;
  const voiceFingerprints = await Promise.all(audio.voice.map(async (segment) => ({
    sceneId: segment.sceneId,
    start: segment.start,
    end: segment.end,
    text: segment.text,
    from: segment.from,
    durationInFrames: segment.durationInFrames,
    src: segment.src,
    sha256: await digestPublicFile(projectRoot, segment.src, assetDigestCache),
  })));
  const sfxFingerprints = await Promise.all(audio.sfx.map(async (event) => ({
    sceneId: event.sceneId,
    frame: event.frame,
    kind: event.kind,
    at: event.at,
    src: event.src,
    sha256: await digestPublicFile(projectRoot, event.src, assetDigestCache),
  })));

  const previousScenes = new Map((baseline?.scenes ?? []).map((entry) => [entry.sceneId, entry]));
  const scenePlans: ScenePlan[] = [];
  for (const [index, scene] of timeline.scenes.entries()) {
    const sceneAssets = [];
    for (const assetId of scene.assetIds) {
      const asset = assetsById.get(assetId);
      if (!asset) throw new Error(`Scene ${scene.id} references missing asset ${assetId}`);
      sceneAssets.push(asset);
    }
    const assets = await collectAssetFingerprints(projectRoot, sceneAssets, assetDigestCache);
    const previousScene = timeline.scenes[index - 1];
    const nextScene = timeline.scenes[index + 1];
    // 转场卡可能引用相邻分镜，边界关系本身必须进入内容哈希，避免重排后错误复用旧帧。
    const boundary = {
      incomingTransitionFrom: previousScene?.motion.transitionOut ? previousScene.id : null,
      outgoingTransitionTo: scene.motion.transitionOut ? nextScene?.id ?? null : null,
    };
    const sceneVoice = voiceFingerprints
      .filter((segment) => segment.sceneId === scene.id)
      .map(({sceneId, start, end, text, src, sha256}) => ({sceneId, start, end, text, src, sha256}));
    const sceneSfx = sfxFingerprints
      .filter((event) => event.sceneId === scene.id)
      .map(({sceneId, frame, kind, src, sha256}) => ({sceneId, frame, kind, src, sha256}));
    const visualPayload = sceneVisualPayload(film, scene, assets, rendererFingerprint, renderSettings, boundary);
    const videoHash = hashJson(visualPayload);
    const sceneHash = hashJson({...visualPayload, audio: {bgm, voice: sceneVoice, sfx: sceneSfx}});
    const file = videoCacheFile(videoHash);
    const candidate = previousScenes.get(scene.id);
    const videoMatches = Boolean(candidate)
      && candidate!.videoHash === videoHash
      && candidate!.file === file
      && candidate!.durationInFrames === scene.durationInFrames;
    const reusable = videoMatches && await usableVideoCache(projectDirectory, candidate, scene);
    scenePlans.push({
      scene,
      sceneHash,
      videoHash,
      file,
      reuse: reusable,
      renderReason: reusable ? undefined : videoMatches ? 'cache-miss' : 'content',
      audioChanged: Boolean(candidate && candidate.sceneHash !== sceneHash && candidate.videoHash === videoHash),
      previous: candidate?.videoHash === videoHash ? candidate : undefined,
    });
  }

  // 变化分镜的前一镜若声明 transitionOut，或变化分镜自身声明 transitionOut，则相邻边界必须一起重渲。
  const changedIndices = scenePlans.flatMap((entry, index) =>
    (!entry.previous || entry.previous.videoHash !== entry.videoHash) ? [index] : []);
  for (const index of changedIndices) {
    const incoming = scenePlans[index - 1];
    if (incoming?.reuse && scenePlans[index - 1].scene.motion.transitionOut) {
      incoming.reuse = false;
      incoming.renderReason = 'boundary';
    }
    const outgoing = scenePlans[index + 1];
    if (outgoing?.reuse && scenePlans[index].scene.motion.transitionOut) {
      outgoing.reuse = false;
      outgoing.renderReason = 'boundary';
    }
  }

  const hasAudio = Boolean(audio.bgm) || audio.voice.length > 0 || audio.sfx.length > 0;
  let audioPlan: AudioPlan;
  if (hasAudio) {
    const audioHash = hashJson({
      version: HASH_VERSION,
      rendererFingerprint,
      renderSettings,
      fps: film.output.fps,
      durationInFrames: timeline.durationInFrames,
      bgm,
      voice: voiceFingerprints,
      sfx: sfxFingerprints,
    });
    const file = audioCacheFile(audioHash);
    const candidate = baseline?.audio ?? undefined;
    const reuse = candidate?.hash === audioHash
      && await usableAudioCache(projectDirectory, candidate, timeline.durationInFrames, film.output.fps);
    audioPlan = {
      enabled: true,
      hash: audioHash,
      file,
      reuse,
      previous: candidate?.hash === audioHash ? candidate : undefined,
    };
  } else {
    audioPlan = {enabled: false, hash: '', file: '', reuse: true};
  }

  return {
    plan: {scenes: scenePlans, audio: audioPlan},
    rendererFingerprint,
  };
};

const verifyVideoChunk = async (file: string, scene: SceneSpec, film: FilmSpec): Promise<void> => {
  const probe = await probeMedia(file);
  const video = probe.streams?.find((stream) => stream.codec_type === 'video');
  if (!video) throw new Error(`Rendered scene ${scene.id} has no video stream`);
  if (video.codec_name !== 'h264') throw new Error(`Rendered scene ${scene.id} uses ${video.codec_name}, expected h264`);
  if (Number(video.nb_frames) !== scene.durationInFrames) {
    throw new Error(`Rendered scene ${scene.id} has ${video.nb_frames} frames, expected ${scene.durationInFrames}`);
  }
  if (video.width !== film.output.width || video.height !== film.output.height) {
    throw new Error(`Rendered scene ${scene.id} dimensions do not match the film output`);
  }
  await decodeMedia(file);
};

const verifyAudioTrack = async (file: string, durationInFrames: number, fps: number): Promise<void> => {
  const probe = await probeMedia(file);
  const audio = probe.streams?.find((stream) => stream.codec_type === 'audio');
  if (!audio) throw new Error('Rendered audio track has no audio stream');
  const duration = Number(probe.format?.duration);
  if (!Number.isFinite(duration) || Math.abs(duration - durationInFrames / fps) > 0.1) {
    throw new Error(`Rendered audio track duration ${duration}s does not match ${durationInFrames / fps}s`);
  }
  await decodeMedia(file);
};

const verifyFinalFilm = async (
  file: string,
  film: FilmSpec,
  durationInFrames: number,
  hasAudio: boolean,
): Promise<void> => {
  await validateFinalFilm({
    file,
    label: 'Final incremental film',
    film,
    expectedFrames: durationInFrames,
    hasAudio,
  });
};

const writeManifest = async (file: string, manifest: RenderManifest): Promise<void> => {
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(manifest, null, 2)}\n`);
  await rename(temporary, file);
};

export const renderFilmIncrementally = async (options: IncrementalRenderOptions): Promise<void> => {
  const {projectRoot, projectDirectory, film, remotionFlags, runRemotion} = options;
  const log = options.log ?? console.log;
  const timeline = compileTimeline(film);
  const cacheDirectory = path.join(projectDirectory, '.render-cache');
  const manifestFile = path.join(cacheDirectory, 'manifest.json');
  const temporaryDirectory = path.join(cacheDirectory, TEMP_DIRECTORY);
  await mkdir(temporaryDirectory, {recursive: true});
  await mkdir(path.join(cacheDirectory, VIDEO_DIRECTORY), {recursive: true});
  await mkdir(path.join(cacheDirectory, AUDIO_DIRECTORY), {recursive: true});

  const previous = await readManifest(manifestFile, projectDirectory, film);
  const {plan, rendererFingerprint} = await buildPlan(projectRoot, projectDirectory, film, previous, remotionFlags);

  const renderedScenes = plan.scenes.filter((entry) => !entry.reuse);
  const reusedScenes = plan.scenes.filter((entry) => entry.reuse);
  const reasonLabel = (reason: RenderReason | undefined): string => reason === 'boundary'
    ? '转场边界'
    : reason === 'cache-miss' ? '缓存失效' : '内容变化';
  const audioLabel = plan.audio.enabled ? (plan.audio.reuse ? '复用' : '重渲') : '无';
  log(`增量渲染计划：共 ${plan.scenes.length} 个分镜，重渲 ${renderedScenes.length} 镜，复用 ${reusedScenes.length} 镜；音频轨道${audioLabel}`);
  for (const entry of plan.scenes) {
    const reason = entry.reuse
      ? (entry.audioChanged ? '音频引用变化' : '内容版本匹配')
      : reasonLabel(entry.renderReason);
    log(`  ${entry.reuse ? '复用分镜' : '重渲分镜'} ${entry.scene.id} 原因=${reason} sceneHash=${entry.sceneHash.slice(0, 12)} videoHash=${entry.videoHash.slice(0, 12)}`);
  }
  if (plan.audio.enabled) log(`  ${plan.audio.reuse ? '复用音频轨道' : '重渲音频轨道'} hash=${plan.audio.hash.slice(0, 12)}`);

  const propsFile = path.join(projectDirectory, 'render-film-props.json');
  await writeFile(propsFile, `${JSON.stringify({film}, null, 2)}\n`);

  const temporaryFiles: string[] = [];
  try {
    for (const entry of renderedScenes) {
      const temporary = path.join(temporaryDirectory, `${entry.videoHash}.${process.pid}.mp4`);
      temporaryFiles.push(temporary);
      const from = entry.scene.from;
      const to = from + entry.scene.durationInFrames - 1;
      try {
        await runRemotion([
          'remotion', 'render', 'core/index.ts', 'Film', temporary,
          `--props=${propsFile}`,
          `--frames=${from}-${to}`,
          '--muted',
          ...remotionFlags,
        ]);
      } catch (error) {
        throw new Error(`Failed to render scene ${entry.scene.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
      await verifyVideoChunk(temporary, entry.scene, film);
      await rename(temporary, path.join(cacheDirectory, ...entry.file.split('/')));
    }

    if (plan.audio.enabled && !plan.audio.reuse) {
      const temporary = path.join(temporaryDirectory, `${plan.audio.hash}.${process.pid}.wav`);
      temporaryFiles.push(temporary);
      try {
        await runRemotion([
          'remotion', 'render', 'core/index.ts', 'Film', temporary,
          `--props=${propsFile}`,
          '--codec=wav',
          ...remotionFlags,
        ]);
      } catch (error) {
        throw new Error(`Failed to render the audio track: ${error instanceof Error ? error.message : String(error)}`);
      }
      await verifyAudioTrack(temporary, timeline.durationInFrames, film.output.fps);
      await rename(temporary, path.join(cacheDirectory, ...plan.audio.file.split('/')));
    }

    // 视频段按当前分镜顺序重新拼接；音频整轨单独复用/重渲，避免逐段 AAC 拼接造成累计偏移。
    const concatFile = path.join(cacheDirectory, `concat-${process.pid}.txt`);
    temporaryFiles.push(concatFile);
    await writeFile(
      concatFile,
      `${plan.scenes.map((entry) => `file '${entry.file}'`).join('\n')}\n`,
    );
    const videoOnly = path.join(temporaryDirectory, `video-${process.pid}.mp4`);
    temporaryFiles.push(videoOnly);
    // 分镜段可能带有静音音轨，拼接时只保留视频流，避免与独立渲染的三轨音频混叠。
    await runCommand(FFMPEG, [
      '-v', 'error',
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFile,
      '-map', '0:v:0',
      '-an',
      '-c:v', 'copy',
      '-y', videoOnly,
    ]);

    const finalTemporary = path.join(temporaryDirectory, `film-${process.pid}.mp4`);
    temporaryFiles.push(finalTemporary);
    if (plan.audio.enabled) {
      const audioFile = path.join(cacheDirectory, ...plan.audio.file.split('/'));
      await runCommand(FFMPEG, [
        '-v', 'error',
        '-i', videoOnly,
        '-i', audioFile,
        '-map', '0:v:0',
        '-map', '1:a:0',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', AUDIO_BITRATE,
        '-t', String(timeline.durationInFrames / film.output.fps),
        '-movflags', '+faststart',
        '-y', finalTemporary,
      ]);
    } else {
      await rename(videoOnly, finalTemporary);
    }

    await verifyFinalFilm(finalTemporary, film, timeline.durationInFrames, plan.audio.enabled);
    log('全片完整性校验通过：帧数、时长、编码与解码均匹配');
    await rename(finalTemporary, path.join(projectDirectory, 'film.mp4'));

    // 只有完整 MP4 校验通过后才写入新基线；任一步失败都保留上一次成功渲染的 manifest。
    const completedAt = new Date().toISOString();
    const audioCachePath = plan.audio.enabled
      ? path.join(cacheDirectory, ...plan.audio.file.split('/'))
      : undefined;
    const audioInfo = audioCachePath ? await stat(audioCachePath) : undefined;
    const audioDigest = audioCachePath ? await hashFile(audioCachePath) : undefined;
    const manifest: RenderManifest = {
      version: CACHE_VERSION,
      hashVersion: HASH_VERSION,
      projectId: path.basename(projectDirectory),
      filmId: film.id,
      output: {
        width: film.output.width,
        height: film.output.height,
        fps: film.output.fps,
        durationInFrames: timeline.durationInFrames,
      },
      rendererFingerprint,
      scenes: await Promise.all(plan.scenes.map(async (entry) => {
        const file = path.join(cacheDirectory, ...entry.file.split('/'));
        const [info, digest] = await Promise.all([stat(file), hashFile(file)]);
        return {
          sceneId: entry.scene.id,
          sceneHash: entry.sceneHash,
          videoHash: entry.videoHash,
          from: entry.scene.from,
          durationInFrames: entry.scene.durationInFrames,
          file: entry.file,
          bytes: info.size,
          sha256: digest,
          renderedAt: entry.reuse && entry.previous ? entry.previous.renderedAt : completedAt,
        };
      })),
      audio: audioCachePath && audioInfo && audioDigest ? {
        hash: plan.audio.hash,
        file: plan.audio.file,
        bytes: audioInfo.size,
        sha256: audioDigest,
        renderedAt: plan.audio.reuse && plan.audio.previous ? plan.audio.previous.renderedAt : completedAt,
      } : null,
      completedAt,
    };
    await writeManifest(manifestFile, manifest);

    log(`增量渲染完成：重渲分镜 = ${renderedScenes.map((entry) => entry.scene.id).join('、') || '无'}；复用分镜 = ${reusedScenes.map((entry) => entry.scene.id).join('、') || '无'}；音频轨道 = ${audioLabel}；输出 film.mp4`);
  } finally {
    await Promise.all(temporaryFiles.map((file) => rm(file, {force: true})));
  }
};
