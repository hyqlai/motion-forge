import assert from 'node:assert/strict';
import {spawn, type ChildProcess} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {filmSchema} from '../core/schema';
import {sampleFilm} from '../examples/theme-demo/film';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectId = `workbench-audio-${process.pid}-${Date.now().toString(36)}`;
const projectDirectory = path.join(root, 'output', 'projects', projectId);
const publicDirectory = path.join(root, 'public', 'assets', projectId);

const freePort = (): Promise<number> => new Promise((resolve, reject) => {
  const server = createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    if (!address || typeof address === 'string') {
      server.close();
      reject(new Error('Unable to allocate a port'));
      return;
    }
    const {port} = address;
    server.close(() => resolve(port));
  });
});

const waitForServer = async (baseUrl: string): Promise<void> => {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/projects/${projectId}/film`);
      if (response.ok) return;
    } catch {
      // 服务尚未监听，继续轮询。
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Workbench dev server did not become ready at ${baseUrl}`);
};

const stopServer = async (child: ChildProcess): Promise<void> => {
  if (child.exitCode !== null) return;
  await new Promise<void>((resolve) => {
    child.once('exit', () => resolve());
    child.kill('SIGTERM');
    setTimeout(() => {
      if (child.exitCode === null) child.kill('SIGKILL');
      resolve();
    }, 3_000);
  });
};

const bgmPath = `assets/${projectId}/bgm.wav`;
const voicePath = `assets/${projectId}/voice.wav`;
const sfxPath = `assets/${projectId}/sfx.wav`;

await mkdir(projectDirectory, {recursive: true});
await mkdir(publicDirectory, {recursive: true});
await writeFile(path.join(publicDirectory, 'bgm.wav'), 'bgm');
await writeFile(path.join(publicDirectory, 'voice.wav'), 'voice');
await writeFile(path.join(publicDirectory, 'sfx.wav'), 'sfx');

const port = await freePort();
const baseUrl = `http://127.0.0.1:${port}`;

const film = filmSchema.parse({
  ...sampleFilm,
  id: projectId,
  assets: [
    {id: 'bgm-workbench', kind: 'audio', path: bgmPath, role: 'bgm', metadata: {}},
    {id: 'voice-S01-opening', kind: 'voice', path: voicePath, role: 'narration', metadata: {}},
    {id: 'sfx-workbench', kind: 'audio', path: sfxPath, role: 'sfx', metadata: {}},
  ],
  audio: {
    bgm: {src: bgmPath, volume: 0.2, loop: true},
    voice: {segments: [{sceneId: 'S01-opening', start: 0, end: 30, text: '工作台旁白'}]},
    sfx: {events: [{sceneId: 'S02-system', frame: 12, kind: 'sfx-workbench'}]},
  },
  scenes: sampleFilm.scenes.map((scene) => scene.id === 'S01-opening'
    ? {...scene, assetIds: ['voice-S01-opening']}
    : scene),
});
await writeFile(path.join(projectDirectory, 'film.json'), `${JSON.stringify(film, null, 2)}\n`);
await writeFile(path.join(projectDirectory, 'project.json'), `${JSON.stringify({status: 'production', notes: []}, null, 2)}\n`);

let server: ChildProcess | undefined;
try {
  server = spawn(path.join(root, 'node_modules', '.bin', 'vite'), [
    '--config', 'workbench/vite.config.ts',
    '--port', String(port),
    '--strictPort',
  ], {cwd: root, stdio: 'ignore'});
  await waitForServer(baseUrl);

  const loaded = await fetch(`${baseUrl}/api/projects/${projectId}/film`);
  assert.equal(loaded.status, 200);
  const loadedFilm = await loaded.json() as typeof film;
  assert.equal(loadedFilm.audio.voice.segments[0].text, '工作台旁白');
  assert.equal(loadedFilm.audio.sfx.events[0].kind, 'sfx-workbench');

  const invalid = {
    ...loadedFilm,
    audio: {...loadedFilm.audio, voice: {segments: [{sceneId: 'S09-missing', start: 0, end: 10, text: '越界'}]}},
  };
  const rejected = await fetch(`${baseUrl}/api/projects/${projectId}/film`, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(invalid),
  });
  assert.equal(rejected.status, 400, 'invalid audio tracks must be rejected by the workbench API');
  const storedAfterReject = JSON.parse(await readFile(path.join(projectDirectory, 'project.json'), 'utf8')) as {status: string};
  assert.equal(storedAfterReject.status, 'production', 'rejected audio edits must not reset approvals');

  const edited = {
    ...loadedFilm,
    audio: {
      ...loadedFilm.audio,
      bgm: {src: bgmPath, volume: 0.45, loop: false},
      voice: {segments: [{sceneId: 'S01-opening', start: 5, end: 25, text: '修改后的旁白'}]},
      sfx: {events: [{sceneId: 'S02-system', frame: 20, kind: 'sfx-workbench'}]},
    },
  };
  const saved = await fetch(`${baseUrl}/api/projects/${projectId}/film`, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(edited),
  });
  assert.equal(saved.status, 200);
  const savedBody = await saved.json() as {approvalReset: boolean; status: string};
  assert.equal(savedBody.approvalReset, true);
  assert.equal(savedBody.status, 'design-review');

  const persisted = JSON.parse(await readFile(path.join(projectDirectory, 'film.json'), 'utf8')) as typeof film;
  assert.equal(persisted.audio.bgm?.volume, 0.45);
  assert.equal(persisted.audio.bgm?.loop, false);
  assert.equal(persisted.audio.voice.segments[0].start, 5);
  assert.equal(persisted.audio.sfx.events[0].frame, 20);
  const resetState = JSON.parse(await readFile(path.join(projectDirectory, 'project.json'), 'utf8')) as {status: string};
  assert.equal(resetState.status, 'design-review');
} finally {
  if (server) await stopServer(server);
  await rm(projectDirectory, {recursive: true, force: true});
  await rm(publicDirectory, {recursive: true, force: true});
}

console.log('Workbench audio track API and approval reset checks passed');
