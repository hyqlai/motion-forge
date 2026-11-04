export type ASRSegment = {
  text: string;
  startSeconds: number;
  endSeconds: number;
};

export type ASRTranscriptionOptions = {
  language?: string;
  timestamps?: boolean;
};

export type ASRTranscription = {
  provider: string;
  model?: string;
  language?: string;
  text: string;
  durationSeconds: number;
  segments: ASRSegment[];
};

export interface ASRProvider {
  id: string;
  transcribe(audioPath: string, options?: ASRTranscriptionOptions): Promise<ASRTranscription>;
}

export type ASRErrorCode =
  | 'missing-key'
  | 'auth'
  | 'quota'
  | 'rate-limit'
  | 'server'
  | 'request'
  | 'network'
  | 'bad-response'
  | 'missing-timestamps'
  | 'invalid-timestamps';

export class ASRProviderError extends Error {
  readonly code: ASRErrorCode;
  readonly status?: number;
  readonly retryable: boolean;

  constructor(
    code: ASRErrorCode,
    message: string,
    options: {status?: number; retryable?: boolean} = {},
  ) {
    super(message);
    this.name = 'ASRProviderError';
    this.code = code;
    this.status = options.status;
    this.retryable = options.retryable ?? false;
  }
}

const providers = new Map<string, ASRProvider>();

export const registerASRProvider = (provider: ASRProvider): ASRProvider => {
  if (providers.has(provider.id)) throw new Error(`ASR provider already registered: ${provider.id}`);
  providers.set(provider.id, provider);
  return provider;
};

export const getASRProvider = (id: string): ASRProvider => {
  const provider = providers.get(id);
  if (!provider) {
    const available = [...providers.keys()].join(', ') || 'none';
    throw new Error(`Unknown ASR provider: ${id} (available: ${available})`);
  }
  return provider;
};

export const asrProviderIds = (): string[] => [...providers.keys()];

export const DEFAULT_ASR_PROVIDER_ID = 'fish-audio';
