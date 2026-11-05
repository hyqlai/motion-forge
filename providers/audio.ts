import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const execFileAsync = promisify(execFile);

export type AudioProbe = {
  durationSeconds: number;
  format: string;
  sampleRate?: number;
  channels?: number;
};

export const probeAudio = async (filePath: string): Promise<AudioProbe> => {
  const {stdout} = await execFileAsync(process.env.FFPROBE_PATH ?? 'ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration,format_name:stream=sample_rate,channels',
    '-of', 'json',
    filePath,
  ]);
  const data = JSON.parse(stdout) as {
    format?: {duration?: string; format_name?: string};
    streams?: {sample_rate?: string; channels?: number}[];
  };
  const durationSeconds = Number(data.format?.duration);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error(`Unable to determine audio duration: ${filePath}`);
  }
  await execFileAsync(process.env.FFMPEG_PATH ?? 'ffmpeg', [
    '-v', 'error', '-xerror', '-i', filePath, '-f', 'null', '-',
  ]);
  return {
    durationSeconds,
    format: data.format?.format_name ?? 'unknown',
    sampleRate: Number(data.streams?.[0]?.sample_rate) || undefined,
    channels: data.streams?.[0]?.channels,
  };
};
