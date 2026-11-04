import {
  TTS_FORMATS,
  TTSProviderError,
  type TTSFormat,
  type TTSProvider,
  type TTSRequest,
  type TTSResult,
} from './tts';

export const FISH_AUDIO_PROVIDER_ID = 'fish-audio';
export const FISH_AUDIO_DEFAULT_MODEL = 's2.1-pro';
export const FISH_AUDIO_DEFAULT_BASE_URL = 'https://api.fish.audio';

const mimeTypes: Record<TTSFormat, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  pcm: 'audio/pcm',
  opus: 'audio/opus',
};

export type FishAudioTTSOptions = {
  baseUrl?: string;
  model?: string;
  maxAttempts?: number;
  retryBaseDelayMs?: number;
  retryMaxDelayMs?: number;
  fetchImpl?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
};

const defaultSleep = (milliseconds: number): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, milliseconds);
});

const localHosts = new Set(['127.0.0.1', 'localhost', '[::1]']);

const assertBaseUrl = (value: string): void => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid Fish Audio base URL: ${value}`);
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Fish Audio base URL must use HTTP(S): ${value}`);
  }
  if (url.protocol === 'http:' && !localHosts.has(url.hostname)) {
    throw new Error('Plain HTTP is only allowed for local mock Fish Audio servers; use HTTPS otherwise');
  }
};

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, '');

const readErrorMessage = async (response: Response): Promise<string> => {
  const text = (await response.text()).slice(0, 500);
  try {
    const data = JSON.parse(text) as {message?: string; detail?: string; error?: string | {message?: string}};
    const nested = typeof data.error === 'object' ? data.error?.message : data.error;
    return (data.message ?? data.detail ?? nested ?? text).slice(0, 300);
  } catch {
    return text.slice(0, 300);
  }
};

const classifyHttpFailure = (
  status: number,
  message: string,
): {code: TTSProviderError['code']; retryable: boolean} => {
  const lower = message.toLowerCase();
  if (status === 402 || /insufficient (balance|quota|credit)|balance is not enough|余额不足/.test(lower)) {
    return {code: 'quota', retryable: false};
  }
  if (status === 401 || status === 403) return {code: 'auth', retryable: false};
  if (status === 429) return {code: 'rate-limit', retryable: true};
  if (status === 408) return {code: 'network', retryable: true};
  if (status >= 500) return {code: 'server', retryable: true};
  return {code: 'invalid-request', retryable: false};
};

const retryAfterMilliseconds = (response: Response): number | undefined => {
  const value = response.headers.get('retry-after')?.trim();
  if (!value) return undefined;
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) return undefined;
  return Math.round(seconds * 1000);
};

export const createFishAudioTTSProvider = (options: FishAudioTTSOptions = {}): TTSProvider => {
  const configuredBaseUrl = options.baseUrl ?? process.env.FISH_AUDIO_BASE_URL ?? FISH_AUDIO_DEFAULT_BASE_URL;
  assertBaseUrl(configuredBaseUrl);
  const baseUrl = normalizeBaseUrl(configuredBaseUrl);
  const defaultModel = options.model ?? FISH_AUDIO_DEFAULT_MODEL;
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    id: FISH_AUDIO_PROVIDER_ID,
    synthesize: async (request: TTSRequest): Promise<TTSResult> => {
      const text = request.text.trim();
      if (!text) {
        throw new TTSProviderError({
          code: 'invalid-request',
          message: 'TTS text must not be empty',
          provider: FISH_AUDIO_PROVIDER_ID,
          retryable: false,
        });
      }
      const apiKey = process.env.FISH_API_KEY?.trim();
      if (!apiKey) {
        throw new TTSProviderError({
          code: 'auth',
          message: 'FISH_API_KEY is not configured; no TTS request was sent',
          provider: FISH_AUDIO_PROVIDER_ID,
          retryable: false,
        });
      }

      const format = request.format ?? 'mp3';
      if (!TTS_FORMATS.includes(format)) {
        throw new TTSProviderError({
          code: 'invalid-request',
          message: `Unsupported TTS format: ${String(format)}`,
          provider: FISH_AUDIO_PROVIDER_ID,
          retryable: false,
        });
      }
      const model = request.model ?? defaultModel;
      const maxAttempts = Math.max(1, options.maxAttempts ?? 3);
      const retryBaseDelayMs = Math.max(1, options.retryBaseDelayMs ?? 500);
      const retryMaxDelayMs = Math.max(retryBaseDelayMs, options.retryMaxDelayMs ?? 4_000);
      const sleep = options.sleep ?? defaultSleep;
      const body: Record<string, unknown> = {text, format};
      if (request.voice) body.reference_id = request.voice;
      if (request.prosody) body.prosody = request.prosody;

      let lastError: TTSProviderError | undefined;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        let response: Response;
        try {
          response = await fetchImpl(`${baseUrl}/v1/tts`, {
            method: 'POST',
            headers: {
              authorization: `Bearer ${apiKey}`,
              'content-type': 'application/json',
              accept: 'audio/*',
              model,
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(60_000),
          });
        } catch (error) {
          lastError = new TTSProviderError({
            code: 'network',
            message: `Fish Audio request failed: ${error instanceof Error ? error.message : String(error)}`,
            provider: FISH_AUDIO_PROVIDER_ID,
            retryable: true,
          });
          if (attempt === maxAttempts) break;
          await sleep(Math.min(retryMaxDelayMs, retryBaseDelayMs * 2 ** (attempt - 1)));
          continue;
        }

        if (!response.ok) {
          const errorMessage = await readErrorMessage(response);
          const failure = classifyHttpFailure(response.status, errorMessage);
          lastError = new TTSProviderError({
            code: failure.code,
            message: `Fish Audio request failed with HTTP ${response.status}: ${errorMessage || 'unknown error'}`,
            provider: FISH_AUDIO_PROVIDER_ID,
            retryable: failure.retryable,
            status: response.status,
            retryAfterMs: retryAfterMilliseconds(response),
          });
          if (!failure.retryable || attempt === maxAttempts) break;
          const delay = lastError.retryAfterMs ?? retryBaseDelayMs * 2 ** (attempt - 1);
          await sleep(Math.min(retryMaxDelayMs, delay));
          continue;
        }

        const audio = Buffer.from(await response.arrayBuffer());
        if (audio.length === 0) {
          lastError = new TTSProviderError({
            code: 'invalid-response',
            message: 'Fish Audio returned an empty audio body',
            provider: FISH_AUDIO_PROVIDER_ID,
            retryable: false,
            status: response.status,
          });
          break;
        }
        return {audio, format, mimeType: mimeTypes[format], provider: FISH_AUDIO_PROVIDER_ID, model};
      }

      throw lastError ?? new TTSProviderError({
        code: 'invalid-response',
        message: 'Fish Audio request did not produce audio',
        provider: FISH_AUDIO_PROVIDER_ID,
        retryable: false,
      });
    },
  };
};
