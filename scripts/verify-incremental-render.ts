import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
import {mkdir, readFile, rm, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {filmSchema, type FilmSpec} from '../core/schema';
import {compileTimeline} from '../core/timeline';
import {sampleFilm} from '../examples/theme-demo/film';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectId = `incremental-render-${process.pid}-${Date.now().toString(36)}`;
const projectDirectory = path.join(root, 'output', 'projects', projectId);
const publicDirectory = path.join(root, 'public', 'assets', projectId);
const filmFile = path.join(projectDirectory, 'film.json');
const stateFile = path.join(projectDirectory, 'project.json');
const outputFile = path.join(projectDirectory, 'film.mp4');
const manifestFile = path.join(projectDirectory, '.render-cache', 'manifest.json');
const bgmPath = `assets/${projectId}/bgm.wav`;
const voicePath = `assets/${projectId}/voice.wav`;
const sfxPath = `assets/${projectId}/sfx.wav`;

const browserCandidates = [
  process.env.REMOTION_BROWSER_EXECUTABLE,
  path.join(
    root,
    'node_modules/.remotion/chrome-headless-shell/linux64/chrome-headless-shell-linux64/chrome-headless-shell',
  ),
].filter((value): value is string => typeof value === 'string' && existsSync(value));

const runCommand = (command: string, args: string[], cwd = root): Promise<string> => new Promise((resolve, reject) => {
  const child = execFile(command, args, {cwd, maxBuffer: 40 * 1024 * 1024});
  let output = '';
  child.stdout?.on('data', (chunk: Buffer) => { output += chunk.toString(); });
  child.stderr?.on('data', (chunk: Buffer) => { output += chunk.toString(); });
  child.once('error', reject);
  child.once('exit', (code) => {
    if (code === 0) resolve(output);
    else reject(new Error(`Command failed (exit ${code}): ${command} ${args.join(' ')}\n${output.slice(-4000)}`));
  });
});

const runForge = (args: string[], env: NodeJS.ProcessEnv = {}): Promise<{code: number; output: string}> => new Promise((resolve, reject) => {
  const child = execFile(path.join(root, 'node_modules', '.bin', 'tsx'), ['scripts/motion-forge.ts', ...args], {
    cwd: root,
    maxBuffer: 40 * 1024 * 1024,
    env: {...process.env, ...env},
  });
  let output = '';
  child.stdout?.on('data', (chunk: Buffer) => { output += chunk.toString(); });
  child.stderr?.on('data', (chunk: Buffer) => { output += chunk.toString(); });
  child.once('error', reject);
  child.once('exit', (code) => resolve({code: code ?? 1, output}));
});

const renderFlags = [
  '--gl', 'swangle',
  ...(browserCandidates[0] ? [`--browser-executable=${browserCandidates[0]}`] : []),
];

const makeTone = async (file: string, frequency: number, durationSeconds: number, volume: number): Promise<void> => {
  await runCommand('ffmpeg', [
    '-v', 'error',
    '-f', 'lavfi',
    '-i', `sine=frequency=${frequency}:sample_rate=44100:duration=${durationSeconds}`,
    '-af', `volume=${volume}`,
    '-y', file,
  ]);
};

const sceneIds = ['S01-opening', 'S02-content', 'S03-closing'] as const;
const framesPerScene = 15;
const totalFrames = framesPerScene * sceneIds.length;

const buildFilm = (): FilmSpec => {
  const scenes = sampleFilm.scenes.slice(0, sceneIds.length).map((scene, index) => ({
    ...scene,
    id: sceneIds[index],
    durationInFrames: framesPerScene,
    qa: {frames: [0, 7], checkpoints: scene.qa.checkpoints},
    motion: index === 0
      ? {...scene.motion, transitionOut: {cardId: 'transition/shape-wipe'}}
      : scene.motion,
  }));
  return filmSchema.parse({
    ...sampleFilm,
    id: projectId,
    title: '增量渲染验证',
    assets: [
      {id: 'bgm-fixture', kind: 'audio', path: bgmPath, role: 'bgm', metadata: {provider: 'fixture', downloadedAt: '2026-01-01T00:00:00.000Z'}},
      {id: 'voice-S01-opening', kind: 'voice', path: voicePath, role: 'narration', metadata: {provider: 'fixture', downloadedAt: '2026-01-01T00:00:00.000Z'}},
      {id: 'sfx-fixture', kind: 'audio', path: sfxPath, role: 'sfx', metadata: {provider: 'fixture'}},
    ],
    audio: {
      bgm: {src: bgmPath, volume: 0.04, loop: true},
      voice: {segments: [{sceneId: 'S01-opening', start: 2, end: 8, text: '增量渲染旁白'}]},
      sfx: {events: [{sceneId: 'S02-content', frame: 5, kind: 'sfx-fixture'}]},
    },
    scenes: scenes.map((scene) => scene.id === 'S01-opening'
      ? {...scene, assetIds: ['voice-S01-opening']}
      : {...scene, assetIds: []}),
  });
};

const writeFilm = async (film: FilmSpec): Promise<void> => {
  await writeFile(filmFile, `${JSON.stringify(film, null, 2)}\n`);
};

const writeState = async (status: string): Promise<void> => {
  await writeFile(stateFile, `${JSON.stringify({status, notes: []}, null, 2)}\n`);
};

type Probe = {
  format?: {duration?: string};
  streams?: {codec_type?: string; codec_name?: string; width?: number; height?: number; nb_frames?: string; duration?: string}[];
};

const probe = async (file: string): Promise<Probe> => JSON.parse(await runCommand('ffprobe', [
  '-v', 'error',
  '-show_entries', 'format=duration:stream=codec_type,codec_name,width,height,nb_frames,duration',
  '-of', 'json',
  file,
])) as Probe;

const decode = async (file: string): Promise<void> => {
  await runCommand('ffmpeg', ['-v', 'error', '-xerror', '-i', file, '-f', 'null', '-']);
};

const fileHash = async (file: string): Promise<string> => createHash('sha256').update(await readFile(file)).digest('hex');

type CacheSceneEntry = {
  sceneId: string;
  sceneHash: string;
  videoHash: string;
  file: string;
  bytes: number;
  sha256: string;
  renderedAt: string;
};

type CacheManifest = {
  rendererFingerprint: string;
  completedAt: string;
  scenes: CacheSceneEntry[];
  audio: {hash: string; file: string; bytes: number; sha256: string; renderedAt: string} | null;
};

const readManifest = async (): Promise<CacheManifest> => JSON.parse(
  await readFile(manifestFile, 'utf8'),
) as CacheManifest;
const readManifestBytes = async (): Promise<Buffer> => readFile(manifestFile);

const cacheFile = (relative: string): string => path.join(projectDirectory, '.render-cache', relative);

await mkdir(projectDirectory, {recursive: true});
await mkdir(publicDirectory, {recursive: true});
await makeTone(path.join(publicDirectory, 'bgm.wav'), 220, 4, 1);
await makeTone(path.join(publicDirectory, 'voice.wav'), 880, 4, 1);
await makeTone(path.join(publicDirectory, 'sfx.wav'), 1760, 0.5, 1);
const film = buildFilm();
await writeFilm(film);
await writeState('production');

try {
  await writeState('sample-review');
  const sample = await runForge(['render', '--project', projectId, '--scope', 'sample', '--incremental', ...renderFlags]);
  assert.notEqual(sample.code, 0, '--incremental must only be accepted for full-film renders');
  assert.match(sample.output, /incremental.*scope film|scope film.*incremental/i);

  await writeState('design-review');
  const g1Sample = await runForge(['render', '--project', projectId, '--scope', 'sample', ...renderFlags]);
  assert.notEqual(g1Sample.code, 0, 'G1 must still gate sample rendering');
  assert.match(g1Sample.output, /design must be approved/i);
  const g1Incremental = await runForge(['render', '--project', projectId, '--scope', 'film', '--incremental', ...renderFlags]);
  assert.notEqual(g1Incremental.code, 0, 'incremental rendering must not bypass G1');
  assert.match(g1Incremental.output, /sample scene must be approved/i);

  await writeState('sample-review');
  const g2 = await runForge(['render', '--project', projectId, '--scope', 'film', '--incremental', ...renderFlags]);
  assert.notEqual(g2.code, 0, 'incremental rendering must not bypass G2');
  assert.match(g2.output, /sample scene must be approved/i);

  await writeState('production');
  const invalidFilm = {
    ...film,
    scenes: film.scenes.map((scene, index) => index === 0 ? {...scene, sceneComponent: 'scene/missing'} : scene),
  };
  await writeFile(filmFile, `${JSON.stringify(invalidFilm, null, 2)}\n`);
  const invalid = await runForge(['render', '--project', projectId, '--scope', 'film', '--incremental', ...renderFlags]);
  assert.notEqual(invalid.code, 0, 'incremental rendering must still validate the target Film');
  assert.match(invalid.output, /Missing scene component/i);
  assert.equal(existsSync(manifestFile), false, 'failed target Film validation must not create a cache baseline');
  await writeFilm(film);

  const first = await runForge(['render', '--project', projectId, '--scope', 'film', '--incremental', ...renderFlags]);
  assert.equal(first.code, 0, `first incremental render failed:\n${first.output.slice(-4000)}`);
  assert.match(first.output, /重渲分镜\s+S01-opening/);
  assert.match(first.output, /重渲分镜\s+S02-content/);
  assert.match(first.output, /重渲分镜\s+S03-closing/);
  assert.match(first.output, /重渲音频轨道/);

  const firstManifest = await readManifest();
  assert.equal(firstManifest.scenes.length, sceneIds.length);
  assert.ok(firstManifest.rendererFingerprint, 'baseline must record the renderer content version');
  assert.ok(firstManifest.audio, 'first incremental render must cache the full audio track');
  const firstScenes = new Map(firstManifest.scenes.map((entry) => [entry.sceneId, entry]));
  for (const entry of firstManifest.scenes) {
    assert.equal(await fileHash(cacheFile(entry.file)), entry.sha256, 'cached scene must carry its file content hash');
  }
  assert.equal(await fileHash(cacheFile(firstManifest.audio.file)), firstManifest.audio.sha256);
  const firstAudioHash = await fileHash(cacheFile(firstManifest.audio.file));

  const firstProbe = await probe(outputFile);
  const video = firstProbe.streams?.find((stream) => stream.codec_type === 'video');
  const audio = firstProbe.streams?.find((stream) => stream.codec_type === 'audio');
  assert.ok(video, 'incremental output must contain a video stream');
  assert.ok(audio, 'incremental output must contain an audio stream');
  assert.equal(video.codec_name, 'h264');
  assert.equal(audio.codec_name, 'aac');
  assert.equal(Number(video.nb_frames), totalFrames);
  assert.ok(Math.abs(Number(firstProbe.format?.duration) - totalFrames / 30) < 0.1);
  await decode(outputFile);

  const modified = filmSchema.parse({
    ...film,
    assets: film.assets.map((asset) => asset.id === 'bgm-fixture'
      ? {...asset, metadata: {...asset.metadata, downloadedAt: '2026-11-05T00:00:00.000Z'}}
      : asset),
    scenes: film.scenes.map((scene) => {
      if (scene.id === 'S02-content') {
        return {...scene, props: {...scene.props, title: '修改后的第二镜', metadata: {downloadedAt: '2026-11-05T00:00:00.000Z'}}};
      }
      if (scene.id === 'S03-closing') {
        return {...scene, props: {...scene.props, metadata: {downloadedAt: '2026-11-05T00:00:00.000Z'}}};
      }
      return scene;
    }),
  });
  await writeFilm(modified);
  const second = await runForge(['render', '--project', projectId, '--scope', 'film', '--incremental', ...renderFlags]);
  assert.equal(second.code, 0, `second incremental render failed:\n${second.output.slice(-4000)}`);
  assert.match(second.output, /重渲分镜\s+S02-content/);
  assert.match(second.output, /重渲分镜\s+S01-opening[^\n]*转场边界/);
  assert.match(second.output, /复用分镜\s+S03-closing/);
  assert.doesNotMatch(second.output, /重渲分镜\s+S03-closing/);
  assert.match(second.output, /复用音频轨道/);

  const secondManifest = await readManifest();
  const secondScenes = new Map(secondManifest.scenes.map((entry) => [entry.sceneId, entry]));
  assert.notEqual(secondScenes.get('S02-content')!.sceneHash, firstScenes.get('S02-content')!.sceneHash);
  assert.notEqual(secondScenes.get('S02-content')!.videoHash, firstScenes.get('S02-content')!.videoHash);
  assert.equal(secondScenes.get('S01-opening')!.videoHash, firstScenes.get('S01-opening')!.videoHash);
  assert.equal(secondScenes.get('S01-opening')!.sceneHash, firstScenes.get('S01-opening')!.sceneHash);
  assert.equal(secondScenes.get('S03-closing')!.sceneHash, firstScenes.get('S03-closing')!.sceneHash,
    'unstable metadata must not change the scene content hash');
  assert.equal(await fileHash(cacheFile(secondScenes.get('S03-closing')!.file)),
    await fileHash(cacheFile(firstScenes.get('S03-closing')!.file)),
    'unchanged scene must reuse the identical cached chunk');
  assert.equal(secondManifest.audio!.hash, firstManifest.audio!.hash,
    'changing only downloadedAt metadata must not re-render the audio track');
  assert.equal(await fileHash(cacheFile(secondManifest.audio!.file)), firstAudioHash);
  const secondProbe = await probe(outputFile);
  assert.equal(Number(secondProbe.streams?.find((stream) => stream.codec_type === 'video')?.nb_frames), totalFrames);
  assert.ok(Math.abs(Number(secondProbe.format?.duration) - totalFrames / 30) < 0.1);
  await decode(outputFile);

  const third = await runForge(['render', '--project', projectId, '--scope', 'film', '--incremental', ...renderFlags]);
  assert.equal(third.code, 0, `unchanged incremental render failed:\n${third.output.slice(-4000)}`);
  assert.match(third.output, /复用分镜\s+S01-opening/);
  assert.match(third.output, /复用分镜\s+S02-content/);
  assert.match(third.output, /复用分镜\s+S03-closing/);
  assert.match(third.output, /复用音频轨道/);
  assert.doesNotMatch(third.output, /重渲分镜\s+S0/);
  await decode(outputFile);

  const stableManifest = await readManifestBytes();
  const stableOutput = await fileHash(outputFile);
  const failureFilm = filmSchema.parse({
    ...modified,
    scenes: modified.scenes.map((scene) => scene.id === 'S03-closing'
      ? {...scene, props: {...scene.props, title: '失败用例第三镜'}}
      : scene),
  });
  await writeFilm(failureFilm);
  const failed = await runForge(
    ['render', '--project', projectId, '--scope', 'film', '--incremental', ...renderFlags],
    {FFMPEG_PATH: path.join(root, 'no-such-ffmpeg-binary')},
  );
  assert.notEqual(failed.code, 0, 'a failed incremental render must exit non-zero');
  assert.match(failed.output, /ffmpeg|ENOENT|Failed to render scene/i);
  assert.deepEqual(await readManifestBytes(), stableManifest, 'failed render must not update the cache baseline');
  assert.equal(await fileHash(outputFile), stableOutput, 'failed render must not replace the last good film.mp4');

  const recovered = await runForge(['render', '--project', projectId, '--scope', 'film', '--incremental', ...renderFlags]);
  assert.equal(recovered.code, 0, `recovery incremental render failed:\n${recovered.output.slice(-4000)}`);
  assert.match(recovered.output, /重渲分镜\s+S03-closing/);
  assert.match(recovered.output, /复用分镜\s+S01-opening/);
  assert.match(recovered.output, /复用分镜\s+S02-content/);
  assert.match(recovered.output, /复用音频轨道/);
  const recoveredManifest = await readManifest();
  const recoveredScenes = new Map(recoveredManifest.scenes.map((entry) => [entry.sceneId, entry]));
  assert.notEqual(recoveredScenes.get('S03-closing')!.sceneHash, secondScenes.get('S03-closing')!.sceneHash);
  assert.equal(recoveredManifest.audio!.hash, secondManifest.audio!.hash);
  await decode(outputFile);
  const recoveredProbe = await probe(outputFile);
  assert.equal(Number(recoveredProbe.streams?.find((stream) => stream.codec_type === 'video')?.nb_frames), totalFrames);

  const baselineAfterRecovery = await readManifestBytes();
  const full = await runForge(['render', '--project', projectId, '--scope', 'film', ...renderFlags]);
  assert.equal(full.code, 0, `full render failed:\n${full.output.slice(-4000)}`);
  assert.doesNotMatch(full.output, /增量渲染计划/);
  assert.deepEqual(await readManifestBytes(), baselineAfterRecovery, 'full render must not corrupt the incremental baseline');
  await decode(outputFile);
  const fullProbe = await probe(outputFile);
  assert.equal(Number(fullProbe.streams?.find((stream) => stream.codec_type === 'video')?.nb_frames), totalFrames);
  assert.ok(Math.abs(Number(fullProbe.format?.duration) - totalFrames / 30) < 0.1);
} finally {
  if (!process.env.KEEP_FIXTURE) {
    await rm(projectDirectory, {recursive: true, force: true});
    await rm(publicDirectory, {recursive: true, force: true});
  }
}

console.log('增量渲染 CLI 端到端验证通过');
