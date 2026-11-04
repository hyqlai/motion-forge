import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {access, readFile, rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createFishAudioTTSProvider, FISH_AUDIO_PROVIDER_ID} from '../providers/fish-audio';
import {TTSProviderError} from '../providers/tts';

type RecordedRequest = {
  method: string;
  url: string;
  headers: NodeJS.Dict<string | string[]>;
  body: string;
};

type MockReply = {
  status?: number;
  headers?: Record<string, string>;
  body?: Buffer | string;
};

type Handler = (request: RecordedRequest, index: number) => MockReply | Promise<MockReply>;

const withMockServer = async (
  handler: Handler,
  run: (baseUrl: string, requests: RecordedRequest[]) => Promise<void>,
): Promise<void> => {
  const requests: RecordedRequest[] = [];
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', async () => {
      const recorded: RecordedRequest = {
        method: request.method ?? '',
        url: request.url ?? '',
        headers: request.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      };
      requests.push(recorded);
      try {
        const reply = await handler(recorded, requests.length - 1);
        response.writeHead(reply.status ?? 200, reply.headers ?? {});
        response.end(reply.body ?? '');
      } catch (error) {
        response.writeHead(500, {'content-type': 'text/plain'});
        response.end(error instanceof Error ? error.message : String(error));
      }
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Mock server did not expose a port');
  try {
    await run(`http://127.0.0.1:${address.port}`, requests);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
};

const fixtureApiKey = 'fixture-key';
const withApiKey = async (run: () => Promise<void>): Promise<void> => {
  const previous = process.env.FISH_API_KEY;
  process.env.FISH_API_KEY = fixtureApiKey;
  try {
    await run();
  } finally {
    if (previous === undefined) delete process.env.FISH_API_KEY;
    else process.env.FISH_API_KEY = previous;
  }
};

const audioBytes = Buffer.from('ID3-fake-mp3-audio');

await withApiKey(() => withMockServer(
  (request) => {
    assert.equal(request.method, 'POST');
    assert.equal(request.url, '/v1/tts');
    assert.equal(request.headers.authorization, `Bearer ${fixtureApiKey}`);
    assert.equal(request.headers.model, 's2.1-pro');
    assert.deepEqual(JSON.parse(request.body), {
      text: '你好，世界',
      reference_id: 'voice-1',
      format: 'mp3',
    });
    return {
      status: 200,
      headers: {'content-type': 'audio/mpeg'},
      body: audioBytes,
    };
  },
  async (baseUrl, requests) => {
    const provider = createFishAudioTTSProvider({baseUrl, maxAttempts: 1});
    const result = await provider.synthesize({
      text: '你好，世界',
      voice: 'voice-1',
      format: 'mp3',
    });
    assert.equal(provider.id, FISH_AUDIO_PROVIDER_ID);
    assert.equal(result.format, 'mp3');
    assert.equal(result.model, 's2.1-pro');
    assert.deepEqual(result.audio, audioBytes);
    assert.equal(requests.length, 1);
  },
));

const withoutApiKey = async (run: () => Promise<void>): Promise<void> => {
  const previous = process.env.FISH_API_KEY;
  delete process.env.FISH_API_KEY;
  try {
    await run();
  } finally {
    if (previous !== undefined) process.env.FISH_API_KEY = previous;
  }
};

const expectTTSFailure = async (
  run: () => Promise<unknown>,
  expected: {code: string; retryable: boolean; status?: number},
): Promise<TTSProviderError> => {
  try {
    await run();
  } catch (error) {
    assert.ok(error instanceof TTSProviderError, `Expected TTSProviderError, received ${String(error)}`);
    assert.equal(error.code, expected.code);
    assert.equal(error.retryable, expected.retryable);
    if (expected.status !== undefined) assert.equal(error.status, expected.status);
    return error;
  }
  assert.fail('Expected the TTS call to fail');
};

await withoutApiKey(() => withMockServer(
  () => ({status: 200, body: audioBytes}),
  async (baseUrl, requests) => {
    const provider = createFishAudioTTSProvider({baseUrl, maxAttempts: 3});
    await expectTTSFailure(
      () => provider.synthesize({text: '缺少密钥'}),
      {code: 'auth', retryable: false},
    );
    assert.equal(requests.length, 0);
  },
));

await withApiKey(() => withMockServer(
  () => ({
    status: 401,
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({message: 'invalid token'}),
  }),
  async (baseUrl, requests) => {
    const provider = createFishAudioTTSProvider({baseUrl, maxAttempts: 3});
    await expectTTSFailure(
      () => provider.synthesize({text: '认证失败'}),
      {code: 'auth', retryable: false, status: 401},
    );
    assert.equal(requests.length, 1);
  },
));

await withApiKey(() => withMockServer(
  () => ({
    status: 402,
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({message: 'insufficient balance'}),
  }),
  async (baseUrl, requests) => {
    const provider = createFishAudioTTSProvider({baseUrl, maxAttempts: 3});
    await expectTTSFailure(
      () => provider.synthesize({text: '余额不足'}),
      {code: 'quota', retryable: false, status: 402},
    );
    assert.equal(requests.length, 1);
  },
));

await withApiKey(() => withMockServer(
  (_request, index): MockReply => index === 0
    ? {
        status: 429,
        headers: {'content-type': 'application/json', 'retry-after': '0'},
        body: JSON.stringify({message: 'rate limit exceeded'}),
      }
    : {status: 200, headers: {'content-type': 'audio/mpeg'}, body: audioBytes},
  async (baseUrl, requests) => {
    const provider = createFishAudioTTSProvider({
      baseUrl,
      maxAttempts: 3,
      retryBaseDelayMs: 1,
      retryMaxDelayMs: 5,
    });
    const result = await provider.synthesize({text: '限流后重试成功'});
    assert.deepEqual(result.audio, audioBytes);
    assert.equal(requests.length, 2);
  },
));

await withApiKey(() => withMockServer(
  () => ({
    status: 503,
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({message: 'service unavailable'}),
  }),
  async (baseUrl, requests) => {
    const provider = createFishAudioTTSProvider({
      baseUrl,
      maxAttempts: 3,
      retryBaseDelayMs: 1,
      retryMaxDelayMs: 5,
    });
    await expectTTSFailure(
      () => provider.synthesize({text: '服务端持续错误'}),
      {code: 'server', retryable: true, status: 503},
    );
    assert.equal(requests.length, 3);
  },
));

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tsxBinary = path.join(projectRoot, 'node_modules', '.bin', 'tsx');

const runScript = async (
  script: string,
  args: string[],
  env: NodeJS.ProcessEnv,
): Promise<{code: number | null; stdout: string; stderr: string}> => {
  return new Promise((resolve, reject) => {
    const child = spawn(tsxBinary, [script, ...args], {
      cwd: projectRoot,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
    child.once('error', reject);
    child.once('close', (code) => resolve({code, stdout, stderr}));
  });
};

type FilmFixture = {
  assets: {id: string; kind: string; path: string; role: string; metadata: Record<string, unknown>}[];
  scenes: {id: string; assetIds: string[]}[];
};

const projectId = `tts-verify-${process.pid}-${Date.now().toString(36)}`;
const projectDirectory = path.join(projectRoot, 'output', 'projects', projectId);
const projectPublicDirectory = path.join(projectRoot, 'public', 'assets', projectId);

try {
  const init = await runScript(
    'scripts/motion-forge.ts',
    ['init', '--input', 'TTS 验证主题', '--name', projectId, '--title', 'TTS 验证', '--allow-template-example'],
    process.env,
  );
  assert.equal(init.code, 0, init.stderr || init.stdout);

  await withMockServer(
    (request) => {
      assert.equal(request.headers.authorization, `Bearer ${fixtureApiKey}`);
      return {status: 200, headers: {'content-type': 'audio/mpeg'}, body: audioBytes};
    },
    async (baseUrl, requests) => {
      const baseEnv: NodeJS.ProcessEnv = {...process.env, FISH_AUDIO_BASE_URL: baseUrl};
      delete baseEnv.FISH_API_KEY;
      const blocked = await runScript(
        'scripts/motion-forge.ts',
        ['tts', '--project', projectId, '--scene', 'S01-opening', '--text', '没有密钥不应调用'],
        baseEnv,
      );
      assert.equal(blocked.code, 1);
      assert.match(blocked.stderr, /FISH_API_KEY/);
      assert.equal(requests.length, 0);

      const generated = await runScript(
        'scripts/motion-forge.ts',
        ['tts', '--project', projectId, '--scene', 'S01-opening', '--text', '这是旁白验证', '--voice', 'voice-1'],
        {...baseEnv, FISH_API_KEY: fixtureApiKey},
      );
      assert.equal(generated.code, 0, generated.stderr || generated.stdout);
      assert.equal(requests.length, 1);
    },
  );

  const audioPath = path.join(projectPublicDirectory, 'voice-S01-opening.mp3');
  assert.deepEqual(await readFile(audioPath), audioBytes);
  const film = JSON.parse(await readFile(path.join(projectDirectory, 'film.json'), 'utf8')) as FilmFixture;
  const asset = film.assets.find((item) => item.id === 'voice-S01-opening');
  assert.ok(asset, 'Voice asset was not registered');
  assert.equal(asset.kind, 'voice');
  assert.equal(asset.role, 'narration');
  assert.equal(asset.path, `assets/${projectId}/voice-S01-opening.mp3`);
  assert.equal(asset.metadata.provider, FISH_AUDIO_PROVIDER_ID);
  assert.ok(film.scenes.find((scene) => scene.id === 'S01-opening')?.assetIds.includes('voice-S01-opening'));
  const assetsFile = JSON.parse(await readFile(path.join(projectDirectory, 'assets.json'), 'utf8')) as {assets: FilmFixture['assets']};
  assert.ok(assetsFile.assets.some((item) => item.id === 'voice-S01-opening'));

  const validation = await runScript(
    'scripts/validate-project.ts',
    ['--project', projectId],
    process.env,
  );
  assert.equal(validation.code, 0, validation.stderr || validation.stdout);
  await access(audioPath);
} finally {
  await rm(projectDirectory, {recursive: true, force: true});
  await rm(projectPublicDirectory, {recursive: true, force: true});
}

console.log('TTS provider verification passed');
