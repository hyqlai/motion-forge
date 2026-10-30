export type InputKind = 'url' | 'instrumental' | 'song' | 'theme' | 'assets';

export type ClassifiedInput = {
  kind: InputKind;
  value: string;
  values: string[];
};

const audioExtensions = new Set(['.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg']);
const assetExtensions = new Set([
  ...audioExtensions,
  '.mp4', '.mov', '.webm', '.mkv',
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg',
]);

const extensionOf = (value: string): string => {
  const match = value.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] ?? '';
};

export const classifyInput = (
  values: string[],
  options: {audioKind?: 'instrumental' | 'song'} = {},
): ClassifiedInput => {
  if (values.length === 0) {
    throw new Error('At least one input is required');
  }

  if (values.length === 1 && /^https?:\/\//i.test(values[0])) {
    return {kind: 'url', value: values[0], values};
  }

  const allAssets = values.every((value) => assetExtensions.has(extensionOf(value)));
  if (allAssets) {
    if (values.length === 1 && audioExtensions.has(extensionOf(values[0]))) {
      return {
        kind: options.audioKind ?? 'instrumental',
        value: values[0],
        values,
      };
    }
    return {kind: 'assets', value: values[0], values};
  }

  if (values.length > 1) {
    throw new Error('Mixed inputs must all be local asset paths with recognized extensions');
  }

  return {kind: 'theme', value: values[0], values};
};

export const clockForInput = (kind: InputKind): 'voice' | 'lyrics' | 'music' | 'reading' => {
  switch (kind) {
    case 'song': return 'lyrics';
    case 'instrumental': return 'music';
    case 'assets': return 'voice';
    default: return 'reading';
  }
};
