export type ResourceKind = 'image' | 'video' | 'audio' | 'ui';

export type ResourceQuery = {
  kind: ResourceKind;
  query: string;
  sceneId: string;
  aspect?: string;
  count?: number;
  minimumDurationSeconds?: number;
  style?: string;
};

export type ResourceCandidate = {
  id: string;
  kind: ResourceKind;
  title: string;
  previewUrl: string;
  downloadUrl: string;
  sourceUrl: string;
  provider: string;
  metadata: Record<string, unknown>;
};

export interface ResourceProvider {
  id: string;
  kinds: ResourceKind[];
  search(query: ResourceQuery): Promise<ResourceCandidate[]>;
  download(candidate: ResourceCandidate, destination: string): Promise<void>;
}

const providers = new Map<string, ResourceProvider>();

export const registerResourceProvider = (provider: ResourceProvider): void => {
  if (providers.has(provider.id)) throw new Error(`Resource provider already registered: ${provider.id}`);
  providers.set(provider.id, provider);
};

export const providersFor = (kind: ResourceKind): ResourceProvider[] => {
  return [...providers.values()].filter((provider) => provider.kinds.includes(kind));
};
