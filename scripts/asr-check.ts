import {execFile} from 'node:child_process';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {createServer, type IncomingMessage, type Server, type ServerResponse} from 'node:http';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {groupTranscriptSegments, parseLyricsAnalysis} from '../core/lyrics';
import {filmSchema, productionStateSchema} from '../core/schema';
import {compileTimeline} from '../core/timeline';
import {ASRProviderError, getASRProvider, registerASRProvider} from '../providers/asr';
import {createDraft} from '../providers/draft';
import {createFishAudioASR} from '../providers/fish-audio-asr';
import {validateFilm} from './film-validation';

const execFileAsync = promisify(execFile);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

type RawSegment = {text: string; start: number; end: number};
type RawTranscription = {text: string; duration: number; segments: RawSegment[]};
type Scenario = 'ok' | 'auth' | 'quota' | 'rate' | 'server' | 'badjson' | 'missing-segments' | 'invalid-timestamps' | 'missing-duration';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

const readFixture = async (): Promise<RawTranscription> => {
  return JSON.parse(await readFile(path.join(root, 'scripts', 'fixtures', 'asr-word-segments.json'), 'utf8')) as RawTranscription;
};

const checkGrouping = async (): Promise<void> => {
  const fixture = await readFixture();
  const segments = fixture.segments.map((segment) => ({
    text: segment.text,
    startSeconds: segment.start,
    endSeconds: segment.end,
  }));
  const lines = groupTranscriptSegments(segments);
  assert(lines.length === 3, `expected 3 lyric lines, received ${lines.length}`);
  assert(lines[0].text === '月光落在窗前', `unexpected first line: ${lines[0].text}`);
  assert(lines[0].startSeconds === 0 && lines[0].endSeconds === 1.4, 'first line timing mismatch');
  assert(lines[1].text === '我听见风在唱', `unexpected second line: ${lines[1].text}`);
  assert(lines[1].startSeconds === 2.2 && lines[1].endSeconds === 3.5, 'second line timing mismatch');
  assert(lines[2].text === '夜色慢慢走远', `unexpected third line: ${lines[2].text}`);
  assert(lines[2].startSeconds === 4 && lines[2].endSeconds === 5.6, 'third line timing mismatch');

  const punctuation = groupTranscriptSegments([
    {text: '第一句。', startSeconds: 0, endSeconds: 0.8},
    {text: '第二句', startSeconds: 0.8, endSeconds: 1.4},
  ]);
  assert(punctuation.length === 2, 'text boundary punctuation did not split lyrics');

  const durationBound = groupTranscriptSegments([
    {text: '一句', startSeconds: 0, endSeconds: 1.5},
    {text: '接着', startSeconds: 1.5, endSeconds: 3.1},
  ], {maxLineSeconds: 2});
  assert(durationBound.length === 2, 'maximum line duration did not split lyrics');

  const textBound = groupTranscriptSegments([
    {text: '一二三四', startSeconds: 0, endSeconds: 0.8},
    {text: '五六七八', startSeconds: 0.8, endSeconds: 1.6},
  ], {maxLineChars: 5});
  assert(textBound.length === 2, 'maximum line length did not split lyrics');

  let unorderedRejected = false;
  try {
    groupTranscriptSegments([
      {text: '后', startSeconds: 2, endSeconds: 2.5},
      {text: '前', startSeconds: 0, endSeconds: 0.5},
    ]);
  } catch {
    unorderedRejected = true;
  }
  assert(unorderedRejected, 'unordered segments must be rejected explicitly');
};

type MockRequest = {
  scenario: string;
  authorization: string | undefined;
  body: string;
};

const createMockServer = async (fixture: RawTranscription): Promise<{
  server: Server;
  baseUrl: string;
  requests: MockRequest[];
  requestCount: (scenario: Scenario) => number;
}> => {
  const requests: MockRequest[] = [];
  const counts = new Map<string, number>();
  const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks).toString('utf8');
    const scenario = (request.url ?? '/').split('/')[1] ?? '';
    requests.push({scenario, authorization: request.headers.authorization, body});
    const count = (counts.get(scenario) ?? 0) + 1;
    counts.set(scenario, count);

    const send = (status: number, payload: unknown, headers: Record<string, string> = {}): void => {
      response.writeHead(status, {'content-type': 'application/json', ...headers});
      response.end(typeof payload === 'string' ? payload : JSON.stringify(payload));
    };

    switch (scenario) {
      case 'ok':
        send(200, fixture);
        break;
      case 'auth':
        send(401, {message: 'invalid api key'});
        break;
      case 'quota':
        send(402, {message: 'insufficient balance'});
        break;
      case 'rate':
        if (count === 1) send(429, {message: 'too many requests'}, {'retry-after': '0'});
        else send(200, fixture);
        break;
      case 'server':
        send(500, {message: 'internal error'});
        break;
      case 'badjson':
        send(200, 'not json');
        break;
      case 'missing-segments':
        send(200, {text: fixture.text, duration: fixture.duration});
        break;
      case 'invalid-timestamps':
        send(200, {
          text: fixture.text,
          duration: fixture.duration,
          segments: [{text: '缺时间', start: 0}],
        });
        break;
      case 'missing-duration':
        send(200, {text: fixture.text, segments: fixture.segments});
        break;
      default:
        send(404, {message: 'unknown scenario'});
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Mock server did not bind to a TCP port');
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
    requests,
    requestCount: (scenario) => counts.get(scenario) ?? 0,
  };
};

const expectCode = async (
  action: () => Promise<unknown>,
  code: ASRProviderError['code'],
  label: string,
): Promise<ASRProviderError> => {
  try {
    await action();
  } catch (error) {
    assert(error instanceof ASRProviderError, `${label} did not throw ASRProviderError`);
    const providerError = error as ASRProviderError;
    assert(providerError.code === code, `${label} expected ${code}, received ${providerError.code}`);
    return providerError;
  }
  throw new Error(`Assertion failed: ${label} was expected to fail`);
};

const checkFishAudioProvider = async (fixture: RawTranscription, audioFile: string): Promise<void> => {
  const mock = await createMockServer(fixture);
  const authKey = ['local', 'mock', 'token'].join('-');
  const savedKey = process.env.FISH_API_KEY;
  process.env.FISH_API_KEY = authKey;
  try {
    const provider = createFishAudioASR({baseUrl: `${mock.baseUrl}/ok`, retryDelayMs: 0});
    const result = await provider.transcribe(audioFile, {language: 'zh'});
    assert(result.provider === 'fish-audio', 'provider id mismatch');
    assert(result.model === 'transcribe-1-pro', 'default model mismatch');
    assert(result.text === fixture.text, 'transcription text mismatch');
    assert(result.durationSeconds === 9, `duration normalization mismatch: ${result.durationSeconds}`);
    assert(result.segments.length === fixture.segments.length, 'segment count mismatch');
    assert(result.segments[0].startSeconds === 0 && result.segments[0].endSeconds === 0.45, 'word timestamp mismatch');
    const okRequest = mock.requests.find((request) => request.scenario === 'ok');
    assert(okRequest, 'mock server did not receive the transcription request');
    assert(okRequest.authorization === `Bearer ${authKey}`, 'authorization header mismatch');
    assert(okRequest.body.includes('name="ignore_timestamps"'), 'ignore_timestamps field missing');
    assert(okRequest.body.includes('name="model"') && okRequest.body.includes('transcribe-1-pro'), 'model field missing');
    assert(okRequest.body.includes('name="language"') && okRequest.body.includes('zh'), 'language field missing');
    assert(okRequest.body.includes('filename="audio.wav"'), 'audio upload filename missing');

    delete process.env.FISH_API_KEY;
    const missingKey = await expectCode(
      () => provider.transcribe(audioFile),
      'missing-key',
      'missing FISH_API_KEY',
    );
    assert(missingKey.message.includes('FISH_API_KEY'), 'missing key error should name FISH_API_KEY');
    process.env.FISH_API_KEY = authKey;
    assert(mock.requestCount('ok') === 1, 'missing key must not send an HTTP request');

    const auth = await expectCode(
      () => createFishAudioASR({baseUrl: `${mock.baseUrl}/auth`, retryDelayMs: 0}).transcribe(audioFile),
      'auth',
      '401 response',
    );
    assert(auth.status === 401, 'auth error should preserve HTTP status');
    assert(mock.requestCount('auth') === 1, '401 must not be retried');

    await expectCode(
      () => createFishAudioASR({baseUrl: `${mock.baseUrl}/quota`, retryDelayMs: 0}).transcribe(audioFile),
      'quota',
      '402 response',
    );
    assert(mock.requestCount('quota') === 1, '402 must not be retried');

    const rateResult = await createFishAudioASR({baseUrl: `${mock.baseUrl}/rate`, retryDelayMs: 0}).transcribe(audioFile);
    assert(rateResult.text === fixture.text, '429 retry did not recover');
    assert(mock.requestCount('rate') === 2, '429 should retry exactly once before success');

    await expectCode(
      () => createFishAudioASR({baseUrl: `${mock.baseUrl}/server`, retryDelayMs: 0}).transcribe(audioFile),
      'server',
      'persistent 5xx response',
    );
    assert(mock.requestCount('server') === 3, '5xx should use one initial request plus two retries');

    await expectCode(
      () => createFishAudioASR({baseUrl: `${mock.baseUrl}/badjson`, retryDelayMs: 0}).transcribe(audioFile),
      'bad-response',
      'malformed JSON response',
    );
    await expectCode(
      () => createFishAudioASR({baseUrl: `${mock.baseUrl}/missing-duration`, retryDelayMs: 0}).transcribe(audioFile),
      'bad-response',
      'missing duration response',
    );
    await expectCode(
      () => createFishAudioASR({baseUrl: `${mock.baseUrl}/missing-segments`, retryDelayMs: 0}).transcribe(audioFile),
      'missing-timestamps',
      'missing segments response',
    );
    await expectCode(
      () => createFishAudioASR({baseUrl: `${mock.baseUrl}/invalid-timestamps`, retryDelayMs: 0}).transcribe(audioFile),
      'invalid-timestamps',
      'invalid timestamp response',
    );
    await expectCode(
      () => createFishAudioASR({baseUrl: 'http://127.0.0.1:1', retryDelayMs: 0}).transcribe(audioFile),
      'network',
      'unreachable host',
    );

    const registered = createFishAudioASR({baseUrl: `${mock.baseUrl}/ok`, retryDelayMs: 0});
    registerASRProvider(registered);
    assert(getASRProvider('fish-audio') === registered, 'registry did not return provider by id');
    let duplicateRejected = false;
    try {
      registerASRProvider(registered);
    } catch {
      duplicateRejected = true;
    }
    assert(duplicateRejected, 'duplicate provider registration must be rejected');
    let unknownRejected = false;
    try {
      getASRProvider('missing-provider');
    } catch {
      unknownRejected = true;
    }
    assert(unknownRejected, 'unknown provider id must be rejected');
  } finally {
    if (savedKey === undefined) delete process.env.FISH_API_KEY;
    else process.env.FISH_API_KEY = savedKey;
    await new Promise<void>((resolve) => mock.server.close(() => resolve()));
  }
};

type CommandResult = {code: number; stdout: string; stderr: string};

const runTsx = async (script: string, args: string[], env: NodeJS.ProcessEnv): Promise<CommandResult> => {
  try {
    const result = await execFileAsync(
      path.join(root, 'node_modules', '.bin', 'tsx'),
      [script, ...args],
      {cwd: root, env, timeout: 120_000},
    );
    return {code: 0, stdout: String(result.stdout), stderr: String(result.stderr)};
  } catch (error) {
    const failure = error as {code?: number; stdout?: string; stderr?: string; message?: string};
    return {
      code: typeof failure.code === 'number' ? failure.code : 1,
      stdout: String(failure.stdout ?? ''),
      stderr: String(failure.stderr ?? failure.message ?? ''),
    };
  }
};

const runForge = (args: string[], env: NodeJS.ProcessEnv): Promise<CommandResult> => {
  return runTsx('scripts/motion-forge.ts', args, env);
};

const writeJson = async (file: string, value: unknown): Promise<void> => {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
};

const checkCli = async (fixture: RawTranscription): Promise<void> => {
  const projectId = `asr-check-${Date.now()}`;
  const projectRoot = path.join(root, 'output', 'projects', projectId);
  const assetRoot = path.join(root, 'public', 'assets', projectId);
  const mock = await createMockServer(fixture);
  const authKey = ['local', 'mock', 'token'].join('-');
  try {
    await mkdir(projectRoot, {recursive: true});
    await mkdir(assetRoot, {recursive: true});
    const audioFile = path.join(assetRoot, 'song.wav');
    await writeFile(audioFile, Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(64)]));

    const draft = createDraft(
      {kind: 'song', value: audioFile, values: [audioFile]},
      {title: 'ASR Check', durationSeconds: 9},
    ).film;
    draft.id = projectId;
    draft.assets = [{
      id: 'asset-1',
      kind: 'audio',
      path: `assets/${projectId}/song.wav`,
      role: 'song',
      metadata: {analysisStatus: 'pending'},
    }];
    draft.audio.bgm = {src: draft.assets[0].path, volume: 1, loop: false};

    await writeJson(path.join(projectRoot, 'film.json'), draft);
    await writeJson(path.join(projectRoot, 'assets.json'), {assets: draft.assets});
    await writeJson(path.join(projectRoot, 'input.json'), {
      kind: 'song',
      value: audioFile,
      values: [audioFile],
      clock: 'lyrics',
    });
    await writeJson(path.join(projectRoot, 'project.json'), {
      status: 'production',
      designApprovedAt: '2026-01-01T00:00:00.000Z',
      sampleApprovedAt: '2026-01-02T00:00:00.000Z',
      notes: [],
    });

    const baseEnv: NodeJS.ProcessEnv = {
      ...process.env,
      FISH_AUDIO_BASE_URL: `${mock.baseUrl}/ok`,
    };
    const missingKeyEnv = {...baseEnv};
    delete missingKeyEnv.FISH_API_KEY;
    const missingKey = await runForge(['transcribe', '--project', projectId], missingKeyEnv);
    assert(missingKey.code !== 0, 'transcribe without FISH_API_KEY should fail');
    assert(missingKey.stderr.includes('FISH_API_KEY'), `missing key error was not explicit: ${missingKey.stderr}`);
    let analysisMissing = false;
    try {
      await readFile(path.join(projectRoot, 'analysis', 'lyrics.json'), 'utf8');
    } catch {
      analysisMissing = true;
    }
    assert(analysisMissing, 'failed transcription must not write lyrics.json');

    const successEnv: NodeJS.ProcessEnv = {...baseEnv, FISH_API_KEY: authKey};
    const analysisRun = await runForge(['transcribe', '--project', projectId], successEnv);
    assert(analysisRun.code === 0, `transcribe failed: ${analysisRun.stderr}`);
    const analysis = JSON.parse(
      await readFile(path.join(projectRoot, 'analysis', 'lyrics.json'), 'utf8'),
    ) as {
      provider: string;
      model: string;
      transcription: {durationSeconds: number};
      lines: {index: number; text: string; startSeconds: number; endSeconds: number}[];
    };
    assert(analysis.provider === 'fish-audio', 'analysis provider mismatch');
    assert(analysis.model === 'transcribe-1-pro', 'analysis model mismatch');
    assert(analysis.transcription.durationSeconds === 9, 'analysis duration mismatch');
    assert(analysis.lines.length === 3, 'analysis line count mismatch');
    assert(analysis.lines[0].text === '月光落在窗前', 'analysis first line mismatch');
    assert(analysis.lines[2].endSeconds === 5.6, 'analysis last line timing mismatch');
    const tampered = structuredClone(analysis) as unknown as {lines: {text: string}[]};
    tampered.lines[0].text = '伪造歌词';
    let tamperedRejected = false;
    try {
      parseLyricsAnalysis(tampered);
    } catch {
      tamperedRejected = true;
    }
    assert(tamperedRejected, 'lyrics.json with fabricated lyric text must be rejected');

    const afterAnalysis = filmSchema.parse(
      JSON.parse(await readFile(path.join(projectRoot, 'film.json'), 'utf8')),
    );
    assert(afterAnalysis.scenes.length === draft.scenes.length, 'analysis-only run must not rewrite scenes');
    const stateAfterAnalysis = productionStateSchema.parse(
      JSON.parse(await readFile(path.join(projectRoot, 'project.json'), 'utf8')),
    );
    assert(stateAfterAnalysis.status === 'production', 'analysis-only run must not reset G1');

    const reuseEnv: NodeJS.ProcessEnv = {...baseEnv};
    delete reuseEnv.FISH_API_KEY;
    const draftRun = await runForge(['lyrics-draft', '--project', projectId], reuseEnv);
    assert(draftRun.code === 0, `lyrics-draft failed: ${draftRun.stderr}`);
    assert(mock.requestCount('ok') === 1, 'lyrics-draft must reuse lyrics.json without another ASR request');
    const updated = filmSchema.parse(
      JSON.parse(await readFile(path.join(projectRoot, 'film.json'), 'utf8')),
    );
    await validateFilm(updated, {publicRoot: path.join(root, 'public')});
    const lyricScenes = updated.scenes.filter((scene) => scene.props.lyric !== undefined);
    assert(lyricScenes.length === 3, `expected 3 lyric scenes, received ${lyricScenes.length}`);
    assert(lyricScenes[0].onScreenText[0] === '月光落在窗前', 'first lyric scene text mismatch');
    assert(lyricScenes[1].durationInFrames === 39, 'second lyric scene duration mismatch');
    assert(lyricScenes[2].durationInFrames === 48, 'third lyric scene duration mismatch');
    const timeline = compileTimeline(updated);
    assert(timeline.durationInFrames === 270, `draft timeline should match 9s at 30fps, received ${timeline.durationInFrames}`);
    const firstLyric = lyricScenes[0].props.lyric as {startSeconds: number; endSeconds: number};
    assert(firstLyric.startSeconds === 0 && firstLyric.endSeconds === 1.4, 'lyric scene time range mismatch');
    const stateAfterDraft = productionStateSchema.parse(
      JSON.parse(await readFile(path.join(projectRoot, 'project.json'), 'utf8')),
    );
    assert(stateAfterDraft.status === 'design-review', 'lyric draft must reset G1 to design-review');
    assert(!stateAfterDraft.designApprovedAt && !stateAfterDraft.sampleApprovedAt, 'lyric draft must clear old approvals');
    const assets = JSON.parse(await readFile(path.join(projectRoot, 'assets.json'), 'utf8')) as {
      assets: {metadata: {analysisStatus?: string; analysisPath?: string}}[];
    };
    assert(assets.assets[0].metadata.analysisStatus === 'ready', 'asset analysis status not updated');
    assert(assets.assets[0].metadata.analysisPath === 'analysis/lyrics.json', 'asset analysis path not recorded');
    const projectValidation = await runTsx(
      'scripts/validate-project.ts',
      ['--project', projectId],
      {...baseEnv, FISH_API_KEY: authKey},
    );
    assert(projectValidation.code === 0, `draft project failed validate: ${projectValidation.stderr}`);
  } finally {
    await new Promise<void>((resolve) => mock.server.close(() => resolve()));
    await rm(projectRoot, {recursive: true, force: true});
    await rm(assetRoot, {recursive: true, force: true});
  }
};

const main = async (): Promise<void> => {
  const fixture = await readFixture();
  await checkGrouping();
  console.log('ASR check passed: lyric grouping');

  const directory = await mkdtemp(path.join(tmpdir(), 'motion-forge-asr-'));
  try {
    const audioFile = path.join(directory, 'audio.wav');
    await writeFile(audioFile, Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(64)]));
    await checkFishAudioProvider(fixture, audioFile);
    console.log('ASR check passed: Fish Audio provider (mock HTTP)');
    await checkCli(fixture);
    console.log('ASR check passed: forge transcribe CLI and lyric draft');
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
