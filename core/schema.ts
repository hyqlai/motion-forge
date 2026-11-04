import {z} from 'zod';

export const rendererSchema = z.enum(['html', 'svg', 'canvas', 'three', 'mixed']);
export const cardKindSchema = z.enum([
  'camera',
  'typography',
  'text',
  'data',
  'interaction',
  'effects',
  'rhythm',
  'transition',
  'commercial',
  'media',
  'component',
  'environment',
]);

export const themeSchema = z.object({
  background: z.string(),
  foreground: z.string(),
  accent: z.string(),
  muted: z.string(),
  fontFamily: z.string(),
});

export const assetSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['image', 'video', 'audio', 'voice', 'ui', 'text']),
  path: z.string().min(1),
  role: z.string().min(1),
  source: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const motionUseSchema = z.object({
  cardId: z.string().min(1),
  variant: z.string().optional(),
  params: z.record(z.string(), z.unknown()).default({}),
  timing: z.object({
    anchor: z.string().optional(),
    offsetInFrames: z.number().int().optional(),
  }).optional(),
});

export const sceneSchema = z.object({
  id: z.string().regex(/^S\d{2}[-a-z0-9]*$/),
  title: z.string().min(1),
  intent: z.string().min(1),
  semantic: z.string().min(1),
  durationInFrames: z.number().int().positive(),
  onScreenText: z.array(z.string()).default([]),
  narration: z.string().optional(),
  assetIds: z.array(z.string()).default([]),
  layout: z.object({
    kind: z.string().min(1),
    options: z.record(z.string(), z.unknown()).default({}),
  }),
  renderer: rendererSchema,
  sceneComponent: z.string().min(1),
  motion: z.object({
    primary: motionUseSchema.optional(),
    camera: motionUseSchema.optional(),
    text: motionUseSchema.optional(),
    transitionOut: motionUseSchema.optional(),
  }).default({}),
  props: z.record(z.string(), z.unknown()).default({}),
  qa: z.object({
    frames: z.array(z.number().int().nonnegative()).min(1),
    checkpoints: z.array(z.string()).default([]),
  }),
}).strict();

export const voiceSegmentSchema = z.object({
  sceneId: z.string().regex(/^S\d{2}[-a-z0-9]*$/),
  start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
  text: z.string().min(1),
}).strict();

export const sfxEventSchema = z.object({
  sceneId: z.string().regex(/^S\d{2}[-a-z0-9]*$/),
  frame: z.number().int().nonnegative(),
  kind: z.string().min(1),
}).strict();

export const audioSchema = z.object({
  bgm: z.object({
    src: z.string().min(1),
    volume: z.number().min(0).max(1).default(0.2),
    loop: z.boolean().default(false),
  }).optional(),
  voice: z.object({
    segments: z.array(voiceSegmentSchema).default([]),
  }).strict().default({segments: []}),
  sfx: z.object({
    events: z.array(sfxEventSchema).default([]),
  }).strict().default({events: []}),
}).strict().default({voice: {segments: []}, sfx: {events: []}});

export const filmSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  id: z.string().min(1),
  title: z.string().min(1),
  genre: z.enum(['story', 'explainer', 'music-story', 'promo', 'launch', 'philosophy', 'music-visual']),
  brief: z.object({
    goal: z.string().min(1),
    audience: z.string().min(1),
    language: z.string().min(1),
  }),
  output: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    fps: z.number().int().positive(),
  }),
  theme: themeSchema,
  assets: z.array(assetSchema).default([]),
  audio: audioSchema,
  scenes: z.array(sceneSchema).min(1),
}).strict();

export const productionStateSchema = z.object({
  status: z.enum(['design-review', 'sample-review', 'production', 'delivered']),
  designApprovedAt: z.string().datetime().optional(),
  sampleApprovedAt: z.string().datetime().optional(),
  notes: z.array(z.string()).default([]),
});

export const timingParamSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  unit: z.enum(['seconds', 'frames']),
  defaultValue: z.number().positive(),
  min: z.number().nonnegative(),
  max: z.number().positive(),
  step: z.number().positive().default(1),
  description: z.string().default(''),
});

export const motionCardManifestSchema = z.object({
  id: z.string().regex(/^(camera|typography|text|data|interaction|effects|rhythm|transition|commercial|media|component|environment)\/[a-z0-9-]+$/),
  version: z.string().min(1),
  kind: cardKindSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  intents: z.array(z.string()).min(1),
  genres: z.array(z.string()).min(1),
  inputs: z.array(z.string()).min(1),
  aspects: z.array(z.enum(['16:9', '9:16', '1:1', 'any'])).min(1),
  energy: z.enum(['low', 'medium', 'high']),
  renderers: z.array(rendererSchema).min(1),
  timing: z.object({
    defaultInFrames: z.number().int().positive(),
    minimumInFrames: z.number().int().positive(),
    stretchableHold: z.boolean(),
    params: z.array(timingParamSchema).optional(),
  }),
  usage: z.object({
    when: z.array(z.string()).min(1),
    avoid: z.array(z.string()).min(1),
    pairsWith: z.array(z.string()).default([]),
    conflictsWith: z.array(z.string()).default([]),
  }),
  qa: z.object({
    frames: z.array(z.number().int().nonnegative()).min(1),
  }),
  migration: z.object({
    source: z.string().min(1),
    sourcePath: z.string().min(1),
    reference: z.string().min(1),
    status: z.enum(['migrating', 'ready']),
  }).optional(),
});

export type Renderer = z.infer<typeof rendererSchema>;
export type CardKind = z.infer<typeof cardKindSchema>;
export type Theme = z.infer<typeof themeSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type VoiceSegment = z.infer<typeof voiceSegmentSchema>;
export type SfxEvent = z.infer<typeof sfxEventSchema>;
export type AudioTracks = z.infer<typeof audioSchema>;
export type MotionUse = z.infer<typeof motionUseSchema>;
export type SceneSpec = z.infer<typeof sceneSchema>;
export type FilmSpec = z.infer<typeof filmSchema>;
export type ProductionState = z.infer<typeof productionStateSchema>;
export type TimingParam = z.infer<typeof timingParamSchema>;
export type MotionCardManifest = z.infer<typeof motionCardManifestSchema>;
