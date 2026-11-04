import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {
  ASRProviderError,
  type ASRProvider,
  type ASRSegment,
  type ASRTranscription,
  type ASRTranscriptionOptions,
} from './asr';

export const FISH_AUDIO_ASR_DEFAULT_BASE_URL = 'https://api.fish.audio';
export const FISH_AUDIO_ASR_DEFAULT_MODEL = 'transcribe-1-pro';

export type FishAudioASROptions = {
  baseUrl?: string;
  model?: string;
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
};

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const contentTypeFor = (filePath: string): string => {
  switch (path.extname(filePath).toLowerCase()) {
    case '.wav': return 'audio/wav';
    case '.mp3': return 'audio/mpeg';
    case '.m4a': return 'audio/mp4';
    case '.aac': return 'audio/aac';
    case '.flac': return 'audio/flac';
    case '.ogg': return 'audio/ogg';
    default: return 'application/octet-stream';
  }
};

const sleep = async (milliseconds: number): Promise<void> => {
  if (milliseconds <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const readDurationSeconds = (response: JsonRecord): number | undefined => {
  const seconds = response.duration_seconds ?? response.durationSeconds;
  if (typeof seconds === 'number' && Number.isFinite(seconds)) return seconds;
  // Fish Audio 官方 Go SDK 将 `duration` 定义为毫秒，`start`/`end` 为秒。
  const milliseconds = response.duration_ms ?? response.duration;
  if (typeof milliseconds === 'number' && Number.isFinite(milliseconds)) return milliseconds / 1000;
  return undefined;
};

const readSegments = (value: unknown, requireTimestamps: boolean): ASRSegment[] => {
  if (!Array.isArray(value) || value.length === 0) {
    if (requireTimestamps) {
      throw new ASRProviderError('missing-timestamps', 'ASR response contains no timestamped segments');
    }
    return [];
  }
  let previousStart = -Infinity;
  return value.map((item, index) => {
    const segment = isRecord(item) ? item : {};
    const text = typeof segment.text === 'string' ? segment.text.trim() : '';
    const startSeconds = segment.start;
    const endSeconds = segment.end;
    if (!text) {
      throw new ASRProviderError('bad-response', `ASR segment ${index + 1} has no text`);
    }
    if (
      typeof startSeconds !== 'number' || !Number.isFinite(startSeconds) ||
      typeof endSeconds !== 'number' || !Number.isFinite(endSeconds)
    ) {
      throw new ASRProviderError('invalid-timestamps', `ASR segment ${index + 1} is missing start or end time`);
    }
    if (startSeconds < 0 || endSeconds <= startSeconds) {
      throw new ASRProviderError('invalid-timestamps', `ASR segment ${index + 1} has an invalid time range`);
    }
    if (startSeconds < previousStart) {
      throw new ASRProviderError('invalid-timestamps', `ASR segments are not ordered at segment ${index + 1}`);
    }
    previousStart = startSeconds;
    return {text, startSeconds, endSeconds};
  });
};

const responseError = (status: number, body: string): ASRProviderError => {
  const detail = body.replace(/\s+/g, ' ').trim().slice(0, 300);
  const suffix = detail ? `: ${detail}` : '';
  if (status === 401 || status === 403) {
    return new ASRProviderError('auth', `Fish Audio authentication failed (HTTP ${status})${suffix}`, {status});
  }
  if (status === 402) {
    return new ASRProviderError('quota', `Fish Audio balance is insufficient (HTTP ${status})${suffix}`, {status});
  }
  if (status === 429) {
    return new ASRProviderError('rate-limit', `Fish Audio rate limit reached (HTTP ${status})${suffix}`, {
      status,
      retryable: true,
    });
  }
  if (status >= 500) {
    return new ASRProviderError('server', `Fish Audio server error (HTTP ${status})${suffix}`, {
      status,
      retryable: true,
    });
  }
  return new ASRProviderError('request', `Fish Audio rejected the request (HTTP ${status})${suffix}`, {status});
};

export const createFishAudioASR = (options: FishAudioASROptions = {}): ASRProvider => {
  const maxRetries = options.maxRetries ?? 2;
  const retryDelayMs = options.retryDelayMs ?? 500;
  const timeoutMs = options.timeoutMs ?? 120_000;

  return {
    id: 'fish-audio',
    async transcribe(audioPath: string, transcriptionOptions: ASRTranscriptionOptions = {}): Promise<ASRTranscription> {
      const apiKey = process.env.FISH_API_KEY?.trim();
      if (!apiKey) {
        throw new ASRProviderError('missing-key', 'FISH_API_KEY is required to use the Fish Audio ASR provider');
      }
      const model = options.model ?? FISH_AUDIO_ASR_DEFAULT_MODEL;
      const requireTimestamps = transcriptionOptions.timestamps ?? true;
      const baseUrl = (options.baseUrl ?? process.env.FISH_AUDIO_BASE_URL ?? FISH_AUDIO_ASR_DEFAULT_BASE_URL)
        .replace(/\/+$/, '');
      let endpoint: URL;
      try {
        endpoint = new URL(`${baseUrl}/v1/asr`);
      } catch {
        throw new ASRProviderError('request', `Invalid Fish Audio base URL: ${baseUrl}`);
      }
      if (!['http:', 'https:'].includes(endpoint.protocol) || endpoint.username || endpoint.password) {
        throw new ASRProviderError('request', `Invalid Fish Audio base URL: ${baseUrl}`);
      }

      const audio = await readFile(audioPath).catch(() => {
        throw new ASRProviderError('request', `Audio file cannot be read: ${audioPath}`);
      });
      const fileName = path.basename(audioPath);
      const mimeType = contentTypeFor(audioPath);
      const buildForm = (): FormData => {
        const form = new FormData();
        const bytes = audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength) as ArrayBuffer;
        form.append('audio', new Blob([bytes], {type: mimeType}), fileName);
        form.append('ignore_timestamps', String(!requireTimestamps));
        if (transcriptionOptions.language) form.append('language', transcriptionOptions.language);
        if (model) form.append('model', model);
        return form;
      };

      let attempt = 0;
      for (;;) {
        let response: Response;
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {authorization: `Bearer ${apiKey}`},
            body: buildForm(),
            signal: AbortSignal.timeout(timeoutMs),
          });
        } catch (error) {
          if (attempt < maxRetries) {
            await sleep(retryDelayMs * 2 ** attempt);
            attempt += 1;
            continue;
          }
          const reason = error instanceof Error ? error.message : String(error);
          throw new ASRProviderError('network', `Fish Audio request failed: ${reason}`);
        }

        const body = await response.text();
        if (!response.ok) {
          const error = responseError(response.status, body);
          if (error.retryable && attempt < maxRetries) {
            const retryAfter = Number(response.headers.get('retry-after'));
            const delay = Number.isFinite(retryAfter) && retryAfter >= 0
              ? Math.min(retryAfter * 1000, 10_000)
              : retryDelayMs * 2 ** attempt;
            await sleep(delay);
            attempt += 1;
            continue;
          }
          throw error;
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(body);
        } catch {
          throw new ASRProviderError('bad-response', 'Fish Audio ASR response is not valid JSON');
        }
        if (!isRecord(parsed)) {
          throw new ASRProviderError('bad-response', 'Fish Audio ASR response is not a JSON object');
        }
        const text = typeof parsed.text === 'string' ? parsed.text.trim() : '';
        if (!text) {
          throw new ASRProviderError('bad-response', 'Fish Audio ASR response contains no transcription text');
        }
        const durationSeconds = readDurationSeconds(parsed);
        if (durationSeconds === undefined || durationSeconds <= 0) {
          throw new ASRProviderError('bad-response', 'Fish Audio ASR response contains no valid duration');
        }
        const segments = readSegments(parsed.segments, requireTimestamps);
        if (segments.length > 0 && segments[segments.length - 1].endSeconds > durationSeconds + 0.5) {
          throw new ASRProviderError(
            'invalid-timestamps',
            'Fish Audio ASR segment timestamps exceed the reported duration',
          );
        }
        return {
          provider: 'fish-audio',
          model: model || undefined,
          language: transcriptionOptions.language,
          text,
          durationSeconds,
          segments,
        };
      }
    },
  };
};
