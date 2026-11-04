import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp, readFile, rm, stat, symlink} from 'node:fs/promises';
import {createServer, type IncomingMessage, type ServerResponse} from 'node:http';
import type {AddressInfo} from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createPexelsResourceProvider, type PexelsError} from '../providers/pexels';

const fixtureKey = ['test', 'key'].join('-');
const templateRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tsxBinary = path.join(templateRoot, 'node_modules', '.bin', 'tsx');
const cases: Array<[string, () => Promise<void>]> = [];

const test = (name: string, run: () => Promise<void>): void => {
  cases.push([name, run]);
};

const expectPexelsError = async (
  run: () => Promise<unknown>,
  code: PexelsError['code'],
): Promise<PexelsError> => {
  try {
    await run();
  } catch (error) {
    const pexelsError = error as PexelsError;
    assert.equal(pexelsError.code, code, `expected ${code}, got ${pexelsError.code}: ${pexelsError.message}`);
    return pexelsError;
  }
  throw new Error(`Expected PexelsError ${code}`);
};

const withServer = async (
  handler: (req: IncomingMessage, res: ServerResponse) => void,
  run: (origin: string) => Promise<void>,
): Promise<void> => {
  const server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const {port} = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
};

const sendJson = (res: ServerResponse, status: number, value: unknown): void => {
  const body = JSON.stringify(value);
  res.writeHead(status, {'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body)});
  res.end(body);
};

const runCommand = (
  args: string[],
  cwd: string,
  env: Record<string, string> = {},
): Promise<{code: number | null; stdout: string; stderr: string}> => new Promise((resolve, reject) => {
  const child = spawn(tsxBinary, args, {cwd, env: {...process.env, ...env}});
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8').on('data', (chunk: string) => {
    stdout += chunk;
  });
  child.stderr.setEncoding('utf8').on('data', (chunk: string) => {
    stderr += chunk;
  });
  child.once('error', reject);
  child.once('close', (code) => resolve({code, stdout, stderr}));
});

const photoFixture = (origin: string) => ({
  page: 1,
  per_page: 2,
  total_results: 1,
  photos: [{
    id: 101,
    width: 1920,
    height: 1080,
    url: 'https://www.pexels.com/photo/ocean-101/',
    photographer: 'Ada',
    photographer_url: 'https://www.pexels.com/@ada',
    avg_color: '#123456',
    alt: 'Ocean at dawn',
    src: {
      original: `${origin}/files/101.jpeg`,
      large2x: `${origin}/files/101-large.jpeg`,
      medium: `${origin}/preview/101.jpeg`,
      small: `${origin}/preview/101-small.jpeg`,
    },
  }],
});

test('missing PEXELS_API_KEY fails before any network request', async () => {
  let requests = 0;
  await expectPexelsError(
    async () => createPexelsResourceProvider({
      apiKey: '',
      fetchImpl: async () => {
        requests += 1;
        return new Response('{}');
      },
    }),
    'unconfigured',
  );
  assert.equal(requests, 0);
});

test('search maps Pexels photos to resource candidates and keeps attribution', async () => {
  await withServer((req, res) => {
    const origin = `http://${req.headers.host}`;
    const url = new URL(req.url ?? '/', origin);
    assert.equal(url.pathname, '/v1/search');
    assert.equal(url.searchParams.get('query'), 'ocean');
    assert.equal(url.searchParams.get('per_page'), '2');
    assert.equal(url.searchParams.get('orientation'), 'landscape');
    assert.equal(req.headers.authorization, fixtureKey);
    sendJson(res, 200, {
      page: 1,
      per_page: 2,
      total_results: 1,
      photos: [{
        id: 101,
        width: 1920,
        height: 1080,
        url: 'https://www.pexels.com/photo/ocean-101/',
        photographer: 'Ada',
        photographer_url: 'https://www.pexels.com/@ada',
        avg_color: '#123456',
        alt: 'Ocean at dawn',
        src: {
          original: `${origin}/files/101.jpeg`,
          large2x: `${origin}/files/101-large.jpeg`,
          medium: `${origin}/preview/101.jpeg`,
          small: `${origin}/preview/101-small.jpeg`,
        },
      }],
    });
  }, async (origin) => {
    const provider = createPexelsResourceProvider({apiKey: fixtureKey, baseUrl: origin});
    const candidates = await provider.search({
      kind: 'image',
      query: 'ocean',
      sceneId: 'S01',
      aspect: '16:9',
      count: 2,
    });
    assert.equal(candidates.length, 1);
    const [candidate] = candidates;
    assert.equal(candidate.id, '101');
    assert.equal(candidate.kind, 'image');
    assert.equal(candidate.provider, 'pexels');
    assert.equal(candidate.title, 'Ocean at dawn');
    assert.equal(candidate.previewUrl, `${origin}/preview/101.jpeg`);
    assert.equal(candidate.downloadUrl, `${origin}/files/101.jpeg`);
    assert.equal(candidate.sourceUrl, 'https://www.pexels.com/photo/ocean-101/');
    assert.equal(candidate.metadata.photographer, 'Ada');
    assert.equal(candidate.metadata.photographerUrl, 'https://www.pexels.com/@ada');
    assert.equal(candidate.metadata.width, 1920);
    assert.equal(candidate.metadata.height, 1080);
    assert.equal(candidate.metadata.avgColor, '#123456');
    assert.equal(candidate.metadata.license, 'Pexels License');
    assert.equal(candidate.metadata.licenseUrl, 'https://www.pexels.com/license/');
  });
});

test('empty search result is reported explicitly', async () => {
  await withServer((_req, res) => {
    sendJson(res, 200, {page: 1, per_page: 15, total_results: 0, photos: []});
  }, async (origin) => {
    const provider = createPexelsResourceProvider({apiKey: fixtureKey, baseUrl: origin});
    const error = await expectPexelsError(
      () => provider.search({kind: 'image', query: 'no-such-visual', sceneId: 'S01'}),
      'no-results',
    );
    assert.match(error.message, /no-such-visual/);
  });
});

test('401 is reported as an authentication failure without leaking the key', async () => {
  await withServer((_req, res) => {
    sendJson(res, 401, {error: 'Unauthorized'});
  }, async (origin) => {
    const provider = createPexelsResourceProvider({apiKey: fixtureKey, baseUrl: origin});
    const error = await expectPexelsError(
      () => provider.search({kind: 'image', query: 'ocean', sceneId: 'S01'}),
      'auth',
    );
    assert.equal(error.status, 401);
    assert.match(error.message, /PEXELS_API_KEY/);
    assert.doesNotMatch(error.message, new RegExp(fixtureKey));
  });
});

test('429 is reported as rate limiting with Retry-After', async () => {
  await withServer((_req, res) => {
    res.writeHead(429, {'Content-Type': 'application/json', 'Retry-After': '7'});
    res.end(JSON.stringify({error: 'Too many requests'}));
  }, async (origin) => {
    const provider = createPexelsResourceProvider({apiKey: fixtureKey, baseUrl: origin});
    const error = await expectPexelsError(
      () => provider.search({kind: 'image', query: 'ocean', sceneId: 'S01'}),
      'rate-limit',
    );
    assert.equal(error.status, 429);
    assert.equal(error.retryAfterSeconds, 7);
    assert.match(error.message, /rate limit/i);
  });
});

test('download writes image bytes to the requested local destination', async () => {
  const body = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x10, 0x20, 0x30]);
  const workspace = await mkdtemp(path.join(os.tmpdir(), 'pexels-download-'));
  try {
    await withServer((req, res) => {
      assert.equal(req.url, '/files/101.jpeg');
      assert.equal(req.headers.authorization, undefined);
      res.writeHead(200, {'Content-Type': 'image/jpeg', 'Content-Length': body.length});
      res.end(body);
    }, async (origin) => {
      const provider = createPexelsResourceProvider({apiKey: fixtureKey, baseUrl: origin});
      const destination = path.join(workspace, 'public', 'assets', 'demo', 'image-101.jpeg');
      await provider.download({
        id: '101',
        kind: 'image',
        title: 'Ocean',
        previewUrl: `${origin}/preview/101.jpeg`,
        downloadUrl: `${origin}/files/101.jpeg`,
        sourceUrl: 'https://www.pexels.com/photo/ocean-101/',
        provider: 'pexels',
        metadata: {},
      }, destination);
      assert.deepEqual(await readFile(destination), body);
    });
  } finally {
    await rm(workspace, {recursive: true, force: true});
  }
});

test('download failure is reported without writing a placeholder', async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), 'pexels-download-'));
  try {
    await withServer((_req, res) => {
      sendJson(res, 500, {error: 'CDN failed'});
    }, async (origin) => {
      const provider = createPexelsResourceProvider({apiKey: fixtureKey, baseUrl: origin});
      const destination = path.join(workspace, 'public', 'assets', 'demo', 'image-101.jpeg');
      const error = await expectPexelsError(
        () => provider.download({
          id: '101',
          kind: 'image',
          title: 'Ocean',
          previewUrl: `${origin}/preview/101.jpeg`,
          downloadUrl: `${origin}/files/101.jpeg`,
          sourceUrl: 'https://www.pexels.com/photo/ocean-101/',
          provider: 'pexels',
          metadata: {},
        }, destination),
        'download',
      );
      assert.equal(error.status, 500);
      await assert.rejects(readFile(destination));
    });
  } finally {
    await rm(workspace, {recursive: true, force: true});
  }
});

test('forge search-images and fetch-image localize a Pexels image in a standalone project', async () => {
  const imageBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0xaa, 0xbb, 0xcc]);
  const workspace = await mkdtemp(path.join(os.tmpdir(), 'pexels-cli-'));
  const projectDirectory = path.join(workspace, 'project');
  try {
    const created = await runCommand([
      path.join(templateRoot, 'scripts', 'motion-forge.ts'),
      'create', '--dir', projectDirectory, '--input', '海洋', '--name', 'demo', '--title', 'Demo',
    ], templateRoot);
    assert.equal(created.code, 0, created.stderr);
    // 生成的检查用工程不在本测试里跑 npm ci，借用模板依赖以避免网络安装。
    await symlink(path.join(templateRoot, 'node_modules'), path.join(projectDirectory, 'node_modules'), 'dir');
    const projectScript = path.join(projectDirectory, 'scripts', 'motion-forge.ts');

    await withServer((req, res) => {
      const origin = `http://${req.headers.host}`;
      if (req.url?.startsWith('/v1/search')) {
        const url = new URL(req.url, origin);
        if (url.searchParams.get('query') === 'auth-failure') {
          sendJson(res, 401, {error: 'Unauthorized'});
          return;
        }
        sendJson(res, 200, photoFixture(origin));
        return;
      }
      if (req.url === '/files/101.jpeg') {
        res.writeHead(200, {'Content-Type': 'image/jpeg', 'Content-Length': imageBytes.length});
        res.end(imageBytes);
        return;
      }
      sendJson(res, 404, {error: 'not found'});
    }, async (origin) => {
      const env = {PEXELS_API_KEY: fixtureKey, PEXELS_BASE_URL: origin};
      const approved = await runCommand([projectScript, 'approve-design', '--project', 'demo'], projectDirectory, env);
      assert.equal(approved.code, 0, approved.stderr);

      const searched = await runCommand([
        projectScript, 'search-images', '--project', 'demo', '--query', 'ocean', '--count', '2', '--aspect', '16:9',
      ], projectDirectory, env);
      assert.equal(searched.code, 0, searched.stderr);
      assert.match(searched.stdout, /Ocean at dawn/);

      const searchFile = JSON.parse(
        await readFile(path.join(projectDirectory, 'output', 'projects', 'demo', 'image-search.json'), 'utf8'),
      ) as {
        query: string;
        provider: string;
        candidates: Array<{id: string; title: string; sourceUrl: string; metadata: Record<string, unknown>}>;
      };
      assert.equal(searchFile.provider, 'pexels');
      assert.equal(searchFile.query, 'ocean');
      assert.equal(searchFile.candidates.length, 1);
      assert.equal(searchFile.candidates[0].id, '101');
      assert.equal(searchFile.candidates[0].sourceUrl, 'https://www.pexels.com/photo/ocean-101/');
      assert.equal(searchFile.candidates[0].metadata.license, 'Pexels License');

      const fetched = await runCommand([
        projectScript, 'fetch-image', '--project', 'demo', '--candidate', '101', '--scene', 'S01-opening',
      ], projectDirectory, env);
      assert.equal(fetched.code, 0, fetched.stderr);

      const film = JSON.parse(
        await readFile(path.join(projectDirectory, 'output', 'projects', 'demo', 'film.json'), 'utf8'),
      ) as {
        assets: Array<{id: string; path: string; source?: string; metadata: Record<string, unknown>}>;
        scenes: Array<{id: string; assetIds: string[]}>;
      };
      assert.equal(film.assets.length, 1);
      const [asset] = film.assets;
      assert.equal(asset.id, 'pexels-101');
      assert.equal(asset.path, 'assets/demo/pexels-101.jpeg');
      assert.equal(asset.source, 'https://www.pexels.com/photo/ocean-101/');
      assert.equal(asset.metadata.license, 'Pexels License');
      assert.equal(asset.metadata.licenseUrl, 'https://www.pexels.com/license/');
      assert.equal(asset.metadata.photographer, 'Ada');
      assert.equal(asset.metadata.title, 'Ocean at dawn');
      const opening = film.scenes.find((scene) => scene.id === 'S01-opening');
      assert.ok(opening?.assetIds.includes(asset.id));

      const assetsJson = JSON.parse(
        await readFile(path.join(projectDirectory, 'output', 'projects', 'demo', 'assets.json'), 'utf8'),
      ) as {assets: unknown[]};
      assert.deepEqual(assetsJson.assets, film.assets);

      const localFile = path.join(projectDirectory, 'public', 'assets', 'demo', 'pexels-101.jpeg');
      assert.deepEqual(await readFile(localFile), imageBytes);
      assert.ok((await stat(localFile)).isFile());

      const state = JSON.parse(
        await readFile(path.join(projectDirectory, 'output', 'projects', 'demo', 'project.json'), 'utf8'),
      ) as {status: string; notes: string[]};
      assert.equal(state.status, 'design-review');
      assert.ok(state.notes.some((note) => note.includes('Pexels')));

      const validated = await runCommand(
        [path.join(projectDirectory, 'scripts', 'validate-project.ts'), '--project', 'demo'],
        projectDirectory,
        env,
      );
      assert.equal(validated.code, 0, validated.stderr);

      const noKey = await runCommand([
        projectScript, 'search-images', '--project', 'demo', '--query', 'ocean',
      ], projectDirectory, {PEXELS_API_KEY: '', PEXELS_BASE_URL: origin});
      assert.notEqual(noKey.code, 0);
      assert.match(noKey.stderr, /PEXELS_API_KEY/);

      const unauthorized = await runCommand([
        projectScript, 'search-images', '--project', 'demo', '--query', 'auth-failure',
      ], projectDirectory, env);
      assert.notEqual(unauthorized.code, 0);
      assert.match(unauthorized.stderr, /authentication/i);
      assert.doesNotMatch(unauthorized.stderr, new RegExp(fixtureKey));
    });
  } finally {
    await rm(workspace, {recursive: true, force: true});
  }
});

for (const [name, run] of cases) {
  await run();
  console.log(`ok - ${name}`);
}
console.log(`Pexels provider checks passed: ${cases.length}`);
