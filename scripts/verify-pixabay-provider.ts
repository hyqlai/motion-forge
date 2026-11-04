import assert from 'node:assert/strict';
import {createServer, type IncomingMessage, type ServerResponse} from 'node:http';
import type {AddressInfo} from 'node:net';
import {spawn} from 'node:child_process';
import {mkdir, readFile, rm, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sampleFilm} from '../examples/theme-demo/film';
import {createPixabayMusicProvider} from '../providers/pixabay-music';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = path.join(root, 'public', 'audio', 'music.wav');

type Handler = (request: IncomingMessage, response: ServerResponse, url: URL) => void;

const startServer = async (handlers: Record<string, Handler>, requestedPort = 0) => {
  const requests: string[] = [];
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    requests.push(`${request.method} ${url.pathname}${url.search}`);
    const handler = handlers[url.pathname];
    if (!handler) {
      response.statusCode = 404;
      response.end('not found');
      return;
    }
    handler(request, response, url);
  });
  await new Promise<void>((resolve) => server.listen(requestedPort, '127.0.0.1', resolve));
  const {port} = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    requests,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
};

const json = (response: ServerResponse, status: number, body: unknown): void => {
  response.statusCode = status;
  response.setHeader('content-type', 'application/json');
  response.end(JSON.stringify(body));
};

const errorCode = async (promise: Promise<unknown>, code: string): Promise<void> => {
  await assert.rejects(promise, (error: unknown) => {
    assert.ok(error instanceof Error, 'expected an Error');
    assert.equal((error as Error & {code?: string}).code, code, error.message);
    return true;
  });
};

const musicHit = {
  id: 4242,
  pageURL: 'https://pixabay.com/music/calm-ambient-4242/',
  tags: 'calm, ambient, cinematic',
  duration: 9,
  audio: '/download/sample.wav',
  user: 'Mock Composer',
  downloads: 12,
  likes: 4,
};

const handlers = (): Record<string, Handler> => ({
  '/api/music/': (_request, response) => json(response, 200, {total: 1, totalHits: 1, hits: [musicHit]}),
  '/api/music/empty/': (_request, response) => json(response, 200, {total: 0, totalHits: 0, hits: []}),
  '/api/music/unauthorized/': (_request, response) => {
    response.statusCode = 401;
    response.end('invalid api key');
  },
  '/api/music/download-fail/': (_request, response) => json(response, 200, {total: 1, totalHits: 1, hits: [{...musicHit, audio: '/download/fail'}]}),
  '/download/sample.wav': async (_request, response) => {
    response.setHeader('content-type', 'audio/wav');
    response.end(await readFile(fixture));
  },
  '/download/fail': (_request, response) => {
    response.statusCode = 500;
    response.end('download exploded');
  },
  '/api/music/rate-limited/': (_request, response) => {
    response.statusCode = 429;
    response.end('API rate limit exceeded');
  },
});

const apiKey = 'demo-credential';

const runSearchChecks = async (baseUrl: string, requests: string[]): Promise<void> => {
  const missingKey = createPixabayMusicProvider({baseUrl, enabled: true, fetchImpl: fetch});
  await errorCode(missingKey.search({kind: 'audio', query: 'calm', sceneId: 'S01-opening'}), 'not-configured');
  assert.equal(requests.length, 0, 'missing key must not issue network requests');

  const disabled = createPixabayMusicProvider({apiKey, baseUrl, enabled: false, fetchImpl: fetch});
  await errorCode(disabled.search({kind: 'audio', query: 'calm', sceneId: 'S01-opening'}), 'not-configured');
  assert.equal(requests.length, 0, 'disabled provider must not issue network requests');

  const provider = createPixabayMusicProvider({apiKey, baseUrl, fetchImpl: fetch});
  const results = await provider.search({kind: 'audio', query: 'calm ambient', sceneId: 'S01-opening'});
  assert.equal(results.length, 1);
  const candidate = results[0];
  assert.equal(candidate.kind, 'audio');
  assert.equal(candidate.provider, 'pixabay-music');
  assert.equal(candidate.id, 'pixabay-music-4242');
  assert.equal(candidate.title, 'calm, ambient, cinematic');
  assert.equal(candidate.sourceUrl, musicHit.pageURL);
  assert.equal(candidate.downloadUrl, `${baseUrl}/download/sample.wav`);
  assert.equal(candidate.metadata.license, 'Pixabay Content License');
  assert.equal(candidate.metadata.author, 'Mock Composer');
  assert.equal(candidate.metadata.durationSeconds, 9);
  assert.match(requests[0], /\/api\/music\/\?/);
  assert.match(requests[0], new RegExp(`key=${apiKey}`));

  const emptyProvider = createPixabayMusicProvider({apiKey, baseUrl, fetchImpl: fetch, searchPath: '/api/music/empty/'});
  assert.deepEqual(await emptyProvider.search({kind: 'audio', query: 'nothing', sceneId: 'S01-opening'}), []);

  const unauthorized = createPixabayMusicProvider({apiKey, baseUrl, fetchImpl: fetch, searchPath: '/api/music/unauthorized/'});
  await errorCode(unauthorized.search({kind: 'audio', query: 'calm', sceneId: 'S01-opening'}), 'auth');

  const rateLimited = createPixabayMusicProvider({apiKey, baseUrl, fetchImpl: fetch, searchPath: '/api/music/rate-limited/'});
  await errorCode(rateLimited.search({kind: 'audio', query: 'calm', sceneId: 'S01-opening'}), 'rate-limit');
};

const runDownloadChecks = async (baseUrl: string): Promise<void> => {
  const provider = createPixabayMusicProvider({apiKey, baseUrl, fetchImpl: fetch});
  const [candidate] = await provider.search({kind: 'audio', query: 'calm', sceneId: 'S01-opening'});
  const destination = path.join(root, 'output', 'pixabay-verify', 'nested', 'sample.wav');
  await rm(path.dirname(destination), {recursive: true, force: true});
  await provider.download(candidate, destination);
  assert.deepEqual(await readFile(destination), await readFile(fixture), 'downloaded audio must match fixture bytes');

  const failing = createPixabayMusicProvider({apiKey, baseUrl, fetchImpl: fetch, searchPath: '/api/music/download-fail/'});
  const [broken] = await failing.search({kind: 'audio', query: 'calm', sceneId: 'S01-opening'});
  const brokenDestination = path.join(root, 'output', 'pixabay-verify', 'broken.wav');
  await errorCode(failing.download(broken, brokenDestination), 'download-failed');
  await assert.rejects(stat(brokenDestination), 'failed download must not leave a destination file');
  await rm(path.dirname(destination), {recursive: true, force: true});
};

const runCli = (args: string[], env: NodeJS.ProcessEnv): Promise<{code: number | null; output: string}> => {
  return new Promise((resolve, reject) => {
    const child = spawn(path.join(root, 'node_modules', '.bin', 'tsx'), [path.join(root, 'scripts', 'motion-forge.ts'), ...args], {
      cwd: root,
      env,
    });
    let output = '';
    child.stdout.on('data', (chunk) => { output += String(chunk); });
    child.stderr.on('data', (chunk) => { output += String(chunk); });
    child.once('error', reject);
    child.once('exit', (code) => resolve({code, output}));
  });
};

const runCliChecks = async (baseUrl: string, requests: string[]): Promise<void> => {
  const projectId = 'pixabay-verify';
  const projectDirectory = path.join(root, 'output', 'projects', projectId);
  const publicDirectory = path.join(root, 'public', 'assets', projectId);
  await rm(projectDirectory, {recursive: true, force: true});
  await rm(publicDirectory, {recursive: true, force: true});
  await mkdir(projectDirectory, {recursive: true});
  const film = JSON.parse(JSON.stringify(sampleFilm)) as typeof sampleFilm;
  film.id = projectId;
  film.audio = {};
  film.assets = [];
  await writeFile(path.join(projectDirectory, 'film.json'), `${JSON.stringify(film, null, 2)}\n`);
  await writeFile(path.join(projectDirectory, 'assets.json'), `${JSON.stringify({assets: []}, null, 2)}\n`);
  await writeFile(path.join(projectDirectory, 'project.json'), `${JSON.stringify({status: 'design-review', notes: []}, null, 2)}\n`);

  const configuredEnv: NodeJS.ProcessEnv = {
    ...process.env,
    PIXABAY_API_KEY: apiKey,
    PIXABAY_MUSIC_ENABLED: 'true',
    PIXABAY_API_BASE_URL: baseUrl,
  };
  const success = await runCli(['bgm', '--project', projectId, '--query', 'calm', '--volume', '0.35', '--loop'], configuredEnv);
  assert.equal(success.code, 0, success.output);
  const updated = JSON.parse(await readFile(path.join(projectDirectory, 'film.json'), 'utf8')) as typeof sampleFilm;
  assert.equal(updated.audio.bgm?.src, `assets/${projectId}/bgm-4242.wav`);
  assert.equal(updated.audio.bgm?.volume, 0.35);
  assert.equal(updated.audio.bgm?.loop, true);
  const asset = updated.assets.find((item) => item.id === 'bgm-4242');
  assert.ok(asset, 'BGM asset must be registered');
  assert.equal(asset.path, updated.audio.bgm?.src);
  assert.equal(asset.source, musicHit.pageURL);
  assert.equal(asset.metadata.license, 'Pixabay Content License');
  assert.deepEqual(await readFile(path.join(root, 'public', updated.audio.bgm!.src)), await readFile(fixture));
  const storedState = JSON.parse(await readFile(path.join(projectDirectory, 'project.json'), 'utf8')) as {status: string};
  assert.equal(storedState.status, 'design-review');

  const before = requests.length;
  const withoutKey = {...configuredEnv};
  delete withoutKey.PIXABAY_API_KEY;
  const failure = await runCli(['bgm', '--project', projectId, '--query', 'calm'], withoutKey);
  assert.equal(failure.code, 1, failure.output);
  assert.match(failure.output, /PIXABAY_API_KEY/);
  assert.equal(requests.length, before, 'missing key must not issue any HTTP request');

  await rm(projectDirectory, {recursive: true, force: true});
  await rm(publicDirectory, {recursive: true, force: true});
};

const main = async (): Promise<void> => {
  const portFlag = process.argv.indexOf('--port');
  const port = portFlag >= 0 ? Number(process.argv[portFlag + 1]) : 0;
  if (portFlag >= 0 && (!Number.isInteger(port) || port <= 0 || port > 65535)) throw new Error('--port requires a valid port');
  const server = await startServer(handlers(), port);
  if (process.argv.includes('--serve')) {
    console.log(`Pixabay Music mock server: ${server.baseUrl}`);
    await new Promise<void>(() => undefined);
    return;
  }
  try {
    await runSearchChecks(server.baseUrl, server.requests);
    console.log('Pixabay Music provider search checks passed');
    await runDownloadChecks(server.baseUrl);
    console.log('Pixabay Music provider download checks passed');
    await runCliChecks(server.baseUrl, server.requests);
    console.log('Pixabay Music CLI attach checks passed');
  } finally {
    await server.close();
  }
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
