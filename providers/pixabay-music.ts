import {mkdir, open, rename, rm} from 'node:fs/promises';
import path from 'node:path';
import type {ResourceCandidate, ResourceProvider, ResourceQuery} from './resources';

export type PixabayMusicErrorCode =
  | 'not-configured'
  | 'invalid-query'
  | 'auth'
  | 'rate-limit'
  | 'http'
  | 'network'
  | 'invalid-response'
  | 'download-failed';

export class PixabayMusicError extends Error {
  readonly code: PixabayMusicErrorCode;

  constructor(code: PixabayMusicErrorCode, message: string, options?: {cause?: unknown}) {
    super(message, options);
    this.name = 'PixabayMusicError';
    this.code = code;
  }
}

export type PixabayMusicProviderOptions = {
  apiKey?: string;
  baseUrl?: string;
  searchPath?: string;
  enabled?: boolean;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  userAgent?: string;
};

const defaultBaseUrl = 'https://pixabay.com';
const defaultSearchPath = '/api/music/';
const defaultTimeoutMs = 20_000;
const defaultUserAgent = 'motion-forge/0.1 (+https://github.com/motion-forge)';
const truthy = new Set(['1', 'true', 'yes', 'on']);

const envEnabled = (): boolean | undefined => {
  const value = process.env.PIXABAY_MUSIC_ENABLED;
  if (value === undefined) return undefined;
  return truthy.has(value.trim().toLowerCase());
};

const extensionFromUrl = (url: string): string => {
  const extension = path.extname(new URL(url).pathname).toLowerCase();
  return ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'].includes(extension) ? extension : '.mp3';
};

type PixabayMusicHit = {
  id?: string | number;
  pageURL?: string;
  tags?: string;
  title?: string;
  duration?: number;
  audio?: string;
  audioURL?: string;
  downloadURL?: string;
  url?: string;
  previewURL?: string;
  artworkURL?: string;
  imageURL?: string;
  user?: string;
  downloads?: number;
  likes?: number;
};

const candidateFromHit = (hit: PixabayMusicHit, baseUrl: string): ResourceCandidate => {
  if (hit.id === undefined || hit.id === null || String(hit.id).trim() === '') {
    throw new PixabayMusicError('invalid-response', 'Pixabay Music search result is missing a track id');
  }
  const id = String(hit.id);
  const downloadUrl = [hit.audio, hit.audioURL, hit.downloadURL, hit.url].find((value) => typeof value === 'string' && value.trim());
  if (!downloadUrl) {
    throw new PixabayMusicError('invalid-response', `Pixabay Music track ${id} has no downloadable audio URL`);
  }
  const resolvedDownloadUrl = new URL(downloadUrl, baseUrl).toString();
  const sourceUrl = hit.pageURL && hit.pageURL.trim() ? hit.pageURL : new URL(`/music/${id}/`, baseUrl).toString();
  const previewUrl = [hit.previewURL, hit.artworkURL, hit.imageURL, hit.pageURL, resolvedDownloadUrl]
    .find((value) => typeof value === 'string' && value.trim()) as string;
  const title = hit.title?.trim() || hit.tags?.trim() || `Pixabay Music ${id}`;

  return {
    id: `pixabay-music-${id}`,
    kind: 'audio',
    title,
    previewUrl,
    downloadUrl: resolvedDownloadUrl,
    sourceUrl,
    provider: 'pixabay-music',
    metadata: {
      pixabayId: id,
      author: hit.user ?? 'unknown',
      tags: hit.tags ?? '',
      durationSeconds: hit.duration,
      downloads: hit.downloads,
      likes: hit.likes,
      license: 'Pixabay Content License',
      licenseUrl: 'https://pixabay.com/service/license-summary/',
      fileExtension: extensionFromUrl(resolvedDownloadUrl),
      sourceUrl,
    },
  };
};

const parseResponse = async (response: Response): Promise<unknown> => {
  if (response.status === 401 || response.status === 403) {
    throw new PixabayMusicError('auth', `Pixabay Music authentication failed (HTTP ${response.status}); check PIXABAY_API_KEY`);
  }
  if (response.status === 429) {
    throw new PixabayMusicError('rate-limit', 'Pixabay Music rate limit exceeded (HTTP 429); retry later');
  }
  if (!response.ok) {
    throw new PixabayMusicError('http', `Pixabay Music request failed with HTTP ${response.status}`);
  }
  try {
    return await response.json();
  } catch (error) {
    throw new PixabayMusicError('invalid-response', 'Pixabay Music returned a non-JSON response', {cause: error});
  }
};

export const createPixabayMusicProvider = (options: PixabayMusicProviderOptions = {}): ResourceProvider & {search: (query: ResourceQuery) => Promise<ResourceCandidate[]>} => {
  const apiKey = options.apiKey ?? process.env.PIXABAY_API_KEY;
  const configuredEnabled = options.enabled ?? envEnabled();
  const enabled = configuredEnabled ?? Boolean(apiKey);
  const baseUrl = options.baseUrl ?? process.env.PIXABAY_API_BASE_URL ?? defaultBaseUrl;
  const searchPath = options.searchPath ?? process.env.PIXABAY_MUSIC_SEARCH_PATH ?? defaultSearchPath;
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
  const userAgent = options.userAgent ?? defaultUserAgent;

  const assertConfigured = (): string => {
    if (!enabled) {
      throw new PixabayMusicError(
        'not-configured',
        'Pixabay Music is disabled; set PIXABAY_API_KEY and PIXABAY_MUSIC_ENABLED=true to enable external search',
      );
    }
    if (!apiKey) {
      throw new PixabayMusicError(
        'not-configured',
        'Pixabay Music is not configured; set PIXABAY_API_KEY before searching',
      );
    }
    return apiKey;
  };

  const request = async (url: URL, accept = 'application/json'): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetchImpl(url, {
        signal: controller.signal,
        headers: {'user-agent': userAgent, accept},
      });
    } catch (error) {
      const detail = controller.signal.aborted ? `timed out after ${timeoutMs}ms` : 'network error';
      throw new PixabayMusicError('network', `Pixabay Music request failed: ${detail}`, {cause: error});
    } finally {
      clearTimeout(timer);
    }
  };

  return {
    id: 'pixabay-music',
    kinds: ['audio'],

    async search(query: ResourceQuery): Promise<ResourceCandidate[]> {
      const key = assertConfigured();
      if (query.kind !== 'audio') {
        throw new PixabayMusicError('invalid-query', `Pixabay Music only supports audio queries, received ${query.kind}`);
      }
      const url = new URL(searchPath, baseUrl);
      url.searchParams.set('key', key);
      url.searchParams.set('q', query.query);
      url.searchParams.set('per_page', '20');
      url.searchParams.set('safesearch', 'true');
      if (query.minimumDurationSeconds !== undefined) {
        url.searchParams.set('min_duration', String(query.minimumDurationSeconds));
      }
      const body = await parseResponse(await request(url));
      if (typeof body !== 'object' || body === null || !Array.isArray((body as {hits?: unknown}).hits)) {
        throw new PixabayMusicError('invalid-response', 'Pixabay Music response is missing a hits array');
      }
      return (body as {hits: PixabayMusicHit[]}).hits.map((hit) => candidateFromHit(hit, baseUrl));
    },

    async download(candidate: ResourceCandidate, destination: string): Promise<void> {
      if (candidate.kind !== 'audio') {
        throw new PixabayMusicError('invalid-query', `Pixabay Music can only download audio, received ${candidate.kind}`);
      }
      if (!candidate.downloadUrl) {
        throw new PixabayMusicError('download-failed', `Pixabay Music candidate ${candidate.id} has no download URL`);
      }
      const target = path.resolve(destination);
      await mkdir(path.dirname(target), {recursive: true});
      const temporary = `${target}.part-${process.pid}-${Date.now()}`;

      let response: Response;
      try {
        response = await request(new URL(candidate.downloadUrl), 'audio/*');
      } catch (error) {
        throw new PixabayMusicError('download-failed', `Pixabay Music download failed for ${candidate.id}`, {cause: error});
      }
      if (response.status === 401 || response.status === 403) {
        throw new PixabayMusicError('auth', `Pixabay Music download authentication failed (HTTP ${response.status})`);
      }
      if (response.status === 429) {
        throw new PixabayMusicError('rate-limit', 'Pixabay Music download rate limit exceeded (HTTP 429)');
      }
      if (!response.ok) {
        throw new PixabayMusicError('download-failed', `Pixabay Music download failed with HTTP ${response.status} for ${candidate.id}`);
      }

      let handle: Awaited<ReturnType<typeof open>> | undefined;
      try {
        if (!response.body) {
          throw new PixabayMusicError('download-failed', `Pixabay Music download for ${candidate.id} returned an empty body`);
        }
        handle = await open(temporary, 'w');
        const reader = response.body.getReader();
        while (true) {
          const {done, value} = await reader.read();
          if (done) break;
          await handle.write(value);
        }
        await handle.close();
        handle = undefined;
        await rename(temporary, target);
      } catch (error) {
        if (handle) await handle.close().catch(() => undefined);
        await rm(temporary, {force: true}).catch(() => undefined);
        if (error instanceof PixabayMusicError) throw error;
        throw new PixabayMusicError('download-failed', `Pixabay Music download failed while writing ${candidate.id}`, {cause: error});
      }
    },
  };
};
