import {access, mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  assertContentPlanInput,
  assertContentPlanStructure,
  assertContentPlanTraceability,
  contentPlanSchema,
  contentPlanToFilm,
  planSourceSnapshotSchema,
  type ContentPlan,
} from '../core/content-plan';
import {createProductionState, resetForDesignRevision} from '../core/production-state';
import {filmSchema, productionStateSchema, type FilmSpec} from '../core/schema';
import {buildContentPlanGuide, buildContentPlanTemplate} from '../providers/content-plan-template';
import {classifyInput, clockForInput, type ClassifiedInput} from '../providers/input';
import {fetchWebpage, type WebpageSnapshot} from '../providers/url';
import {designReviewMarkdown} from './design-review';
import {validateFilm} from './film-validation';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const standaloneMarker = 'motion-forge-project.json';

const slugify = (value: string): string => {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
  if (!slug) throw new Error('Please provide --name using letters or numbers');
  return slug;
};

const assertProjectId = (id: string): void => {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error('Invalid project id');
};

const projectDirectory = (root: string, id: string): string => path.join(root, 'output', 'projects', id);

const writeJson = async (file: string, value: unknown): Promise<void> => {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
};

const readJson = async (file: string): Promise<unknown> => JSON.parse(await readFile(file, 'utf8'));

const readOptionalJson = async (file: string): Promise<unknown | undefined> => {
  try {
    return await readJson(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
};

const assertStandaloneProject = async (root: string, allowTemplateExample: boolean): Promise<void> => {
  try {
    await access(path.join(root, standaloneMarker));
    return;
  } catch {
    // 继续判断是否为模板目录
  }
  if (root === projectRoot) {
    if (allowTemplateExample) return;
    throw new Error('Refusing to write planning files inside the template; use create --dir or --allow-template-example');
  }
  throw new Error(`Not a standalone Motion Forge project: ${root}`);
};

const formatZodError = (error: unknown, label: string): Error => {
  if (error && typeof error === 'object' && 'issues' in error) {
    const issues = (error as {issues: {path: (string | number)[]; message: string}[]}).issues;
    const details = issues.map((issue) => `- ${issue.path.join('.') || '(root)'}: ${issue.message}`).join('\n');
    return new Error(`${label}:\n${details}`);
  }
  return error instanceof Error ? error : new Error(String(error));
};

const readProjectInput = async (directory: string): Promise<ClassifiedInput> => {
  const raw = await readOptionalJson(path.join(directory, 'input.json'));
  if (!raw || typeof raw !== 'object') {
    throw new Error('Project input.json not found; initialize the project first or pass --input');
  }
  const input = raw as Partial<ClassifiedInput>;
  if (!input.kind || !input.value) throw new Error('Project input.json is invalid');
  return {
    kind: input.kind,
    value: input.value,
    values: Array.isArray(input.values) && input.values.length > 0 ? input.values : [input.value],
  };
};

const readSourceSnapshot = async (directory: string): Promise<WebpageSnapshot> => {
  const raw = await readOptionalJson(path.join(directory, 'source.json'));
  if (!raw) throw new Error('Project source.json not found; URL planning requires the captured source record');
  return planSourceSnapshotSchema.parse(raw);
};

export type PlanningWorkspaceOptions = {
  root: string;
  projectId?: string;
  values: string[];
  name?: string;
  title?: string;
  allowTemplateExample?: boolean;
};

export const createPlanningWorkspace = async (options: PlanningWorkspaceOptions): Promise<void> => {
  await assertStandaloneProject(options.root, options.allowTemplateExample ?? false);

  let id: string;
  let directory: string;
  let input: ClassifiedInput;
  let snapshot: WebpageSnapshot | undefined;
  let sourceRecord: (WebpageSnapshot & {capturedAt?: string}) | undefined;
  let shouldWriteSource = false;

  if (options.projectId) {
    id = options.projectId;
    assertProjectId(id);
    directory = projectDirectory(options.root, id);
    input = await readProjectInput(directory);
    if (input.kind !== 'theme' && input.kind !== 'url') {
      throw new Error(`Content planning only supports theme or URL inputs, received ${input.kind}`);
    }
    if (input.kind === 'url') {
      snapshot = await readSourceSnapshot(directory);
      sourceRecord = snapshot;
      const capturedUrls = new Set([snapshot.url, snapshot.finalUrl]);
      if (!capturedUrls.has(input.value)) {
        throw new Error(`Project input URL does not match the captured source.json: ${input.value}`);
      }
    }
  } else {
    if (options.values.length === 0) throw new Error('plan requires --input <theme-or-url> or --project <id>');
    input = classifyInput(options.values);
    if (input.kind !== 'theme' && input.kind !== 'url') {
      throw new Error(`Content planning only supports theme or URL inputs, received ${input.kind}`);
    }
    if (input.kind === 'url') {
      snapshot = await fetchWebpage(input.value);
      sourceRecord = {...snapshot, capturedAt: new Date().toISOString()};
      shouldWriteSource = true;
    }
    id = slugify(options.name ?? `${input.kind}-${Date.now()}`);
    directory = projectDirectory(options.root, id);
    const existing = await readOptionalJson(path.join(directory, 'input.json'));
    if (existing) throw new Error(`Project already exists: ${id}`);
  }

  const title = options.title ?? snapshot?.title ?? input.value;
  await mkdir(directory, {recursive: true});
  if (!options.projectId) {
    await writeJson(path.join(directory, 'input.json'), {
      ...input,
      clock: clockForInput(input.kind),
    });
  }
  if (shouldWriteSource && sourceRecord) {
    await writeJson(path.join(directory, 'source.json'), sourceRecord);
  }

  const template = buildContentPlanTemplate({input, title, snapshot});
  const guide = buildContentPlanGuide({input, title, projectId: id, snapshot});
  await writeJson(path.join(directory, 'content-plan.template.json'), template);
  await writeFile(path.join(directory, 'content-plan.md'), guide);

  console.log(`Created content plan workspace: ${directory}`);
  console.log('Ask the agent to fill content-plan.json using its own LLM (no external LLM API).');
  console.log(`Then run: npm run forge -- apply-plan --project ${id}`);
};

export type ApplyContentPlanOptions = {
  root: string;
  projectId: string;
  file?: string;
  allowTemplateExample?: boolean;
};

export const applyContentPlan = async (options: ApplyContentPlanOptions): Promise<void> => {
  await assertStandaloneProject(options.root, options.allowTemplateExample ?? false);
  if (!options.projectId) throw new Error('apply-plan requires --project <id>');
  assertProjectId(options.projectId);
  const directory = projectDirectory(options.root, options.projectId);
  const planFile = options.file
    ? (path.isAbsolute(options.file) ? options.file : path.resolve(directory, options.file))
    : path.join(directory, 'content-plan.json');

  let plan: ContentPlan;
  try {
    plan = contentPlanSchema.parse(await readJson(planFile));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Content plan not found: ${planFile}`);
    }
    throw formatZodError(error, 'Invalid content plan');
  }

  assertContentPlanStructure(plan);
  const input = await readProjectInput(directory);
  assertContentPlanInput(plan, input);

  let snapshot: WebpageSnapshot | undefined;
  if (plan.source.kind === 'url') {
    snapshot = await readSourceSnapshot(directory);
    assertContentPlanTraceability(plan, snapshot);
  }

  // 只有全部策划约束、Film Schema、注册表和素材校验都通过后才写 film.json。
  const existingFilmRaw = await readOptionalJson(path.join(directory, 'film.json'));
  let existingFilm: FilmSpec | undefined;
  if (existingFilmRaw !== undefined) {
    try {
      existingFilm = filmSchema.parse(existingFilmRaw);
    } catch (error) {
      throw formatZodError(error, 'Existing film.json is invalid; refusing to apply to avoid losing audio/assets');
    }
  }
  const film = contentPlanToFilm(plan, {id: options.projectId, existing: existingFilm});
  await validateFilm(film, {publicRoot: path.join(options.root, 'public')});

  const stateFile = path.join(directory, 'project.json');
  const previous = await readOptionalJson(stateFile);
  const state = previous === undefined ? undefined : productionStateSchema.parse(previous);
  const hadApproval = state !== undefined && state.status !== 'design-review';
  const nextState = state === undefined
    ? createProductionState()
    : hadApproval
      ? resetForDesignRevision(state, `内容策划 ${path.basename(planFile)} 应用后，原 G1/G2 审批失效`)
      : state;

  await writeJson(path.join(directory, 'film.json'), film);
  await writeJson(path.join(directory, 'brief.json'), film.brief);
  await writeJson(path.join(directory, 'assets.json'), {assets: film.assets});
  await writeJson(stateFile, nextState);

  const review = designReviewMarkdown(film, {
    source: plan.source,
    clock: plan.clock,
    facts: plan.facts,
    narrativeArc: plan.narrativeArc,
  });
  await writeFile(path.join(directory, 'design-review.md'), review);

  console.log(`Applied content plan: ${planFile}`);
  console.log(`Film IR: ${path.join(directory, 'film.json')} (${film.scenes.length} scenes, ${film.scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0)} frames)`);
  if (hadApproval) {
    console.log('Existing approval was reset: project status is design-review and G1/G2 must be repeated.');
  }
  console.log('Review design-review.md, then wait for explicit user approval before running approve-design.');
};
