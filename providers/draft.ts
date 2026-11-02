import path from 'node:path';
import type {Asset, FilmSpec, SceneSpec} from '../core/schema';
import type {ClassifiedInput} from './input';

const fps = 30;

const distributeDuration = (total: number, count: number): number[] => {
  const base = Math.floor(total / count);
  return Array.from({length: count}, (_, index) => base + (index < total % count ? 1 : 0));
};

const makeScenes = (
  kind: ClassifiedInput['kind'],
  title: string,
  totalDuration: number,
): SceneSpec[] => {
  const durations = distributeDuration(totalDuration, 3);
  const common = {
    assetIds: [],
    layout: {kind: 'hero', options: {}},
    qa: {frames: [0, 30], checkpoints: ['屏上文字与设计一致', '主体不越界']},
  };
  const genreByKind = {
    url: {genre: 'promo' as const, eyebrow: 'PRODUCT STORY', message: '看见产品，如何解决问题'},
    instrumental: {genre: 'music-visual' as const, eyebrow: 'MUSIC VISUAL', message: '让音乐，拥有可以看见的形状'},
    song: {genre: 'music-story' as const, eyebrow: 'MUSIC STORY', message: '沿着歌声，走进一个故事'},
    theme: {genre: 'explainer' as const, eyebrow: 'EXPLAINER', message: title},
    assets: {genre: 'story' as const, eyebrow: 'YOUR STORY', message: '让已有素材，重新组成故事'},
  }[kind];

  return [
    {
      ...common,
      id: 'S01-opening',
      title: '主题开场',
      intent: '建立主题与视觉方向，等待 G1 设计确认',
      semantic: '钩子',
      durationInFrames: durations[0],
      onScreenText: [genreByKind.message],
      layout: {kind: 'hero', options: {}},
      renderer: 'html',
      sceneComponent: 'scene/kinetic-title',
      motion: {
        primary: {cardId: 'typography/keyword-reveal', params: {}},
        camera: {cardId: 'camera/slow-push', params: {zoomTo: 1.04}},
      },
      props: {text: genreByKind.message, eyebrow: genreByKind.eyebrow},
    },
    {
      ...common,
      id: 'S02-content',
      title: '内容发展',
      intent: kind === 'instrumental' ? '以程序化画面承接音乐能量' : '呈现主要信息，具体文字需在设计阶段改写',
      semantic: kind === 'instrumental' ? '氛围' : '列举',
      durationInFrames: durations[1],
      onScreenText: kind === 'instrumental' ? ['节拍 · 段落 · 能量'] : ['核心内容', '视觉证据', '叙事推进'],
      layout: {kind: kind === 'instrumental' ? 'full-bleed' : 'stack', options: {}},
      renderer: kind === 'instrumental' ? 'canvas' : 'html',
      sceneComponent: kind === 'instrumental' ? 'scene/canvas-music' : 'scene/stack-explainer',
      motion: {primary: {cardId: kind === 'instrumental' ? 'effects/canvas-particles' : 'interaction/stack-reveal', params: {}}},
      props: kind === 'instrumental'
        ? {text: '节拍 · 段落 · 能量'}
        : {title: '内容草案，等待设计确认', items: ['核心内容', '视觉证据', '叙事推进']},
    },
    {
      ...common,
      id: 'S03-ending',
      title: '视觉收束',
      intent: '以三维视觉母题形成结尾，实际方案在 G1 阶段确认',
      semantic: '结尾',
      durationInFrames: durations[2],
      onScreenText: ['让内容留下画面'],
      layout: {kind: 'hero-3d', options: {}},
      renderer: 'mixed',
      sceneComponent: 'scene/three-launch',
      motion: {primary: {cardId: 'effects/three-crystal', params: {}}},
      props: {text: '让内容留下画面'},
    },
  ];
};

export const createDraft = (
  input: ClassifiedInput,
  options: {title: string; durationSeconds?: number},
): {film: FilmSpec; assets: Asset[]} => {
  const durationSeconds = options.durationSeconds ?? 12;
  const totalDuration = Math.max(fps, Math.round(durationSeconds * fps));
  const genreByInput: Record<ClassifiedInput['kind'], FilmSpec['genre']> = {
    url: 'promo',
    instrumental: 'music-visual',
    song: 'music-story',
    theme: 'explainer',
    assets: 'story',
  };
  const film: FilmSpec = {
    schemaVersion: '1.0.0',
    id: path.basename(options.title).toLowerCase().replace(/[^a-z0-9]+/g, '-') || `draft-${input.kind}`,
    title: options.title,
    genre: genreByInput[input.kind],
    brief: {
      goal: `根据 ${input.kind} 输入制作《${options.title}》；当前为待确认草案`,
      audience: '待在第一道设计确认闸明确',
      language: 'zh-CN',
    },
    output: {width: 960, height: 540, fps},
    theme: {
      background: '#0c111b',
      foreground: '#f4f0e8',
      accent: '#ffb703',
      muted: '#8291a7',
      fontFamily: 'Noto Sans SC, Microsoft YaHei, sans-serif',
    },
    assets: [],
    audio: {},
    scenes: makeScenes(input.kind, options.title, totalDuration),
  };
  const assets: Asset[] = input.kind === 'theme' || input.kind === 'url'
    ? []
    : input.values.map((value, index) => ({
        id: `asset-${index + 1}`,
        kind: input.kind === 'assets' && /\.(mp4|mov|webm|mkv)$/i.test(value)
          ? 'video'
          : input.kind === 'assets' && /\.(png|jpe?g|webp|gif|svg)$/i.test(value)
            ? 'image'
            : input.kind === 'assets' ? 'voice' : 'audio',
        path: path.resolve(value),
        role: input.kind === 'song' ? 'song' : input.kind,
        metadata: {analysisStatus: 'pending'},
      }));
  film.assets = assets;
  return {film, assets};
};
