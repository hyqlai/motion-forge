import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {existsSync} from 'node:fs';
import {cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {GooeyMorphFrame} from '../cards/interaction/gooey-morph';
import {filmSchema, type FilmSpec} from '../core/schema';

type ScenarioKey = 'long-take' | 'svg' | 'three';
type Scenario = {key: ScenarioKey; title: string; cardId: string};
type Probe = {
  format?: {duration?: string};
  streams?: {
    codec_type?: string;
    codec_name?: string;
    width?: number;
    height?: number;
    nb_frames?: string;
    avg_frame_rate?: string;
  }[];
};
type FrameMetric = {frame: number; mean: number; standardDeviation: number; range: number};
type ScenarioResult = {
  key: ScenarioKey;
  title: string;
  projectId: string;
  cardId: string;
  sceneComponent: string;
  gl: 'swangle';
  expectedFrames: number;
  expectedDurationSeconds: number;
  g1Approved: boolean;
  g2Approved: boolean;
  sampleFrames: number;
  sourceVideo: Probe;
  fullDecode: 'passed';
  frameMetrics: FrameMetric[];
  maximumTemporalDifference: number;
  contactSheet: string;
  delivery: string;
  qaStatus: string;
  qaChecks: number;
  independentValidation: 'passed';
  independentBuild: 'passed';
  independentEdit: string;
  independentVideo: Probe;
  independentFullDecode: 'passed';
  pathMorph?: {frames: number[]; uniquePaths: number; cubicSegments: number[]};
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scenarios: Scenario[] = [
  {key: 'long-take', title: '一镜到底', cardId: 'transition/long-take-world'},
  {key: 'svg', title: '复杂 SVG 路径形变', cardId: 'interaction/gooey-morph'},
  {key: 'three', title: '高级 Three.js', cardId: 'effects/three-crystal'},
];
const onlyIndex = process.argv.indexOf('--only');
const only = onlyIndex >= 0 ? process.argv[onlyIndex + 1] : undefined;
if (onlyIndex >= 0 && !only) throw new Error('--only requires a scenario key');
const selected = only ? scenarios.filter((scenario) => scenario.key === only) : scenarios;
if (selected.length === 0) throw new Error(`Unknown advanced scenario: ${only}; available: ${scenarios.map((scenario) => scenario.key).join(', ')}`);

const runId = `${process.pid}-${Date.now().toString(36)}`;
const evidenceDirectory = path.join(root, 'output', 'advanced-scenes', runId);
// 独立工程必须在模板之外；使用 worktree 同级的项目磁盘短路径，避开 tmpfs 写入与 Unix socket 限制。
const workspace = await mkdtemp(path.join(path.dirname(root), '.advanced-scenes-'));
const sourceProject = path.join(workspace, 'source');
const browserRelative = 'node_modules/.remotion/chrome-headless-shell/linux64/chrome-headless-shell-linux64/chrome-headless-shell';
const results: ScenarioResult[] = [];

const writeJson = async (file: string, value: unknown): Promise<void> => {
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
};

const run = async (
  command: string,
  args: string[],
  cwd: string,
  options: {env?: NodeJS.ProcessEnv; logFile?: string} = {},
): Promise<string> => new Promise((resolve, reject) => {
  const child = execFile(command, args, {
    cwd,
    env: options.env ?? process.env,
    maxBuffer: 40 * 1024 * 1024,
  });
  let output = '';
  child.stdout?.on('data', (chunk: Buffer) => { output += chunk.toString(); });
  child.stderr?.on('data', (chunk: Buffer) => { output += chunk.toString(); });
  child.once('error', reject);
  child.once('exit', (code) => {
    void (async () => {
      if (options.logFile) {
        await mkdir(path.dirname(options.logFile), {recursive: true});
        await writeFile(options.logFile, output);
      }
      if (code === 0) resolve(output);
      else reject(new Error(`Command failed (exit ${code}): ${command} ${args.join(' ')}\n${output.slice(-6000)}`));
    })().catch(reject);
  });
});

const runForge = async (
  projectRoot: string,
  args: string[],
  logFile?: string,
  env?: NodeJS.ProcessEnv,
): Promise<string> => run(
  path.join(projectRoot, 'node_modules', '.bin', 'tsx'),
  ['scripts/motion-forge.ts', ...args],
  projectRoot,
  {logFile, env},
);

const prepareBrowser = async (projectRoot: string): Promise<string[]> => {
  const installed = path.join(root, browserRelative);
  if (!existsSync(installed)) return [];
  const target = path.join(projectRoot, browserRelative);
  await mkdir(path.dirname(target), {recursive: true});
  await cp(path.dirname(installed), path.dirname(target), {recursive: true});
  return [`--browser-executable=${target}`];
};

const probeVideo = async (file: string, film: FilmSpec, expectedFrames: number): Promise<Probe> => {
  const output = await run(process.env.FFPROBE_PATH ?? 'ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration:stream=codec_type,codec_name,width,height,nb_frames,duration,avg_frame_rate',
    '-of', 'json', file,
  ], root);
  const probe = JSON.parse(output) as Probe;
  const video = probe.streams?.find((stream) => stream.codec_type === 'video');
  assert.ok(video, `Missing video stream: ${file}`);
  assert.equal(video.codec_name, 'h264');
  assert.equal(video.width, film.output.width);
  assert.equal(video.height, film.output.height);
  assert.equal(Number(video.nb_frames), expectedFrames);
  const [numerator, denominator] = (video.avg_frame_rate ?? '').split('/').map(Number);
  assert.ok(Math.abs(numerator / denominator - film.output.fps) < 0.001);
  const duration = Number(probe.format?.duration);
  assert.ok(Math.abs(duration - expectedFrames / film.output.fps) <= 0.1,
    `Duration mismatch: ${duration}s, expected ${expectedFrames / film.output.fps}s`);
  assert.equal(probe.streams?.some((stream) => stream.codec_type === 'audio'), false,
    'Advanced fixtures intentionally have no audio track');
  return probe;
};

const decodeVideo = async (file: string, cwd: string, env?: NodeJS.ProcessEnv): Promise<void> => {
  await run(process.env.FFMPEG_PATH ?? 'ffmpeg', [
    '-v', 'error', '-xerror', '-i', file, '-f', 'null', '-',
  ], cwd, {env});
};

const grayPixels = async (file: string, expectedFrames: number): Promise<Buffer> => {
  const width = 160;
  const height = 90;
  const buffer = await new Promise<Buffer>((resolve, reject) => {
    execFile(process.env.FFMPEG_PATH ?? 'ffmpeg', [
      '-v', 'error', '-xerror', '-i', file,
      '-vf', `scale=${width}:${height},format=gray`,
      '-f', 'rawvideo', '-',
    ], {encoding: 'buffer', maxBuffer: 40 * 1024 * 1024}, (error, stdout, stderr) => {
      if (error) reject(new Error(`Raw frame decode failed: ${stderr.toString()}`));
      else resolve(stdout as Buffer);
    });
  });
  assert.equal(buffer.length, expectedFrames * width * height,
    'Decoded grayscale buffer must contain every expected frame');
  return buffer;
};

const frameAt = (pixels: Buffer, frame: number): Buffer => {
  const size = 160 * 90;
  return pixels.subarray(frame * size, (frame + 1) * size);
};

const metricAt = (pixels: Buffer, frame: number): FrameMetric => {
  const values = frameAt(pixels, frame);
  let minimum = 255;
  let maximum = 0;
  let sum = 0;
  let squares = 0;
  for (const value of values) {
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
    sum += value;
    squares += value * value;
  }
  const mean = sum / values.length;
  return {
    frame,
    mean: Number(mean.toFixed(3)),
    standardDeviation: Number(Math.sqrt(squares / values.length - mean * mean).toFixed(3)),
    range: maximum - minimum,
  };
};

const temporalDifference = (pixels: Buffer, first: number, second: number): number => {
  const a = frameAt(pixels, first);
  const b = frameAt(pixels, second);
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference += Math.abs(a[index] - b[index]);
  return difference / a.length;
};

const inspectFrames = async (
  scenario: Scenario,
  film: FilmSpec,
  videoFile: string,
): Promise<{metrics: FrameMetric[]; maximumDifference: number; contactSheet: string}> => {
  const scene = film.scenes[0];
  const directory = path.join(evidenceDirectory, scenario.key);
  const pixels = await grayPixels(videoFile, scene.durationInFrames);
  const metrics = scene.qa.frames.map((frame) => metricAt(pixels, frame));
  for (const metric of metrics) {
    assert.ok(metric.range >= 24 && metric.standardDeviation >= 4,
      `${scenario.key} frame ${metric.frame} is blank or nearly uniform: ${JSON.stringify(metric)}`);
  }
  let maximumDifference = 0;
  for (let first = 0; first < scene.qa.frames.length; first += 1) {
    for (let second = first + 1; second < scene.qa.frames.length; second += 1) {
      maximumDifference = Math.max(maximumDifference, temporalDifference(pixels, scene.qa.frames[first], scene.qa.frames[second]));
    }
  }
  assert.ok(maximumDifference >= 1, `${scenario.key} QA frames show no meaningful temporal change`);
  await mkdir(path.join(directory, 'frames'), {recursive: true});
  for (const frame of scene.qa.frames) {
    await run(process.env.FFMPEG_PATH ?? 'ffmpeg', [
      '-v', 'error', '-i', videoFile,
      '-vf', `select=eq(n\\,${frame})`,
      '-frames:v', '1', '-vsync', '0', '-y', path.join(directory, 'frames', `frame-${String(frame).padStart(3, '0')}.png`),
    ], root);
  }
  const contactSheet = path.join(directory, 'contact-sheet.jpg');
  const selection = scene.qa.frames.map((frame) => `eq(n\\,${frame})`).join('+');
  await run(process.env.FFMPEG_PATH ?? 'ffmpeg', [
    '-v', 'error', '-i', videoFile,
    '-vf', `select=${selection},scale=480:270,tile=2x2:padding=8:color=0x202020`,
    '-frames:v', '1', '-q:v', '2', '-y', contactSheet,
  ], root);
  return {
    metrics,
    maximumDifference: Number(maximumDifference.toFixed(3)),
    contactSheet: path.relative(root, contactSheet),
  };
};

const writeReport = async (status: 'running' | 'passed' | 'failed', error?: unknown): Promise<void> => {
  const report = {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    status,
    error: error ? String(error instanceof Error ? error.message : error) : undefined,
    scenarios: results,
  };
  await writeJson(path.join(evidenceDirectory, 'verification.json'), report);
  const lines = [
    '# 高级场景真实渲染验证',
    '',
    `- 状态：${status}`,
    `- 运行目录：${path.relative(root, evidenceDirectory)}`,
    '',
    '| 场景 | 卡片 | G1/G2 | 原始帧数/时长 | 非空最大帧间差 | 导出 QA | 独立编辑后帧数 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...results.map((result) => `| ${result.title} | ${result.cardId} | 通过 | ${result.expectedFrames} / ${result.expectedDurationSeconds.toFixed(3)}s | ${result.maximumTemporalDifference} | ${result.qaStatus}（${result.qaChecks} 项） | ${result.independentVideo.streams?.find((stream) => stream.codec_type === 'video')?.nb_frames ?? 'unknown'} |`),
    '',
  ];
  if (error) lines.push(`## 失败原因\n\n${String(error instanceof Error ? error.message : error)}\n`);
  await writeFile(path.join(evidenceDirectory, 'verification.md'), lines.join('\n'));
};

const inspectSvgPathMorph = (film: FilmSpec): {frames: number[]; uniquePaths: number; cubicSegments: number[]} => {
  const scene = film.scenes[0];
  const paths = scene.qa.frames.map((frame) => {
    const markup = renderToStaticMarkup(createElement(GooeyMorphFrame, {
      frame,
      width: film.output.width,
      height: film.output.height,
      durationInFrames: scene.durationInFrames,
      theme: film.theme,
      title: String(scene.props.title ?? scene.title),
      steps: Array.isArray(scene.props.steps) ? scene.props.steps.map(String) : [],
    }));
    const tag = markup.match(/<path\b[^>]*data-gooey-morph-path[^>]*>/)?.[0];
    const d = tag?.match(/\bd="([^"]+)"/)?.[1];
    assert.ok(d, `QA frame ${frame} must render the same gooey SVG path element`);
    assert.ok((d.match(/\bC\b/g) ?? []).length >= 8, `QA frame ${frame} must contain a complex cubic closed path`);
    assert.ok(/\bZ\b/.test(d), `QA frame ${frame} path must remain closed`);
    return d;
  });
  const uniquePaths = new Set(paths).size;
  assert.ok(uniquePaths >= 3, 'gooey start, interpolation and settled frames must have different path d values');
  assert.notEqual(paths[0], paths.at(-1), 'morph must change geometry rather than only translate or reveal a stroke');
  return {
    frames: scene.qa.frames,
    uniquePaths,
    cubicSegments: paths.map((d) => (d.match(/\bC\b/g) ?? []).length),
  };
};

const loadFixture = async (scenario: Scenario): Promise<FilmSpec> => {
  const file = path.join(sourceProject, 'scripts', 'fixtures', 'advanced-scenes', `${scenario.key}.json`);
  const film = filmSchema.parse(JSON.parse(await readFile(file, 'utf8')));
  assert.equal(film.scenes.length, 1, 'Each advanced fixture must be a complete one-scene Film, not a card preview');
  assert.equal(film.scenes[0].motion.primary?.cardId, scenario.cardId);
  for (const frame of film.scenes[0].qa.frames) assert.ok(frame < film.scenes[0].durationInFrames);
  return film;
};

const verifyScenario = async (scenario: Scenario): Promise<void> => {
  console.log(`\n[${scenario.key}] 目标 Film 与 G1/G2`);
  const film = await loadFixture(scenario);
  const scene = film.scenes[0];
  const pathMorph = scenario.key === 'svg' ? inspectSvgPathMorph(film) : undefined;
  const projectId = film.id;
  const projectDirectory = path.join(sourceProject, 'output', 'projects', projectId);
  const scenarioEvidence = path.join(evidenceDirectory, scenario.key);
  await mkdir(projectDirectory, {recursive: true});
  await Promise.all([
    writeJson(path.join(projectDirectory, 'film.json'), film),
    writeJson(path.join(projectDirectory, 'assets.json'), {assets: film.assets}),
    writeJson(path.join(projectDirectory, 'brief.json'), film.brief),
    writeJson(path.join(projectDirectory, 'input.json'), {kind: 'theme', values: [film.title], value: film.title}),
    writeJson(path.join(projectDirectory, 'project.json'), {status: 'design-review', notes: []}),
  ]);
  await run('npm', ['run', 'validate', '--', '--project', projectId], sourceProject, {
    logFile: path.join(scenarioEvidence, 'source-validate.log'),
  });
  await runForge(sourceProject, ['approve-design', '--project', projectId]);
  const sourceBrowser = await prepareBrowser(sourceProject);
  const renderArgs = (scope: 'sample' | 'film'): string[] => [
    'render', '--project', projectId, '--scope', scope, '--gl', 'swangle', '--bundle-cache=false', ...sourceBrowser,
  ];
  await runForge(sourceProject, renderArgs('sample'), path.join(scenarioEvidence, 'source-sample-render.log'));
  const sampleFile = path.join(projectDirectory, 'sample.mp4');
  await probeVideo(sampleFile, film, scene.durationInFrames);
  await decodeVideo(sampleFile, sourceProject);
  await runForge(sourceProject, ['approve-sample', '--project', projectId]);

  console.log(`[${scenario.key}] swangle 完整 Film 真实渲染`);
  await runForge(sourceProject, renderArgs('film'), path.join(scenarioEvidence, 'source-film-render.log'));
  const videoFile = path.join(projectDirectory, 'film.mp4');
  const sourceVideo = await probeVideo(videoFile, film, scene.durationInFrames);
  await writeJson(path.join(scenarioEvidence, 'source-ffprobe.json'), sourceVideo);
  await decodeVideo(videoFile, sourceProject);
  const visual = await inspectFrames(scenario, film, videoFile);

  console.log(`[${scenario.key}] forge export 与现有 QA`);
  const delivery = path.join(evidenceDirectory, 'deliveries', projectId);
  await runForge(sourceProject, ['export', '--project', projectId, '--out', delivery], path.join(scenarioEvidence, 'export.log'));
  const qa = JSON.parse(await readFile(path.join(delivery, 'qa', 'qa-report.json'), 'utf8')) as {
    status: string;
    checks: {id: string; status: string; evidence: string[]}[];
  };
  assert.equal(qa.status, 'passed');
  for (const id of [
    'film-schema', 'target-film-validation', 'scene-card-registry', 'asset-localization', 'total-frames',
    'audio-tracks', 'video-ffprobe', 'video-decode', 'approval-gates', 'delivery-hygiene',
  ]) assert.equal(qa.checks.find((check) => check.id === id)?.status, 'passed', `${id} must pass`);
  assert.ok(qa.checks.find((check) => check.id === 'scene-card-registry')?.evidence.includes(`card=${scenario.cardId}`));
  for (const relative of [
    'video/film.mp4', 'README.md', 'motion-forge-project.json', 'assets-manifest.json',
    `output/projects/${projectId}/film.json`, `scripts/fixtures/advanced-scenes/${scenario.key}.json`,
  ]) assert.ok(existsSync(path.join(delivery, relative)), `Delivery is missing ${relative}`);
  const packagedFiles = await readdir(delivery);
  assert.equal(packagedFiles.includes('node_modules'), false);

  console.log(`[${scenario.key}] 干净交付副本独立播放、编辑与重渲染`);
  const cleanProject = path.join(workspace, `clean-${scenario.key}`);
  await cp(delivery, cleanProject, {recursive: true, errorOnExist: true});
  const cleanTemp = path.join(workspace, `tmp-${scenario.key}`);
  await mkdir(cleanTemp, {recursive: true});
  const cleanEnv = Object.fromEntries(Object.entries(process.env)
    .filter(([key]) => !/(?:API_KEY|TOKEN|SECRET|PASSWORD)/.test(key))) as NodeJS.ProcessEnv;
  cleanEnv.TMPDIR = cleanTemp;
  cleanEnv.TEMP = cleanTemp;
  cleanEnv.TMP = cleanTemp;
  delete cleanEnv.REMOTION_BROWSER_EXECUTABLE;
  await run('npm', ['ci'], cleanProject, {env: cleanEnv, logFile: path.join(scenarioEvidence, 'clean-npm-ci.log')});
  await decodeVideo(path.join(cleanProject, 'video', 'film.mp4'), cleanProject, cleanEnv);
  await run('npm', ['run', 'validate', '--', '--project', projectId], cleanProject, {
    env: cleanEnv, logFile: path.join(scenarioEvidence, 'clean-validate-before-edit.log'),
  });
  await run('npm', ['run', 'build'], cleanProject, {env: cleanEnv, logFile: path.join(scenarioEvidence, 'clean-build.log')});

  const editedFilm = filmSchema.parse({
    ...film,
    title: `${film.title}（交付副本编辑）`,
    scenes: film.scenes.map((item) => ({...item, durationInFrames: item.durationInFrames + 15})),
  });
  await writeJson(path.join(cleanProject, 'output', 'projects', projectId, 'film.json'), editedFilm);
  await writeJson(path.join(cleanProject, 'output', 'projects', projectId, 'project.json'), {
    status: 'design-review', notes: ['干净副本可编辑性探针：场景时长增加 15 帧，重新执行 G1/G2'],
  });
  await run('npm', ['run', 'validate', '--', '--project', projectId], cleanProject, {
    env: cleanEnv, logFile: path.join(scenarioEvidence, 'clean-validate-after-edit.log'),
  });
  const cleanBrowser = await prepareBrowser(cleanProject);
  await runForge(cleanProject, ['approve-design', '--project', projectId], undefined, cleanEnv);
  await runForge(cleanProject, [
    'render', '--project', projectId, '--scope', 'sample', '--gl', 'swangle', '--bundle-cache=false', ...cleanBrowser,
  ], path.join(scenarioEvidence, 'clean-sample-render.log'), cleanEnv);
  await probeVideo(path.join(cleanProject, 'output', 'projects', projectId, 'sample.mp4'), editedFilm, editedFilm.scenes[0].durationInFrames);
  await runForge(cleanProject, ['approve-sample', '--project', projectId], undefined, cleanEnv);
  await runForge(cleanProject, [
    'render', '--project', projectId, '--scope', 'film', '--gl', 'swangle', '--bundle-cache=false', ...cleanBrowser,
  ], path.join(scenarioEvidence, 'clean-film-render.log'), cleanEnv);
  const independentVideo = await probeVideo(
    path.join(cleanProject, 'output', 'projects', projectId, 'film.mp4'),
    editedFilm,
    editedFilm.scenes[0].durationInFrames,
  );
  await writeJson(path.join(scenarioEvidence, 'independent-ffprobe.json'), independentVideo);
  await decodeVideo(path.join(cleanProject, 'output', 'projects', projectId, 'film.mp4'), cleanProject, cleanEnv);

  results.push({
    key: scenario.key,
    title: scenario.title,
    projectId,
    cardId: scenario.cardId,
    sceneComponent: scene.sceneComponent,
    gl: 'swangle',
    expectedFrames: scene.durationInFrames,
    expectedDurationSeconds: scene.durationInFrames / film.output.fps,
    g1Approved: true,
    g2Approved: true,
    sampleFrames: scene.durationInFrames,
    sourceVideo,
    fullDecode: 'passed',
    frameMetrics: visual.metrics,
    maximumTemporalDifference: visual.maximumDifference,
    contactSheet: visual.contactSheet,
    delivery: path.relative(root, delivery),
    qaStatus: qa.status,
    qaChecks: qa.checks.length,
    independentValidation: 'passed',
    independentBuild: 'passed',
    independentEdit: '场景时长增加 15 帧；重新通过 G1、样板镜、G2 和 swangle 全片渲染',
    independentVideo,
    independentFullDecode: 'passed',
    pathMorph,
  });
  await writeReport('running');
  console.log(`[${scenario.key}] 通过：${scene.durationInFrames} 帧，${visual.maximumDifference} 最大帧间差，QA ${qa.checks.length} 项`);
};

try {
  await mkdir(evidenceDirectory, {recursive: true});
  console.log(`创建模板外独立工程：${sourceProject}`);
  await runForge(root, ['create', '--dir', sourceProject, '--input', '高级场景验证', '--name', 'advanced-scene-seed']);
  await run('npm', ['ci'], sourceProject, {logFile: path.join(evidenceDirectory, 'source-npm-ci.log')});
  for (const scenario of selected) await verifyScenario(scenario);
  await writeReport('passed');
  console.log(`\n高级场景验证通过：${results.map((result) => result.key).join(', ')}`);
  console.log(`证据与交付包：${path.relative(root, evidenceDirectory)}`);
} catch (error) {
  await writeReport('failed', error);
  throw error;
} finally {
  if (!process.env.KEEP_FIXTURE) await rm(workspace, {recursive: true, force: true});
  else console.log(`保留独立工程临时目录：${workspace}`);
}
