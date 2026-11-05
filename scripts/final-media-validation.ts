import {execFile} from 'node:child_process';
import {stat} from 'node:fs/promises';
import path from 'node:path';
import type {FilmSpec} from '../core/schema';

const FRAME_TOLERANCE = 0;
const FPS_TOLERANCE = 0.001;
const DURATION_TOLERANCE_SECONDS = 0.1;

export type FinalMediaOptions = {
  file: string;
  label: string;
  film: FilmSpec;
  expectedFrames: number;
  hasAudio: boolean;
};

type MediaProbe = {
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

export const probeFinalFilm = async (options: FinalMediaOptions): Promise<string[]> => {
  const {file, label, film, expectedFrames, hasAudio} = options;
  await assertVideoFile(file, label);
  const output = await runTool(process.env.FFPROBE_PATH ?? 'ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration:stream=codec_type,codec_name,width,height,nb_frames,duration,avg_frame_rate',
    '-of', 'json',
    file,
  ]);
  const probe = JSON.parse(output) as MediaProbe;
  const video = probe.streams?.find((stream) => stream.codec_type === 'video');
  const audio = probe.streams?.find((stream) => stream.codec_type === 'audio');
  if (!video) throw new Error(`Final video has no video stream: ${label}`);
  if (video.codec_name !== 'h264') throw new Error(`Final video codec must be h264, got ${video.codec_name ?? 'unknown'}: ${label}`);
  if (video.width !== film.output.width || video.height !== film.output.height) {
    throw new Error(`Final video dimensions ${video.width}x${video.height}, expected ${film.output.width}x${film.output.height}: ${label}`);
  }
  const frames = Number(video.nb_frames);
  if (!Number.isFinite(frames) || Math.abs(frames - expectedFrames) > FRAME_TOLERANCE) {
    throw new Error(`Final video has ${video.nb_frames ?? 'unknown'} frames, expected ${expectedFrames}: ${label}`);
  }
  const [fpsNumerator, fpsDenominator] = (video.avg_frame_rate ?? '').split('/').map(Number);
  const actualFps = fpsNumerator / fpsDenominator;
  if (!Number.isFinite(actualFps) || Math.abs(actualFps - film.output.fps) > FPS_TOLERANCE) {
    throw new Error(`Final video fps ${video.avg_frame_rate ?? 'unknown'}, expected ${film.output.fps}: ${label}`);
  }
  const expectedDuration = expectedFrames / film.output.fps;
  const duration = Number(probe.format?.duration);
  if (!Number.isFinite(duration) || Math.abs(duration - expectedDuration) > DURATION_TOLERANCE_SECONDS) {
    throw new Error(`Final video duration ${probe.format?.duration ?? 'unknown'}s, expected ${expectedDuration}s: ${label}`);
  }
  if (hasAudio && !audio) throw new Error(`Final video is missing its declared audio mix: ${label}`);
  if (!hasAudio && audio) throw new Error(`Final video unexpectedly contains an audio stream: ${label}`);
  return [
    `file=${label}`,
    `actualFrames=${video.nb_frames ?? 'unknown'}; expectedFrames=${expectedFrames}; tolerance=${FRAME_TOLERANCE}`,
    `video=${video.codec_name} ${video.width}x${video.height}@${video.avg_frame_rate ?? 'unknown'}`,
    `audio=${audio?.codec_name ?? (hasAudio ? 'missing' : 'none')}`,
    `ffprobe=${JSON.stringify(probe)}`,
  ];
};

export const decodeFinalFilm = async (file: string, label: string): Promise<void> => {
  await assertVideoFile(file, label);
  await runTool(process.env.FFMPEG_PATH ?? 'ffmpeg', ['-v', 'error', '-xerror', '-i', file, '-f', 'null', '-']);
};

export const validateFinalFilm = async (options: FinalMediaOptions): Promise<string[]> => {
  const evidence = await probeFinalFilm(options);
  await decodeFinalFilm(options.file, options.label);
  return [...evidence, `ffmpeg -xerror 完整解码通过：${options.label}`];
};
