import assert from 'node:assert/strict';
import {mkdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {compileAudioTracks} from '../core/audio';
import {filmSchema, type FilmSpec} from '../core/schema';
import {sampleFilm} from '../examples/theme-demo/film';
import {validateFilm} from './film-validation';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.join(root, 'public');
const fixtureId = `three-track-verify-${process.pid}-${Date.now().toString(36)}`;
const fixtureDirectory = path.join(publicRoot, 'assets', fixtureId);
const bgmPath = `assets/${fixtureId}/bgm.wav`;
const voicePath = `assets/${fixtureId}/voice.wav`;
const sfxPath = `assets/${fixtureId}/sfx.wav`;

const buildFilm = (): FilmSpec => {
  const scenes = sampleFilm.scenes.slice(0, 2).map((scene, index) => ({
    ...scene,
    id: index === 0 ? 'S01-opening' : 'S02-content',
    durationInFrames: 60,
    qa: {frames: [0, 30], checkpoints: scene.qa.checkpoints},
  }));
  return {
    ...sampleFilm,
    id: fixtureId,
    assets: [
      {id: 'bgm-fixture', kind: 'audio', path: bgmPath, role: 'bgm', metadata: {}},
      {id: 'voice-S01-opening', kind: 'voice', path: voicePath, role: 'narration', metadata: {sceneId: 'S01-opening'}},
      {id: 'whoosh-fixture', kind: 'audio', path: sfxPath, role: 'sfx', metadata: {}},
    ],
    audio: {
      bgm: {src: bgmPath, volume: 0.2, loop: true},
      voice: {segments: [{sceneId: 'S01-opening', start: 10, end: 40, text: '第一段旁白'}]},
      sfx: {events: [{sceneId: 'S02-content', frame: 15, kind: 'whoosh-fixture'}]},
    },
    scenes: scenes.map((scene) => scene.id === 'S01-opening'
      ? {...scene, assetIds: ['voice-S01-opening']}
      : {...scene, assetIds: []}),
  };
};

const expectReject = async (run: () => Promise<unknown>, pattern: RegExp): Promise<void> => {
  try {
    await run();
  } catch (error) {
    assert.ok(error instanceof Error, `expected Error, received ${String(error)}`);
    assert.match(error.message, pattern);
    return;
  }
  assert.fail(`expected validation to fail with ${pattern}`);
};

const expectRejectSync = (run: () => unknown, pattern: RegExp): void => {
  try {
    run();
  } catch (error) {
    assert.ok(error instanceof Error, `expected Error, received ${String(error)}`);
    assert.match(error.message, pattern);
    return;
  }
  assert.fail(`expected validation to fail with ${pattern}`);
};

await mkdir(fixtureDirectory, {recursive: true});
await writeFile(path.join(fixtureDirectory, 'bgm.wav'), 'bgm');
await writeFile(path.join(fixtureDirectory, 'voice.wav'), 'voice');
await writeFile(path.join(fixtureDirectory, 'sfx.wav'), 'sfx');

try {
  // 旧版仅 BGM 的 Film IR 必须继续通过，并补齐可选的三轨默认值。
  const legacy = filmSchema.parse({
    ...sampleFilm,
    audio: {bgm: {src: 'audio/music.wav', volume: 0.18, loop: true}},
  });
  assert.deepEqual(legacy.audio.voice.segments, []);
  assert.deepEqual(legacy.audio.sfx.events, []);
  await validateFilm(legacy, {publicRoot});

  // 旧草稿可能写入空 audio 或完全省略 audio，解析后都要补齐空轨道。
  for (const audio of [{}, undefined]) {
    const parsed = filmSchema.parse({...sampleFilm, audio});
    assert.deepEqual(parsed.audio.voice.segments, []);
    assert.deepEqual(parsed.audio.sfx.events, []);
  }

  const film = filmSchema.parse(buildFilm());
  assert.equal(film.audio.voice.segments[0].text, '第一段旁白');
  assert.equal(film.audio.sfx.events[0].kind, 'whoosh-fixture');

  // 全片绝对帧由 compileTimeline 派生；Voice 使用场景局部起止，SFX 使用场景局部帧。
  const tracks = compileAudioTracks(film);
  assert.deepEqual(
    tracks.voice.map((segment) => ({
      sceneId: segment.sceneId,
      from: segment.from,
      durationInFrames: segment.durationInFrames,
      text: segment.text,
    })),
    [{sceneId: 'S01-opening', from: 10, durationInFrames: 30, text: '第一段旁白'}],
  );
  assert.deepEqual(
    tracks.sfx.map((event) => ({sceneId: event.sceneId, at: event.at, kind: event.kind})),
    [{sceneId: 'S02-content', at: 75, kind: 'whoosh-fixture'}],
  );

  await validateFilm(film, {publicRoot});

  const withoutVoiceAsset = {
    ...film,
    scenes: film.scenes.map((scene) => scene.id === 'S01-opening' ? {...scene, assetIds: []} : scene),
  };
  await expectReject(
    () => validateFilm(filmSchema.parse(withoutVoiceAsset), {publicRoot}),
    /no voice asset/i,
  );

  const unknownVoiceScene = {
    ...film,
    audio: {...film.audio, voice: {segments: [{sceneId: 'S09-missing', start: 0, end: 10, text: '未知场景'}]}},
  };
  await expectReject(
    () => validateFilm(filmSchema.parse(unknownVoiceScene), {publicRoot}),
    /unknown scene/i,
  );

  const outOfRangeVoice = {
    ...film,
    audio: {...film.audio, voice: {segments: [{sceneId: 'S01-opening', start: 0, end: 61, text: '越界旁白'}]}},
  };
  await expectReject(
    () => validateFilm(filmSchema.parse(outOfRangeVoice), {publicRoot}),
    /scene duration/i,
  );

  const reversedVoice = {
    ...film,
    audio: {...film.audio, voice: {segments: [{sceneId: 'S01-opening', start: 30, end: 30, text: '空区间'}]}},
  };
  await expectReject(
    () => validateFilm(filmSchema.parse(reversedVoice), {publicRoot}),
    /start must be before end/i,
  );

  const overlappingVoice = {
    ...film,
    audio: {
      ...film.audio,
      voice: {segments: [
        {sceneId: 'S01-opening', start: 0, end: 30, text: '第一句'},
        {sceneId: 'S01-opening', start: 20, end: 40, text: '第二句'},
      ]},
    },
  };
  await expectReject(
    () => validateFilm(filmSchema.parse(overlappingVoice), {publicRoot}),
    /overlap/i,
  );

  const unknownSfxScene = {
    ...film,
    audio: {...film.audio, sfx: {events: [{sceneId: 'S09-missing', frame: 0, kind: 'whoosh-fixture'}]}},
  };
  await expectReject(
    () => validateFilm(filmSchema.parse(unknownSfxScene), {publicRoot}),
    /unknown scene/i,
  );

  const outOfRangeSfx = {
    ...film,
    audio: {...film.audio, sfx: {events: [{sceneId: 'S02-content', frame: 60, kind: 'whoosh-fixture'}]}},
  };
  await expectReject(
    () => validateFilm(filmSchema.parse(outOfRangeSfx), {publicRoot}),
    /scene duration/i,
  );

  const unknownSfxKind = {
    ...film,
    audio: {...film.audio, sfx: {events: [{sceneId: 'S02-content', frame: 10, kind: 'missing-sfx'}]}},
  };
  await expectReject(
    () => validateFilm(filmSchema.parse(unknownSfxKind), {publicRoot}),
    /SFX asset/i,
  );

  const absoluteVoicePath = {
    ...film,
    assets: film.assets.map((asset) => asset.id === 'voice-S01-opening'
      ? {...asset, path: path.join(fixtureDirectory, 'voice.wav')}
      : asset),
  };
  await expectReject(
    () => validateFilm(filmSchema.parse(absoluteVoicePath), {publicRoot}),
    /project-local public path/i,
  );

  const escapingBgmPath = {
    ...film,
    audio: {...film.audio, bgm: {src: '../outside.wav', volume: 0.2, loop: false}},
  };
  await expectReject(
    () => validateFilm(filmSchema.parse(escapingBgmPath), {publicRoot}),
    /escapes the project public directory/i,
  );

  const missingVoiceFile = {
    ...film,
    assets: film.assets.map((asset) => asset.id === 'voice-S01-opening'
      ? {...asset, path: `assets/${fixtureId}/missing-voice.wav`}
      : asset),
  };
  await expectReject(
    () => validateFilm(filmSchema.parse(missingVoiceFile), {publicRoot}),
    /does not exist/i,
  );

  // 工作台写回使用同一音频事实源做结构校验，不依赖文件系统。
  expectRejectSync(() => compileAudioTracks(filmSchema.parse(outOfRangeSfx)), /scene duration/i);
} finally {
  await rm(fixtureDirectory, {recursive: true, force: true});
}

console.log('Three-track audio schema, timeline and validation checks passed');
