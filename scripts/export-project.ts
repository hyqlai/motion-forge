import {execFile} from 'node:child_process';
import {lstat, mkdir, readFile, realpath, rename, rm, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {cardRegistry} from '../cards/registry';
import {assertLocalPublicPath, validateAudioTracks} from '../core/audio';
import {assertRenderAllowed} from '../core/production-state';
import {filmSchema, productionStateSchema, type FilmSpec} from '../core/schema';
import {compileTimeline} from '../core/timeline';
import {sceneRegistry} from '../scenes/registry';
import {createDeliveryCopy, sanitizeDeliveryText, scanDelivery} from './delivery-security';
import {validateFilm} from './film-validation';

type QaCheck = {
  id: string;
  title: string;
  status: 'passed' | 'failed';
  evidence: string[];
};

type QaReport = {
  schemaVersion: '1.0.0';
  projectId: string;
  generatedAt: string;
  status: 'passed' | 'failed';
  checks: QaCheck[];
};

const errorEvidence = (error: unknown): string => sanitizeDeliveryText(error instanceof Error ? error.message : String(error));

const runTool = async (command: string, args: string[]): Promise<string> => new Promise((resolve, reject) => {
  execFile(command, args, {maxBuffer: 40 * 1024 * 1024}, (error, stdout, stderr) => {
    if (!error) {
      resolve(stdout);
      return;
    }
    reject(new Error(`${path.basename(command)} ${args.join(' ')} failed: ${stderr || stdout || error.message}`));
  });
});

const assertVideoFile = async (file: string, label: string): Promise<void> => {
  const info = await stat(file).catch(() => {
    throw new Error(`Final video does not exist: ${label}`);
  });
  if (!info.isFile() || info.size === 0) throw new Error(`Final video is empty or not a file: ${label}`);
};

const check = async (id: string, title: string, run: () => Promise<string[]> | string[]): Promise<QaCheck> => {
  try {
    const evidence = await run();
    return {id, title, status: 'passed', evidence};
  } catch (error) {
    return {id, title, status: 'failed', evidence: [errorEvidence(error)]};
  }
};

const markdown = (report: QaReport): string => {
  const rows = report.checks.map((item) => {
    const evidence = item.evidence.map((line) => line.replace(/\|/g, '\\|').replace(/\n/g, '<br>')).join('<br>');
    return `| ${item.id} | ${item.title} | ${item.status === 'passed' ? '通过' : '未通过'} | ${evidence} |`;
  });
  return [
    `# 项目 ${report.projectId} QA 报告`,
    '',
    `- 生成时间：${report.generatedAt}`,
    `- 总体结果：${report.status === 'passed' ? '通过' : '未通过'}`,
    '- 判定规则：所有检查均为“通过”才可导出；失败证据原样保留，不用警告代替通过。',
    '',
    '| 检查 ID | 检查项 | 结果 | 证据 |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n');
};

const writeReports = async (projectDirectory: string, report: QaReport): Promise<void> => {
  const directory = path.join(projectDirectory, 'qa');
  await mkdir(directory, {recursive: true});
  await Promise.all([
    writeFile(path.join(directory, 'qa-report.json'), `${JSON.stringify(report, null, 2)}\n`),
    writeFile(path.join(directory, 'qa-report.md'), markdown(report)),
  ]);
};

export const exportProject = async (options: {
  projectRoot: string;
  projectId: string;
  outputDirectory: string;
}): Promise<void> => {
  const {projectRoot, projectId, outputDirectory} = options;
  const projectDirectory = path.join(projectRoot, 'output', 'projects', projectId);
  let film: FilmSpec | undefined;
  const checks: QaCheck[] = [];
  checks.push(await check('film-schema', 'Film Schema', async () => {
    const value = JSON.parse(await readFile(path.join(projectDirectory, 'film.json'), 'utf8'));
    film = filmSchema.parse(value);
    return [`schemaVersion=${film.schemaVersion}`, `scenes=${film.scenes.length}`];
  }));
  checks.push(await check('target-film-validation', '目标 Film 校验', async () => {
    if (!film) throw new Error('Film Schema 未通过，无法执行目标 Film 校验');
    await validateFilm(film, {publicRoot: path.join(projectRoot, 'public')});
    return ['场景、卡片、素材和三轨音频的目标 Film 校验通过'];
  }));
  let expectedFrames: number | undefined;
  let expectsAudio = false;
  checks.push(await check('scene-card-registry', '场景与卡片注册', () => {
    if (!film) throw new Error('Film Schema 未通过，无法检查注册表');
    const cards = new Set<string>();
    for (const scene of film.scenes) {
      if (!sceneRegistry.has(scene.sceneComponent)) throw new Error(`Missing scene component: ${scene.sceneComponent}`);
      for (const motion of [scene.motion.primary, scene.motion.camera, scene.motion.text, scene.motion.transitionOut]) {
        if (!motion) continue;
        if (!cardRegistry.has(motion.cardId)) throw new Error(`Missing card: ${motion.cardId}`);
        cards.add(motion.cardId);
      }
    }
    return [`registeredScenes=${film.scenes.length}`, `registeredCards=${cards.size}`, ...[...cards].sort().map((id) => `card=${id}`)];
  }));
  checks.push(await check('asset-localization', '素材项目内本地化', async () => {
    if (!film) throw new Error('Film Schema 未通过，无法检查素材');
    const publicRoot = path.join(projectRoot, 'public');
    const realPublicRoot = await realpath(publicRoot);
    const evidence: string[] = [];
    for (const asset of film.assets) {
      const normalized = assertLocalPublicPath(asset.path, `Asset ${asset.id}`);
      const file = path.resolve(publicRoot, ...normalized.split('/'));
      const info = await lstat(file).catch(() => {
        throw new Error(`Asset ${asset.id} does not exist: ${asset.path}`);
      });
      if (info.isSymbolicLink() || !info.isFile()) throw new Error(`Asset ${asset.id} must be a regular local file: ${asset.path}`);
      const relative = path.relative(realPublicRoot, await realpath(file));
      if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Asset ${asset.id} resolves outside public/: ${asset.path}`);
      evidence.push(`${asset.id}: public/${normalized} (${info.size} bytes)`);
    }
    return evidence.length > 0 ? evidence : ['assets=0（未引用外部素材）'];
  }));
  checks.push(await check('total-frames', '时间线与总帧数', () => {
    if (!film) throw new Error('Film Schema 未通过，无法计算总帧数');
    const timeline = compileTimeline(film);
    const sum = film.scenes.reduce((total, scene) => total + scene.durationInFrames, 0);
    if (timeline.durationInFrames !== sum) throw new Error(`Timeline duration mismatch: ${timeline.durationInFrames} != ${sum}`);
    expectedFrames = sum;
    return [
      `expectedFrames=${sum}`,
      `fps=${film.output.fps}`,
      `expectedDurationSeconds=${(sum / film.output.fps).toFixed(3)}`,
      ...timeline.scenes.map((scene) => `${scene.id}: from=${scene.from}, frames=${scene.durationInFrames}`),
    ];
  }));
  checks.push(await check('audio-tracks', 'BGM/Voice/SFX 三轨音频', () => {
    if (!film) throw new Error('Film Schema 未通过，无法检查三轨音频');
    const tracks = validateAudioTracks(film, compileTimeline(film));
    expectsAudio = Boolean(tracks.bgm) || tracks.voice.length > 0 || tracks.sfx.length > 0;
    return [
      tracks.bgm ? `BGM=1 src=${tracks.bgm.src} volume=${tracks.bgm.volume} loop=${tracks.bgm.loop}` : 'BGM=0（合法空轨）',
      `Voice=${tracks.voice.length}`,
      ...tracks.voice.map((segment) => `Voice ${segment.sceneId}: local=${segment.start}-${segment.end}, absoluteFrom=${segment.from}, src=${segment.src}`),
      `SFX=${tracks.sfx.length}`,
      ...tracks.sfx.map((event) => `SFX ${event.sceneId}: localFrame=${event.frame}, absoluteFrame=${event.at}, src=${event.src}`),
    ];
  }));
  const videoFile = path.join(projectDirectory, 'film.mp4');
  const videoLabel = `output/projects/${projectId}/film.mp4`;
  checks.push(await check('video-ffprobe', '最终视频 ffprobe', async () => {
    await assertVideoFile(videoFile, videoLabel);
    const output = await runTool(process.env.FFPROBE_PATH ?? 'ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration:stream=codec_type,codec_name,width,height,nb_frames,duration,avg_frame_rate',
      '-of', 'json',
      videoFile,
    ]);
    const probe = JSON.parse(output) as {
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
    const video = probe.streams?.find((stream) => stream.codec_type === 'video');
    const audio = probe.streams?.find((stream) => stream.codec_type === 'audio');
    if (!video) throw new Error(`Final video has no video stream: ${videoLabel}`);
    if (video.codec_name !== 'h264') throw new Error(`Final video codec must be h264, got ${video.codec_name ?? 'unknown'}`);
    if (film && expectedFrames !== undefined) {
      if (Number(video.nb_frames) !== expectedFrames) {
        throw new Error(`Final video has ${video.nb_frames ?? 'unknown'} frames, expected ${expectedFrames}`);
      }
      if (video.width !== film.output.width || video.height !== film.output.height) {
        throw new Error(`Final video dimensions ${video.width}x${video.height}, expected ${film.output.width}x${film.output.height}`);
      }
      const [fpsNumerator, fpsDenominator] = (video.avg_frame_rate ?? '').split('/').map(Number);
      const actualFps = fpsNumerator / fpsDenominator;
      if (!Number.isFinite(actualFps) || Math.abs(actualFps - film.output.fps) > 0.001) {
        throw new Error(`Final video fps ${video.avg_frame_rate ?? 'unknown'}, expected ${film.output.fps}`);
      }
      const duration = Number(probe.format?.duration);
      if (!Number.isFinite(duration) || Math.abs(duration - expectedFrames / film.output.fps) > 0.1) {
        throw new Error(`Final video duration ${probe.format?.duration ?? 'unknown'}s, expected ${expectedFrames / film.output.fps}s`);
      }
      if (expectsAudio && !audio) throw new Error('Final video is missing the declared BGM/Voice/SFX audio mix');
      if (!expectsAudio && audio) throw new Error('Final video unexpectedly contains an audio stream');
    }
    return [
      `file=${videoLabel}`,
      `actualFrames=${video.nb_frames ?? 'unknown'}; expectedFrames=${expectedFrames ?? 'unknown'}`,
      `video=${video.codec_name} ${video.width}x${video.height}@${video.avg_frame_rate ?? 'unknown'}`,
      `audio=${audio?.codec_name ?? (expectsAudio ? 'missing' : 'none')}`,
      `ffprobe=${JSON.stringify(probe)}`,
    ];
  }));
  checks.push(await check('video-decode', '最终视频完整解码', async () => {
    await assertVideoFile(videoFile, videoLabel);
    await runTool(process.env.FFMPEG_PATH ?? 'ffmpeg', [
      '-v', 'error', '-xerror', '-i', videoFile, '-f', 'null', '-',
    ]);
    return [`ffmpeg -xerror 完整解码通过：${videoLabel}`];
  }));
  checks.push(await check('approval-gates', 'G1/G2 审批状态', async () => {
    const state = productionStateSchema.parse(JSON.parse(await readFile(path.join(projectDirectory, 'project.json'), 'utf8')));
    assertRenderAllowed(state, 'film');
    if (!state.designApprovedAt || !state.sampleApprovedAt) {
      throw new Error('G1/G2 approval timestamps are required before export');
    }
    return [
      `status=${state.status}`,
      `G1 designApprovedAt=${state.designApprovedAt}`,
      `G2 sampleApprovedAt=${state.sampleApprovedAt}`,
    ];
  }));
  const report: QaReport = {
    schemaVersion: '1.0.0',
    projectId,
    generatedAt: new Date().toISOString(),
    status: checks.every((item) => item.status === 'passed') ? 'passed' : 'failed',
    checks,
  };
  await writeReports(projectDirectory, report);
  if (report.status === 'failed') {
    throw new Error(`Export QA failed; see output/projects/${projectId}/qa/qa-report.md`);
  }
  if (!film) throw new Error('Cannot package without a valid Film');
  const destination = path.resolve(outputDirectory);
  const insideProjectData = path.relative(projectDirectory, destination);
  if (insideProjectData === '' || (!insideProjectData.startsWith(`..${path.sep}`) && insideProjectData !== '..' && !path.isAbsolute(insideProjectData))) {
    throw new Error('Export destination must be outside the source project data directory');
  }
  const projectFromDestination = path.relative(destination, projectRoot);
  if (projectFromDestination === '' || (!projectFromDestination.startsWith(`..${path.sep}`) && projectFromDestination !== '..' && !path.isAbsolute(projectFromDestination))) {
    throw new Error('Export destination must not be the project root or its ancestor');
  }
  try {
    await lstat(destination);
    throw new Error(`Export destination already exists: ${destination}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const stagingDirectory = path.join(
    path.dirname(destination),
    `.${path.basename(destination)}.tmp-${process.pid}-${Date.now().toString(36)}`,
  );
  await mkdir(path.dirname(destination), {recursive: true});
  await mkdir(stagingDirectory);
  try {
    await createDeliveryCopy({projectRoot, projectId, projectDirectory, stagingDirectory, film});
    const scanned = await scanDelivery(stagingDirectory);
    checks.push({
      id: 'delivery-hygiene',
      title: '交付包独立性与安全扫描',
      status: scanned.violations.length === 0 ? 'passed' : 'failed',
      evidence: scanned.violations.length === 0
        ? [`files=${scanned.files}`, '无密钥/凭据文件、本机绝对路径、软链接、本地 npm 依赖、node_modules、.git、build 或渲染缓存']
        : scanned.violations,
    });
    report.status = checks.every((item) => item.status === 'passed') ? 'passed' : 'failed';
    if (scanned.violations.length > 0) throw new Error(`Delivery hygiene failed: ${scanned.violations.join('; ')}`);
    await writeReports(stagingDirectory, report);
    await rename(stagingDirectory, destination);
    await writeReports(projectDirectory, report);
    console.log(`QA passed: ${report.checks.length} checks`);
    console.log(`Exported delivery package: ${destination}`);
  } catch (error) {
    if (!checks.some((item) => item.id === 'delivery-hygiene')) {
      checks.push({id: 'delivery-hygiene', title: '交付包独立性与安全扫描', status: 'failed', evidence: [errorEvidence(error)]});
    }
    report.status = 'failed';
    await writeReports(projectDirectory, report);
    throw new Error(errorEvidence(error));
  } finally {
    await rm(stagingDirectory, {recursive: true, force: true});
  }
};
