import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {existsSync} from 'node:fs';
import {cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {filmSchema} from '../core/schema';
import {sampleFilm} from '../examples/theme-demo/film';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectId = `export-${process.pid}-${Date.now().toString(36)}`;
const projectDirectory = path.join(root, 'output', 'projects', projectId);
const publicDirectory = path.join(root, 'public', 'assets', projectId);
const exportDirectory = path.join(root, 'output', 'deliveries', projectId);
const qaJsonFile = path.join(projectDirectory, 'qa', 'qa-report.json');
const qaMarkdownFile = path.join(projectDirectory, 'qa', 'qa-report.md');
// 使用项目磁盘上的短路径，同时避开 tmpfs 配额与 tsx Unix socket 的 108 字符上限。
await mkdir(path.join(root, 'output'), {recursive: true});
const cleanRoom = await mkdtemp(path.join(root, 'output', 'e-'));
const cleanProject = path.join(cleanRoom, 'delivery');

const runForge = (args: string[], env: NodeJS.ProcessEnv = {}): Promise<{code: number; output: string}> => new Promise((resolve, reject) => {
  const child = execFile(path.join(root, 'node_modules', '.bin', 'tsx'), ['scripts/motion-forge.ts', ...args], {
    cwd: root,
    env: {...process.env, ...env},
    maxBuffer: 40 * 1024 * 1024,
  });
  let output = '';
  child.stdout?.on('data', (chunk: Buffer) => { output += chunk.toString(); });
  child.stderr?.on('data', (chunk: Buffer) => { output += chunk.toString(); });
  child.once('error', reject);
  child.once('exit', (code) => resolve({code: code ?? 1, output}));
});

const writeJson = async (file: string, value: unknown): Promise<void> => {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
};

const writeState = async (status: string): Promise<void> => {
  await writeJson(path.join(projectDirectory, 'project.json'), {
    status,
    ...(status === 'production' || status === 'delivered' ? {
      designApprovedAt: '2026-01-01T00:00:00.000Z',
      sampleApprovedAt: '2026-01-01T00:01:00.000Z',
    } : {}),
    notes: [],
  });
};

const assertCleanDelivery = async (directory: string, needles: string[]): Promise<void> => {
  const binaryExtensions = new Set(['.mp4', '.mp3', '.wav', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.woff', '.woff2', '.ttf', '.glb', '.hdr']);
  const visit = async (current: string): Promise<void> => {
    for (const entry of await readdir(current, {withFileTypes: true})) {
      const absolute = path.join(current, entry.name);
      assert.equal(entry.isSymbolicLink(), false, `delivery must not contain symbolic link: ${entry.name}`);
      if (entry.isDirectory()) {
        assert.equal(['node_modules', '.git', 'build', 'dist', '.render-cache'].includes(entry.name), false,
          `delivery contains excluded directory: ${entry.name}`);
        await visit(absolute);
        continue;
      }
      assert.doesNotMatch(entry.name, /^(?:\.env(?:\..*)?|credentials.*|id_rsa.*|id_ed25519.*|.*\.(?:pem|key|p12|pfx))$/i);
      if (binaryExtensions.has(path.extname(entry.name).toLowerCase())) continue;
      const text = await readFile(absolute, 'utf8');
      for (const needle of needles) {
        assert.equal(text.includes(needle), false, `delivery leaked a local absolute path in ${path.relative(directory, absolute)}`);
      }
    }
  };
  await visit(directory);
};

const runCommand = (
  command: string,
  args: string[],
  cwd = root,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> => new Promise((resolve, reject) => {
  const child = execFile(command, args, {cwd, env, maxBuffer: 40 * 1024 * 1024});
  let output = '';
  child.stdout?.on('data', (chunk: Buffer) => { output += chunk.toString(); });
  child.stderr?.on('data', (chunk: Buffer) => { output += chunk.toString(); });
  child.once('error', reject);
  child.once('exit', (code) => {
    if (code === 0) resolve(output);
    else reject(new Error(`Command failed (exit ${code}): ${command} ${args.join(' ')}\n${output.slice(-4000)}`));
  });
});

await mkdir(projectDirectory, {recursive: true});
await mkdir(publicDirectory, {recursive: true});
const bgmPath = `assets/${projectId}/bgm.wav`;
const voicePath = `assets/${projectId}/voice.wav`;
const sfxPath = `assets/${projectId}/sfx.wav`;
for (const [name, frequency] of [['bgm.wav', 220], ['voice.wav', 660], ['sfx.wav', 1320]] as const) {
  await runCommand('ffmpeg', [
    '-v', 'error', '-f', 'lavfi', '-i', `sine=frequency=${frequency}:sample_rate=44100:duration=1`,
    '-y', path.join(publicDirectory, name),
  ]);
}
const film = filmSchema.parse({
  ...sampleFilm,
  id: projectId,
  title: '交付包验证',
  output: {width: 320, height: 180, fps: 30},
  assets: [
    {id: 'bgm-fixture', kind: 'audio', path: bgmPath, role: 'bgm', source: 'https://example.com/bgm', metadata: {provider: 'fixture'}},
    {id: 'voice-S01-opening', kind: 'voice', path: voicePath, role: 'narration', metadata: {provider: 'fixture'}},
    {id: 'sfx-fixture', kind: 'audio', path: sfxPath, role: 'sfx', metadata: {provider: 'fixture'}},
  ],
  audio: {
    bgm: {src: bgmPath, volume: 0.04, loop: true},
    voice: {segments: [{sceneId: 'S01-opening', start: 1, end: 8, text: '交付包旁白'}]},
    sfx: {events: [{sceneId: 'S02-system', frame: 5, kind: 'sfx-fixture'}]},
  },
  scenes: sampleFilm.scenes.slice(0, 2).map((scene, index) => ({
    ...scene,
    durationInFrames: 12,
    assetIds: index === 0 ? ['voice-S01-opening'] : [],
    qa: {frames: [0, 6], checkpoints: scene.qa.checkpoints},
  })),
});
await writeJson(path.join(projectDirectory, 'film.json'), film);
await writeJson(path.join(projectDirectory, 'assets.json'), {assets: film.assets});
await writeJson(path.join(projectDirectory, 'input.json'), {
  kind: 'theme',
  values: ['交付包验证'],
  value: '交付包验证',
});

try {
  await writeState('design-review');
  const unapproved = await runForge(['export', '--project', projectId, '--out', exportDirectory]);
  assert.notEqual(unapproved.code, 0, 'export must reject a project that has not passed G1/G2');
  assert.equal(existsSync(exportDirectory), false, 'a rejected export must not leave a delivery directory');
  const report = JSON.parse(await readFile(qaJsonFile, 'utf8')) as {
    status: string;
    checks: {id: string; status: string; evidence: string[]}[];
  };
  assert.equal(report.status, 'failed');
  const approval = report.checks.find((check) => check.id === 'approval-gates');
  assert.equal(approval?.status, 'failed');
  assert.ok(approval?.evidence.some((line) => /G1|G2|design|sample|approved/i.test(line)));
  assert.match(await readFile(qaMarkdownFile, 'utf8'), /未通过|失败|failed/i);

  await writeState('production');
  const missingVideo = await runForge(['export', '--project', projectId, '--out', exportDirectory]);
  assert.notEqual(missingVideo.code, 0, 'export must reject a missing final MP4');
  const missingVideoReport = JSON.parse(await readFile(qaJsonFile, 'utf8')) as typeof report;
  for (const id of ['video-ffprobe', 'video-decode']) {
    const item = missingVideoReport.checks.find((check) => check.id === id);
    assert.equal(item?.status, 'failed', `${id} must fail with explicit evidence`);
    assert.ok(item?.evidence.some((line) => /film\.mp4|ENOENT|not exist|missing/i.test(line)));
  }
  assert.equal(existsSync(exportDirectory), false);

  await runCommand('ffmpeg', [
    '-v', 'error',
    '-f', 'lavfi', '-i', 'color=c=black:s=320x180:r=30',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100:duration=0.8',
    '-frames:v', '24', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
    '-t', '0.8', '-y', path.join(projectDirectory, 'film.mp4'),
  ]);
  const exported = await runForge(['export', '--project', projectId, '--out', exportDirectory]);
  assert.equal(exported.code, 0, `valid export failed:\n${exported.output}`);
  for (const relative of [
    'video/film.mp4',
    'qa/qa-report.json',
    'qa/qa-report.md',
    'assets-manifest.json',
    'README.md',
    'package.json',
    'package-lock.json',
    'motion-forge-project.json',
    `output/projects/${projectId}/film.json`,
    `public/assets/${projectId}/bgm.wav`,
    'core/index.ts',
    'workbench/vite.config.ts',
  ]) {
    assert.equal(existsSync(path.join(exportDirectory, relative)), true, `delivery is missing ${relative}`);
  }
  const passedReport = JSON.parse(await readFile(qaJsonFile, 'utf8')) as typeof report;
  assert.equal(passedReport.status, 'passed');
  for (const id of [
    'film-schema', 'target-film-validation', 'scene-card-registry', 'asset-localization',
    'audio-tracks', 'total-frames', 'approval-gates', 'video-ffprobe', 'video-decode',
    'delivery-hygiene',
  ]) {
    assert.equal(passedReport.checks.find((check) => check.id === id)?.status, 'passed', `${id} must pass`);
  }
  const manifest = JSON.parse(await readFile(path.join(exportDirectory, 'assets-manifest.json'), 'utf8')) as {
    assets: {id: string; path: string; sha256: string}[];
  };
  assert.deepEqual(manifest.assets.map((asset) => asset.id), ['bgm-fixture', 'voice-S01-opening', 'sfx-fixture']);
  assert.ok(manifest.assets.every((asset) => /^[a-f0-9]{64}$/.test(asset.sha256)));

  await runCommand('ffmpeg', [
    '-v', 'error',
    '-f', 'lavfi', '-i', 'color=c=black:s=320x180:r=30',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100:duration=0.8',
    '-frames:v', '23', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
    '-t', '0.8', '-y', path.join(projectDirectory, 'film.mp4'),
  ]);
  const frameFailureDirectory = `${exportDirectory}-frame-failure`;
  const frameFailure = await runForge(['export', '--project', projectId, '--out', frameFailureDirectory]);
  assert.notEqual(frameFailure.code, 0, 'even a one-frame mismatch must reject export');
  const frameFailureReport = JSON.parse(await readFile(qaJsonFile, 'utf8')) as typeof report;
  const frameCheck = frameFailureReport.checks.find((check) => check.id === 'video-ffprobe');
  assert.equal(frameCheck?.status, 'failed');
  assert.ok(frameCheck?.evidence.some((line) => /23 frames, expected 24/.test(line)));
  assert.equal(existsSync(frameFailureDirectory), false);
  await runCommand('ffmpeg', [
    '-v', 'error',
    '-f', 'lavfi', '-i', 'color=c=black:s=320x180:r=30',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100:duration=0.8',
    '-frames:v', '24', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
    '-t', '0.8', '-y', path.join(projectDirectory, 'film.mp4'),
  ]);

  const decodeFailureDirectory = `${exportDirectory}-decode-failure`;
  const decodeFailure = await runForge(
    ['export', '--project', projectId, '--out', decodeFailureDirectory],
    {FFMPEG_PATH: 'false'},
  );
  assert.notEqual(decodeFailure.code, 0, 'a full-decode failure must reject export');
  const decodeFailureReport = JSON.parse(await readFile(qaJsonFile, 'utf8')) as typeof report;
  assert.equal(decodeFailureReport.checks.find((check) => check.id === 'video-ffprobe')?.status, 'passed');
  const decodeCheck = decodeFailureReport.checks.find((check) => check.id === 'video-decode');
  assert.equal(decodeCheck?.status, 'failed');
  assert.ok(decodeCheck?.evidence.some((line) => /film\.mp4|failed|decode/i.test(line)));
  assert.equal(existsSync(decodeFailureDirectory), false);

  const absoluteInput = path.join(path.sep, 'home', 'motion-forge-fixture', 'source-audio.wav');
  const filmWithLocalSource = filmSchema.parse({
    ...film,
    assets: film.assets.map((asset) => asset.id === 'bgm-fixture' ? {...asset, source: absoluteInput} : asset),
  });
  await writeJson(path.join(projectDirectory, 'film.json'), filmWithLocalSource);
  await writeJson(path.join(projectDirectory, 'assets.json'), {assets: filmWithLocalSource.assets});
  await writeJson(path.join(projectDirectory, 'input.json'), {
    kind: 'assets',
    values: [absoluteInput],
    value: absoluteInput,
    metadata: {sourcePath: absoluteInput},
  });
  await writeFile(path.join(projectDirectory, 'design-review.md'), `# 来源复核\n\n输入文件：${absoluteInput}\n`);
  await writeFile(path.join(publicDirectory, 'credentials.json'), '{"fixture":"must-not-be-copied"}\n');
  for (const directory of ['node_modules', '.render-cache', 'build']) {
    await mkdir(path.join(projectDirectory, directory), {recursive: true});
    await writeFile(path.join(projectDirectory, directory, 'placeholder.txt'), absoluteInput);
  }
  const originalFilmBytes = await readFile(path.join(projectDirectory, 'film.json'));
  const originalInputBytes = await readFile(path.join(projectDirectory, 'input.json'));
  const sanitizedDirectory = `${exportDirectory}-sanitized`;
  const sanitized = await runForge(['export', '--project', projectId, '--out', sanitizedDirectory]);
  assert.equal(sanitized.code, 0, `sanitized export failed:\n${sanitized.output}`);
  assert.deepEqual(await readFile(path.join(projectDirectory, 'film.json')), originalFilmBytes,
    'export must not rewrite original Film metadata');
  assert.deepEqual(await readFile(path.join(projectDirectory, 'input.json')), originalInputBytes,
    'export must not rewrite original input metadata');
  const exportedFilm = JSON.parse(await readFile(path.join(sanitizedDirectory, 'output', 'projects', projectId, 'film.json'), 'utf8')) as typeof film;
  assert.equal(exportedFilm.assets[0].source, '[local-file:source-audio.wav]');
  const exportedInput = JSON.parse(await readFile(path.join(sanitizedDirectory, 'output', 'projects', projectId, 'input.json'), 'utf8')) as {value: string};
  assert.equal(exportedInput.value, '[local-file:source-audio.wav]');
  assert.equal(existsSync(path.join(sanitizedDirectory, 'public', 'assets', projectId, 'credentials.json')), false);
  await assertCleanDelivery(sanitizedDirectory, [root, absoluteInput]);

  const secretValue = ['sk-live', 'export', 'credential'].join('-');
  await writeJson(path.join(projectDirectory, 'input.json'), {
    kind: 'theme',
    values: ['交付包验证'],
    value: '交付包验证',
    apiKey: secretValue,
  });
  const secretDirectory = `${exportDirectory}-secret`;
  const secret = await runForge(['export', '--project', projectId, '--out', secretDirectory]);
  assert.notEqual(secret.code, 0, 'hard-coded credentials in project metadata must reject export');
  const secretReport = JSON.parse(await readFile(qaJsonFile, 'utf8')) as typeof report;
  assert.equal(secretReport.checks.find((check) => check.id === 'delivery-hygiene')?.status, 'failed');
  assert.equal(existsSync(secretDirectory), false);

  await writeJson(path.join(projectDirectory, 'input.json'), {
    kind: 'theme',
    values: ['交付包验证'],
    value: '交付包验证',
  });
  const absoluteImport = path.join(path.sep, 'home', 'motion-forge-skill', 'core', 'index.ts');
  await writeFile(
    path.join(projectDirectory, 'external-import.ts'),
    `import type {FilmSpec} from '${absoluteImport}';\nexport type Fixture = FilmSpec;\n`,
  );
  const absoluteImportDirectory = `${exportDirectory}-absolute-import`;
  const absoluteImportResult = await runForge(['export', '--project', projectId, '--out', absoluteImportDirectory]);
  assert.notEqual(absoluteImportResult.code, 0, 'an absolute source import must reject export instead of being sanitized');
  const absoluteImportReport = JSON.parse(await readFile(qaJsonFile, 'utf8')) as typeof report;
  const importHygiene = absoluteImportReport.checks.find((check) => check.id === 'delivery-hygiene');
  assert.equal(importHygiene?.status, 'failed');
  assert.ok(importHygiene?.evidence.some((line) => line.includes('absolute source import')));
  assert.equal(existsSync(absoluteImportDirectory), false);

  const relativeImport = ['..', '..', '..', '..', '..', '..', 'motion-forge', 'core', 'index.ts'].join('/');
  await writeFile(
    path.join(projectDirectory, 'external-import.ts'),
    `import type {FilmSpec} from '${relativeImport}';\nexport type Fixture = FilmSpec;\n`,
  );
  const relativeImportDirectory = `${exportDirectory}-relative-import`;
  const relativeImportResult = await runForge(['export', '--project', projectId, '--out', relativeImportDirectory]);
  assert.notEqual(relativeImportResult.code, 0, 'a relative import escaping the delivery root must reject export');
  const relativeImportReport = JSON.parse(await readFile(qaJsonFile, 'utf8')) as typeof report;
  const relativeHygiene = relativeImportReport.checks.find((check) => check.id === 'delivery-hygiene');
  assert.equal(relativeHygiene?.status, 'failed');
  assert.ok(relativeHygiene?.evidence.some((line) => line.includes('relative source import escapes delivery root')));
  assert.equal(existsSync(relativeImportDirectory), false);

  await cp(sanitizedDirectory, cleanProject, {recursive: true, errorOnExist: true});
  const cleanEnv = Object.fromEntries(Object.entries(process.env)
    .filter(([key]) => !/(?:API_KEY|TOKEN|SECRET|PASSWORD)/.test(key))) as NodeJS.ProcessEnv;
  const cleanTemp = path.join(cleanRoom, 't');
  await mkdir(cleanTemp, {recursive: true});
  cleanEnv.TMPDIR = cleanTemp;
  cleanEnv.TEMP = cleanTemp;
  cleanEnv.TMP = cleanTemp;
  delete cleanEnv.REMOTION_BROWSER_EXECUTABLE;
  console.log('干净副本：npm ci');
  await runCommand('npm', ['ci'], cleanProject, cleanEnv);
  console.log('干净副本：目标 Film validate');
  await runCommand('npm', ['run', 'validate', '--', '--project', projectId], cleanProject, cleanEnv);
  console.log('干净副本：TypeScript 与工作台 build');
  await runCommand('npm', ['run', 'build'], cleanProject, cleanEnv);
  const browserRelative = 'node_modules/.remotion/chrome-headless-shell/linux64/chrome-headless-shell-linux64/chrome-headless-shell';
  const installedBrowser = path.join(root, browserRelative);
  const browserArgs: string[] = [];
  if (existsSync(installedBrowser)) {
    // 浏览器只是渲染工具；复制后从干净副本内启动，避免运行时访问模板目录或重复联网下载。
    const cleanBrowser = path.join(cleanProject, browserRelative);
    await mkdir(path.dirname(cleanBrowser), {recursive: true});
    await cp(path.dirname(installedBrowser), path.dirname(cleanBrowser), {recursive: true});
    browserArgs.push(`--browser-executable=${cleanBrowser}`);
  }
  console.log('干净副本：swangle 真实渲染');
  await runCommand('npm', [
    'run', 'forge', '--', 'render', '--project', projectId, '--scope', 'film', '--gl', 'swangle', '--bundle-cache=false',
    ...browserArgs,
  ], cleanProject, cleanEnv);
  const renderedFile = path.join(cleanProject, 'output', 'projects', projectId, 'film.mp4');
  const renderedProbe = JSON.parse(await runCommand('ffprobe', [
    '-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,nb_frames:format=duration',
    '-of', 'json', renderedFile,
  ], cleanProject, cleanEnv)) as {
    streams?: {codec_type?: string; width?: number; height?: number; nb_frames?: string}[];
  };
  const renderedVideo = renderedProbe.streams?.find((stream) => stream.codec_type === 'video');
  assert.equal(renderedVideo?.width, 320);
  assert.equal(renderedVideo?.height, 180);
  assert.equal(Number(renderedVideo?.nb_frames), 24);
  assert.ok(renderedProbe.streams?.some((stream) => stream.codec_type === 'audio'));
  await runCommand('ffmpeg', ['-v', 'error', '-xerror', '-i', renderedFile, '-f', 'null', '-'], cleanProject, cleanEnv);
} finally {
  if (!process.env.KEEP_FIXTURE) {
    await rm(projectDirectory, {recursive: true, force: true});
    await rm(publicDirectory, {recursive: true, force: true});
    for (const directory of [
      exportDirectory,
      `${exportDirectory}-decode-failure`,
      `${exportDirectory}-frame-failure`,
      `${exportDirectory}-sanitized`,
      `${exportDirectory}-secret`,
      `${exportDirectory}-absolute-import`,
      `${exportDirectory}-relative-import`,
    ]) {
      await rm(directory, {recursive: true, force: true});
    }
    await rm(cleanRoom, {recursive: true, force: true});
  }
}

console.log('导出 QA、门禁、安全与干净副本独立渲染端到端验证通过');
