import {z} from 'zod';
import {
  assetSchema,
  filmSchema,
  motionUseSchema,
  rendererSchema,
  themeSchema,
  type FilmSpec,
  type SceneSpec,
} from './schema';

const sceneIdPattern = /^S\d{2}[-a-z0-9]*$/;
const arcIdPattern = /^A\d{2}$/;
const factIdPattern = /^F\d{2}$/;

export const contentPlanArcPhaseSchema = z.enum([
  'hook',
  'setup',
  'development',
  'turn',
  'resolution',
]);

const contentPlanVisualSchema = z.object({
  description: z.string().min(1),
  layoutKind: z.string().min(1),
  options: z.record(z.string(), z.unknown()).default({}),
}).strict();

const contentPlanMotionSchema = z.object({
  primary: motionUseSchema,
  camera: motionUseSchema.optional(),
  text: motionUseSchema.optional(),
  transitionOut: motionUseSchema.optional(),
}).strict();

const contentPlanSceneSchema = z.object({
  id: z.string().regex(sceneIdPattern),
  title: z.string().min(1),
  intent: z.string().min(1),
  semantic: z.string().min(1),
  arcId: z.string().regex(arcIdPattern),
  durationSeconds: z.number().positive().max(600),
  narration: z.string().min(1),
  onScreenText: z.array(z.string().min(1)).min(1),
  visual: contentPlanVisualSchema,
  renderer: rendererSchema,
  sceneComponent: z.string().min(1),
  motion: contentPlanMotionSchema,
  props: z.record(z.string(), z.unknown()).default({}),
  assetIds: z.array(z.string().min(1)).default([]),
  factIds: z.array(z.string().regex(factIdPattern)).default([]),
  qa: z.object({
    frames: z.array(z.number().int().nonnegative()).min(1),
    checkpoints: z.array(z.string()).default([]),
  }).strict(),
}).strict();

const contentPlanArcSchema = z.object({
  id: z.string().regex(arcIdPattern),
  phase: contentPlanArcPhaseSchema,
  purpose: z.string().min(1),
  sceneIds: z.array(z.string().regex(sceneIdPattern)).min(1),
}).strict();

const contentPlanFactSchema = z.object({
  id: z.string().regex(factIdPattern),
  statement: z.string().min(1),
  quote: z.string().min(6),
  sourceUrl: z.string().min(1),
  sceneIds: z.array(z.string().regex(sceneIdPattern)).default([]),
}).strict();

export const contentPlanSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  status: z.enum(['draft', 'ready']),
  source: z.object({
    kind: z.enum(['theme', 'url']),
    value: z.string().min(1),
    title: z.string().min(1),
  }).strict(),
  title: z.string().min(1),
  genre: filmSchema.shape.genre,
  brief: z.object({
    goal: z.string().min(1),
    audience: z.string().min(1),
    language: z.string().min(1),
  }).strict(),
  clock: z.enum(['voice', 'lyrics', 'music', 'reading']),
  output: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    fps: z.number().int().positive(),
  }).strict(),
  theme: themeSchema,
  totalDurationSeconds: z.number().positive().max(1800),
  narrativeArc: z.array(contentPlanArcSchema).min(3).max(6),
  scenes: z.array(contentPlanSceneSchema).min(3).max(24),
  facts: z.array(contentPlanFactSchema).default([]),
  assets: z.array(assetSchema).default([]),
}).strict();

export type ContentPlan = z.infer<typeof contentPlanSchema>;
export type ContentPlanScene = z.infer<typeof contentPlanSceneSchema>;
export type ContentPlanFact = z.infer<typeof contentPlanFactSchema>;

export type PlanSourceSnapshot = {
  url: string;
  finalUrl: string;
  title: string;
  text: string;
};

export const planSourceSnapshotSchema = z.object({
  url: z.string().min(1),
  finalUrl: z.string().min(1),
  title: z.string(),
  text: z.string(),
  capturedAt: z.string().optional(),
}).strict();

const normalizeText = (value: string): string => value.replace(/\s+/g, ' ').trim();

// 模板占位符必须在应用前被真实内容替换，避免把未填写的结构直接推进 G1。
const assertNoPlaceholders = (plan: ContentPlan): void => {
  const values: string[] = [];
  const collect = (value: unknown): void => {
    if (typeof value === 'string') values.push(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === 'object') Object.values(value).forEach(collect);
  };
  collect(plan);
  const placeholder = values.find((value) => value.includes('<填写') || value.includes('TODO'));
  if (placeholder) {
    throw new Error(`Content plan still contains a template placeholder: ${placeholder}`);
  }
};

// 叙事弧线与时长分配是策划模板的硬约束，先于 Film Schema 转换执行。
export const assertContentPlanStructure = (plan: ContentPlan): void => {
  if (plan.status !== 'ready') {
    throw new Error('Content plan status must be "ready" before it can be applied');
  }
  assertNoPlaceholders(plan);

  const sceneIds = plan.scenes.map((scene) => scene.id);
  if (new Set(sceneIds).size !== sceneIds.length) {
    throw new Error('Content plan scene ids must be unique');
  }
  const arcIds = plan.narrativeArc.map((arc) => arc.id);
  if (new Set(arcIds).size !== arcIds.length) {
    throw new Error('Narrative arc ids must be unique');
  }
  if (plan.narrativeArc[0].phase !== 'hook') {
    throw new Error('The narrative arc must start with the hook phase');
  }
  if (plan.narrativeArc[plan.narrativeArc.length - 1].phase !== 'resolution') {
    throw new Error('The narrative arc must end with the resolution phase');
  }

  const arcOrder = plan.narrativeArc.flatMap((arc) => arc.sceneIds.map((id) => ({id, arcId: arc.id})));
  if (arcOrder.length !== sceneIds.length) {
    throw new Error('Every scene must belong to exactly one narrative arc');
  }
  for (const [index, entry] of arcOrder.entries()) {
    if (entry.id !== sceneIds[index]) {
      throw new Error(`Narrative arc order must match scene order at ${entry.id}`);
    }
    if (plan.scenes[index].arcId !== entry.arcId) {
      throw new Error(`Scene ${entry.id} arcId must be ${entry.arcId}`);
    }
  }

  const total = plan.scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);
  if (Math.abs(total - plan.totalDurationSeconds) > 1e-6) {
    throw new Error(
      `Scene durations (${total}s) must add up to totalDurationSeconds (${plan.totalDurationSeconds}s)`,
    );
  }
  for (const scene of plan.scenes) {
    if (Math.round(scene.durationSeconds * plan.output.fps) < 1) {
      throw new Error(`Scene ${scene.id} is shorter than one frame`);
    }
  }

  const factIds = plan.facts.map((fact) => fact.id);
  if (new Set(factIds).size !== factIds.length) {
    throw new Error('Content plan fact ids must be unique');
  }
  const factsById = new Map(plan.facts.map((fact) => [fact.id, fact]));
  for (const scene of plan.scenes) {
    for (const factId of scene.factIds) {
      const fact = factsById.get(factId);
      if (!fact) throw new Error(`Scene ${scene.id} references missing fact ${factId}`);
      if (!fact.sceneIds.includes(scene.id)) {
        throw new Error(`Fact ${factId} must list scene ${scene.id} in sceneIds`);
      }
    }
  }
  for (const fact of plan.facts) {
    for (const sceneId of fact.sceneIds) {
      if (!sceneIds.includes(sceneId)) throw new Error(`Fact ${fact.id} references missing scene ${sceneId}`);
      const scene = plan.scenes.find((item) => item.id === sceneId);
      if (!scene?.factIds.includes(fact.id)) {
        throw new Error(`Scene ${sceneId} must reference fact ${fact.id} in factIds`);
      }
    }
  }

  if (plan.source.kind === 'theme' && plan.facts.length > 0) {
    throw new Error('Theme plans must not declare source facts');
  }
  if (plan.source.kind === 'url') {
    if (plan.facts.length === 0) {
      throw new Error('URL plans must declare at least one traceable source fact');
    }
    for (const scene of plan.scenes) {
      if (scene.factIds.length === 0) {
        throw new Error(`URL scene ${scene.id} must reference at least one source fact`);
      }
    }
  }
};

export const assertContentPlanInput = (
  plan: ContentPlan,
  input: {kind: string; value: string},
): void => {
  if (plan.source.kind !== input.kind || plan.source.value !== input.value) {
    throw new Error(
      `Content plan source ${plan.source.kind}:${plan.source.value} does not match project input ${input.kind}:${input.value}`,
    );
  }
};

// URL 策划的每条事实必须能在已抓取正文中逐字找到，来源 URL 也必须指向该快照。
export const assertContentPlanTraceability = (
  plan: ContentPlan,
  snapshot: PlanSourceSnapshot,
): void => {
  if (plan.source.kind !== 'url') return;
  const sourceUrls = new Set([snapshot.url, snapshot.finalUrl]);
  if (!sourceUrls.has(plan.source.value)) {
    throw new Error(`Content plan source URL is not the captured URL: ${plan.source.value}`);
  }
  const haystack = normalizeText(`${snapshot.title} ${snapshot.text}`);
  for (const fact of plan.facts) {
    if (!sourceUrls.has(fact.sourceUrl)) {
      throw new Error(`Fact ${fact.id} sourceUrl is not the captured URL: ${fact.sourceUrl}`);
    }
    if (!haystack.includes(normalizeText(fact.quote))) {
      throw new Error(`Fact ${fact.id} quote is not present in the captured source text`);
    }
  }
};

// 策划只作为 G1 前的输入，转换结果仍需通过 Film Schema、注册表和素材校验。
// 已有 Film 的音频与未在策划中重声明的素材会被保留，避免重跑策划时静默丢失 BGM/旁白。
export const contentPlanToFilm = (
  plan: ContentPlan,
  options: {id: string; existing?: FilmSpec},
): FilmSpec => {
  const declaredAssetIds = new Set(plan.assets.map((asset) => asset.id));
  const assets = [
    ...plan.assets,
    ...(options.existing?.assets ?? []).filter((asset) => !declaredAssetIds.has(asset.id)),
  ];
  const scenes: SceneSpec[] = plan.scenes.map((scene) => ({
    id: scene.id,
    title: scene.title,
    intent: scene.intent,
    semantic: scene.semantic,
    durationInFrames: Math.round(scene.durationSeconds * plan.output.fps),
    onScreenText: scene.onScreenText,
    narration: scene.narration,
    assetIds: scene.assetIds,
    layout: {
      kind: scene.visual.layoutKind,
      options: {...scene.visual.options, description: scene.visual.description},
    },
    renderer: scene.renderer,
    sceneComponent: scene.sceneComponent,
    motion: scene.motion,
    props: scene.props,
    qa: scene.qa,
  }));

  return {
    schemaVersion: '1.0.0',
    id: options.id,
    title: plan.title,
    genre: plan.genre,
    brief: plan.brief,
    output: plan.output,
    theme: plan.theme,
    assets,
    audio: options.existing?.audio ?? {voice: {segments: []}, sfx: {events: []}},
    scenes,
  };
};
