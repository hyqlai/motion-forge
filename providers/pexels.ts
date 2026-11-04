import {mkdir, rename, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import type {ResourceCandidate, ResourceProvider, ResourceQuery} from './resources';

export type PexelsErrorCode =
  | 'unconfigured'
  | 'invalid-config'
  | 'auth'
  | 'rate-limit'
  | 'no-results'
  | 'http'
  | 'download'
  | 'invalid-response';

export class PexelsError extends Error {
  readonly code: PexelsErrorCode;
  readonly status?: number;
  readonly retryAfterSeconds?: number;

  constructor(code: PexelsErrorCode, message: string, options: {status?: number; retryAfterSeconds?: number} = {}) {
    super(message);
    this.name = 'PexelsError';
    this.code = code;
    this.status = options.status;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

export type PexelsProviderConfig = {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

const normalizeBaseUrl = (value: string | undefined): string => {
  const candidate = value?.trim() || 'https://api.pexels.com';
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new PexelsError('invalid-config', `Invalid Pexels base URL: ${candidate}`);
  }
  if (!/^https?:$/.test(url.protocol)) {
    throw new PexelsError('invalid-config', 'Pexels base URL must use http or https');
  }
  return url.toString().replace(/\/$/, '');
};

type PexelsPhoto = {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer?: string;
  photographer_url?: string;
  avg_color?: string;
  alt?: string;
  src: {
    original?: string;
    large2x?: string;
    large?: string;
    medium?: string;
    small?: string;
  };
};

type PexelsSearchResponse = {
  photos?: PexelsPhoto[];
};

const orientationFor = (aspect: string | undefined): string | undefined => {
  switch (aspect) {
    case '16:9':
    case 'landscape':
      return 'landscape';
    case '9:16':
    case 'portrait':
      return 'portrait';
    case '1:1':
    case 'square':
      return 'square';
    default:
      return undefined;
  }
};

const toCandidate = (photo: PexelsPhoto, query: string): ResourceCandidate => {
  const downloadUrl = photo.src.original ?? photo.src.large2x ?? photo.src.large ?? photo.src.medium;
  const previewUrl = photo.src.medium ?? photo.src.large ?? photo.src.small ?? downloadUrl;
  if (!downloadUrl || !previewUrl) {
    throw new PexelsError('invalid-response', `Pexels photo ${photo.id} has no downloadable image source`);
  }
  return {
    id: String(photo.id),
    kind: 'image',
    title: photo.alt?.trim() || `Pexels photo ${photo.id}`,
    previewUrl,
    downloadUrl,
    sourceUrl: photo.url,
    provider: 'pexels',
    metadata: {
      query,
      photographer: photo.photographer ?? null,
      photographerUrl: photo.photographer_url ?? null,
      width: photo.width,
      height: photo.height,
      avgColor: photo.avg_color ?? null,
      license: 'Pexels License',
      licenseUrl: 'https://www.pexels.com/license/',
    },
  };
};

const httpError = (response: Response, phase: 'search' | 'download'): PexelsError => {
  const status = response.status;
  if (status === 401 || status === 403) {
    return new PexelsError('auth', `Pexels authentication failed (HTTP ${status}); check PEXELS_API_KEY`, {status});
  }
  if (status === 429) {
    const retryAfter = Number(response.headers.get('retry-after'));
    const retryAfterSeconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined;
    const retryHint = retryAfterSeconds ? `; retry after ${retryAfterSeconds}s` : '';
    return new PexelsError('rate-limit', `Pexels rate limit reached (HTTP 429)${retryHint}`, {
      status,
      retryAfterSeconds,
    });
  }
  return new PexelsError(
    phase === 'download' ? 'download' : 'http',
    `Pexels ${phase} request failed with HTTP ${status}`,
    {status},
  );
};

export const createPexelsResourceProvider = (config: PexelsProviderConfig): ResourceProvider => {
  const apiKey = config.apiKey.trim();
  if (!apiKey) {
    throw new PexelsError('unconfigured', 'PEXELS_API_KEY is not configured; external image search is disabled');
  }
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const fetchImpl = config.fetchImpl ?? globalThis.fetch;

  const search = async (query: ResourceQuery): Promise<ResourceCandidate[]> => {
    const url = new URL(`${baseUrl}/v1/search`);
    url.searchParams.set('query', query.query);
    url.searchParams.set('per_page', String(Math.min(Math.max(query.count ?? 15, 1), 80)));
    const orientation = orientationFor(query.aspect);
    if (orientation) url.searchParams.set('orientation', orientation);
    let response: Response;
    try {
      response = await fetchImpl(url, {
        headers: {Authorization: apiKey, Accept: 'application/json'},
      });
    } catch (error) {
      throw new PexelsError('http', `Pexels search request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!response.ok) throw httpError(response, 'search');
    let payload: PexelsSearchResponse;
    try {
      payload = await response.json() as PexelsSearchResponse;
    } catch {
      throw new PexelsError('invalid-response', 'Pexels search response was not valid JSON', {status: response.status});
    }
    if (!Array.isArray(payload.photos)) {
      throw new PexelsError('invalid-response', 'Pexels search response did not contain a photos array');
    }
    if (payload.photos.length === 0) {
      throw new PexelsError('no-results', `Pexels returned no images for query: ${query.query}`);
    }
    return payload.photos.map((photo) => toCandidate(photo, query.query));
  };

  const download = async (candidate: ResourceCandidate, destination: string): Promise<void> => {
    if (candidate.kind !== 'image') {
      throw new PexelsError('download', `Pexels only downloads image resources, got: ${candidate.kind}`);
    }
    let response: Response;
    try {
      response = await fetchImpl(candidate.downloadUrl, {headers: {Accept: 'image/*'}});
    } catch (error) {
      throw new PexelsError('download', `Pexels image download failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!response.ok) throw httpError(response, 'download');
    const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    if (contentType && !contentType.startsWith('image/')) {
      throw new PexelsError('download', `Pexels download returned non-image content: ${contentType}`, {status: response.status});
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0) {
      throw new PexelsError('download', `Pexels image download was empty for photo ${candidate.id}`);
    }
    const temporary = `${destination}.${process.pid}.tmp`;
    try {
      await mkdir(path.dirname(destination), {recursive: true});
      await writeFile(temporary, buffer);
      await rename(temporary, destination);
    } catch (error) {
      await rm(temporary, {force: true}).catch(() => undefined);
      throw new PexelsError('download', `Could not save Pexels image to ${destination}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return {
    id: 'pexels',
    kinds: ['image'],
    search,
    download,
  };
};
