export const TTS_FORMATS = ['mp3', 'wav', 'pcm', 'opus'] as const;
export type TTSFormat = typeof TTS_FORMATS[number];

export type TTSProsody = {
  speed?: number;
  volume?: number;
};

export type TTSRequest = {
  text: string;
  voice?: string;
  format?: TTSFormat;
  model?: string;
  prosody?: TTSProsody;
};

export type TTSResult = {
  audio: Buffer;
  format: TTSFormat;
  mimeType: string;
  provider: string;
  model?: string;
};

export interface TTSProvider {
  id: string;
  synthesize(request: TTSRequest): Promise<TTSResult>;
}

export type TTSProviderErrorCode =
  | 'auth'
  | 'quota'
  | 'rate-limit'
  | 'server'
  | 'invalid-request'
  | 'network'
  | 'invalid-response';

export class TTSProviderError extends Error {
  readonly code: TTSProviderErrorCode;
  readonly provider: string;
  readonly retryable: boolean;
  readonly status?: number;
  readonly retryAfterMs?: number;

  constructor(options: {
    code: TTSProviderErrorCode;
    message: string;
    provider: string;
    retryable: boolean;
    status?: number;
    retryAfterMs?: number;
  }) {
    super(options.message);
    this.name = 'TTSProviderError';
    this.code = options.code;
    this.provider = options.provider;
    this.retryable = options.retryable;
    this.status = options.status;
    this.retryAfterMs = options.retryAfterMs;
  }
}

const providers = new Map<string, TTSProvider>();

export const registerTTSProvider = (provider: TTSProvider): void => {
  if (providers.has(provider.id)) throw new Error(`TTS provider already registered: ${provider.id}`);
  providers.set(provider.id, provider);
};

export const hasTTSProvider = (id: string): boolean => providers.has(id);

export const getTTSProvider = (id: string): TTSProvider => {
  const provider = providers.get(id);
  if (!provider) throw new Error(`TTS provider is not registered: ${id}`);
  return provider;
};

export const listTTSProviders = (): TTSProvider[] => [...providers.values()];
