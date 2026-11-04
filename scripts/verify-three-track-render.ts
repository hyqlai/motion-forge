import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdir, rm, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {filmSchema} from '../core/schema';
import {sampleFilm} from '../examples/theme-demo/film';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectId = `three-track-render-${process.pid}-${Date.now().toString(36)}`;
const projectDirectory = path.join(root, 'output', 'projects', projectId);
const publicDirectory = path.join(root, 'public', 'assets', projectId);
const outputFile = path.join(projectDirectory, 'film.mp4');

const run = async (command: string, args: string[]): Promise<string> => {
  const {stdout, stderr} = await execFileAsync(command, args, {cwd: root, maxBuffer: 20 * 1024 * 1024});
  return `${stdout}${stderr}`;
};

const makeTone = async (file: string, frequency: number, durationSeconds: number, volume: number): Promise<void> => {
  await run('ffmpeg', [
    '-v', 'error',
    '-f', 'lavfi',
    '-i', `sine=frequency=${frequency}:sample_rate=44100:duration=${durationSeconds}`,
    '-af', `volume=${volume}`,
    '-y', file,
  ]);
};

const measureVolume = async (startSeconds: number, durationSeconds: number, filter: string): Promise<number> => {
  const output = await run('ffmpeg', [
    '-v', 'info',
    '-ss', String(startSeconds),
    '-t', String(durationSeconds),
    '-i', outputFile,
    '-af', `${filter},volumedetect`,
    '-f', 'null',
    '-',
  ]);
  const match = output.match(/mean_volume:\s*(-?[\d.]+) dB/);
  if (!match) throw new Error(`ffmpeg did not report volume for ${startSeconds}s:\n${output.slice(-2000)}`);
  return Number(match[1]);
};

const browserCandidates = [
  process.env.REMOTION_BROWSER_EXECUTABLE,
  path.join(
    root,
    'node_modules/.remotion/chrome-headless-shell/linux64/chrome-headless-shell-linux64/chrome-headless-shell',
  ),
].filter((value): value is string => typeof value === 'string' && existsSync(value));

const renderOutput = async (): Promise<string> => {
  const child = execFile(path.join(root, 'node_modules', '.bin', 'tsx'), [
    'scripts/motion-forge.ts',
    'render',
    '--project', projectId,
    '--scope', 'film',
    '--gl', 'swangle',
    ...(browserCandidates[0] ? [`--browser-executable=${browserCandidates[0]}`] : []),
  ], {cwd: root, maxBuffer: 40 * 1024 * 1024});
  return new Promise((resolve, reject) => {
    let output = '';
    child.stdout?.on('data', (chunk: Buffer) => { output += chunk.toString(); });
    child.stderr?.on('data', (chunk: Buffer) => { output += chunk.toString(); });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`Render failed (exit ${code}):\n${output.slice(-4000)}`));
    });
  });
};

await mkdir(projectDirectory, {recursive: true});
await mkdir(publicDirectory, {recursive: true});
const bgmPath = `assets/${projectId}/bgm-tone.wav`;
const voicePath = `assets/${projectId}/voice-tone.wav`;
const sfxPath = `assets/${projectId}/sfx-tone.wav`;

try {
  await makeTone(path.join(publicDirectory, 'bgm-tone.wav'), 220, 4, 1);
  await makeTone(path.join(publicDirectory, 'voice-tone.wav'), 880, 4, 1);
  await makeTone(path.join(publicDirectory, 'sfx-tone.wav'), 1760, 0.5, 1);

  const scenes = sampleFilm.scenes.slice(0, 2).map((scene, index) => ({
    ...scene,
    id: index === 0 ? 'S01-opening' : 'S02-content',
    durationInFrames: 60,
    qa: {frames: [0, 30], checkpoints: scene.qa.checkpoints},
  }));

  const film = filmSchema.parse({
    ...sampleFilm,
    id: projectId,
    title: '三轨音频渲染验证',
    assets: [
      {id: 'bgm-tone', kind: 'audio', path: bgmPath, role: 'bgm', metadata: {}},
      {id: 'voice-S01-opening', kind: 'voice', path: voicePath, role: 'narration', metadata: {sceneId: 'S01-opening'}},
      {id: 'sfx-tone', kind: 'audio', path: sfxPath, role: 'sfx', metadata: {}},
    ],
    audio: {
      bgm: {src: bgmPath, volume: 0.04, loop: true},
      voice: {segments: [{sceneId: 'S01-opening', start: 15, end: 45, text: '三轨验证旁白'}]},
      sfx: {events: [{sceneId: 'S02-content', frame: 15, kind: 'sfx-tone'}]},
    },
    scenes: scenes.map((scene) => scene.id === 'S01-opening'
      ? {...scene, assetIds: ['voice-S01-opening']}
      : {...scene, assetIds: []}),
  });

  await writeFile(path.join(projectDirectory, 'film.json'), `${JSON.stringify(film, null, 2)}\n`);
  await writeFile(path.join(projectDirectory, 'assets.json'), `${JSON.stringify({assets: film.assets}, null, 2)}\n`);
  await writeFile(path.join(projectDirectory, 'brief.json'), `${JSON.stringify(film.brief, null, 2)}\n`);
  await writeFile(path.join(projectDirectory, 'project.json'), `${JSON.stringify({status: 'production', notes: []}, null, 2)}\n`);

  await renderOutput();
  await stat(outputFile);

  const probe = JSON.parse(await run('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration:stream=codec_type,codec_name,duration',
    '-of', 'json',
    outputFile,
  ])) as {
    format?: {duration?: string};
    streams?: {codec_type?: string; codec_name?: string; duration?: string}[];
  };
  const video = probe.streams?.find((stream) => stream.codec_type === 'video');
  const audio = probe.streams?.find((stream) => stream.codec_type === 'audio');
  assert.ok(video, 'Rendered MP4 must contain a video stream');
  assert.ok(audio, 'Rendered MP4 must contain an audio stream');
  assert.equal(video.codec_name, 'h264');
  assert.equal(audio.codec_name, 'aac');
  const duration = Number(probe.format?.duration);
  assert.ok(Math.abs(duration - 4) < 0.15, `Expected a 4s film, received ${duration}s`);

  // Voice 在 S01 局部帧 15–45（全片 0.5–1.5s），SFX 在 S02 局部帧 15（全片 2.5s）。
  const beforeVoice = await measureVolume(0.15, 0.25, 'highpass=f=500');
  const voiceWindow = await measureVolume(0.65, 0.35, 'highpass=f=500');
  const betweenTracks = await measureVolume(1.75, 0.35, 'highpass=f=500');
  const sfxWindow = await measureVolume(2.55, 0.25, 'highpass=f=500');
  const bgmWindow = await measureVolume(1.75, 0.35, 'lowpass=f=300');
  const bgmFull = await measureVolume(1.75, 0.35, 'anull');

  console.log(`Volumes (dB): before-voice=${beforeVoice}, voice=${voiceWindow}, gap=${betweenTracks}, sfx=${sfxWindow}, bgm-lowpass=${bgmWindow}, bgm-full=${bgmFull}`);

  assert.ok(voiceWindow > betweenTracks + 12, `Voice should be audible in its segment: voice=${voiceWindow} dB, gap=${betweenTracks} dB`);
  assert.ok(sfxWindow > betweenTracks + 12, `SFX should be audible at its event frame: sfx=${sfxWindow} dB, gap=${betweenTracks} dB`);
  assert.ok(beforeVoice < voiceWindow - 6, `Voice must not start before its scene-local frame: before=${beforeVoice} dB, voice=${voiceWindow} dB`);
  assert.ok(bgmWindow > -70, `BGM must be present between other tracks: ${bgmWindow} dB`);

  console.log(`Rendered ${path.relative(root, outputFile)} (${duration.toFixed(2)}s, ${video.codec_name}/${audio.codec_name})`);
} finally {
  if (!process.env.KEEP_FIXTURE) {
    await rm(projectDirectory, {recursive: true, force: true});
    await rm(publicDirectory, {recursive: true, force: true});
  }
}

console.log('Three-track real MP4 render and timing verification passed');
