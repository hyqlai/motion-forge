import {execFile} from 'node:child_process';
import {mkdir, readFile, writeFile, access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {filmSchema, productionStateSchema} from '../core/schema';
import {approveDesign, approveSample, assertRenderAllowed, createProductionState} from '../core/production-state';
import {classifyInput, clockForInput} from '../providers/input';
import {createDraft} from '../providers/draft';
import {fetchWebpage} from '../providers/url';
import {probeAudio} from '../providers/audio';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectsRoot = path.join(projectRoot, 'output', 'projects');

const args = process.argv.slice(2);
const command = args[0];
const flagValues = (name: string): string[] => args
  .map((value, index) => value === name ? args[index + 1] : undefined)
  .filter((value): value is string => Boolean(value));
const flag = (name: string): string | undefined => flagValues(name)[0];

const slugify = (value: string): string => {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
  if (!slug) throw new Error('Please provide --name using letters or numbers');
  return slug;
};

const projectDirectory = (id: string): string => {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error('Invalid project id');
  return path.join(projectsRoot, id);
};

const writeJson = async (file: string, value: unknown): Promise<void> => {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
};

const readJson = async (file: string): Promise<unknown> => {
  return JSON.parse(await readFile(file, 'utf8'));
};

const reviewMarkdown = (film: ReturnType<typeof filmSchema.parse>): string => {
  const rows = film.scenes.map((scene) => {
    const camera = scene.motion.camera?.cardId ?? '无';
    return `| ${scene.id} | ${scene.intent} | ${scene.onScreenText.join('<br>')} | ${scene.layout.kind} | ${scene.motion.primary?.cardId ?? '无'} | ${camera} |`;
  }).join('\n');
  return `# 《${film.title}》G1 分镜与视觉设计确认\n\n- 片种：${film.genre}\n- 目标：${film.brief.goal}\n- 画幅：${film.output.width}×${film.output.height} @ ${film.output.fps}fps\n- 风格：背景 ${film.theme.background}，前景 ${film.theme.foreground}，强调 ${film.theme.accent}\n- 字体：${film.theme.fontFamily}\n\n| 分镜 | 叙事目的 | 实际上屏文字 | 布局 | 主动效 | 运镜 |\n|---|---|---|---|---|---|\n${rows}\n\n确认设计后运行：\n\n\`\`\`bash\nnpm run forge -- approve-design --project ${film.id}\n\`\`\`\n`;
};

const init = async (): Promise<void> => {
  const values = flagValues('--input');
  const input = classifyInput(values, {audioKind: flag('--audio-kind') as 'song' | 'instrumental' | undefined});
  let title = flag('--title');
  let webpage;
  let audio;
  if (input.kind === 'url') {
    webpage = await fetchWebpage(input.value);
    title ??= webpage.title;
  }
  if (input.kind === 'instrumental' || input.kind === 'song') {
    audio = await probeAudio(path.resolve(input.value));
  }
  title ??= input.kind === 'theme' ? input.value : path.basename(input.value, path.extname(input.value));
  const id = slugify(flag('--name') ?? (input.kind === 'url' ? `url-${Date.now()}` : title));
  const directory = projectDirectory(id);
  try {
    await access(directory);
    throw new Error(`Project already exists: ${id}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  await mkdir(directory, {recursive: true});
  const {film, assets} = createDraft(input, {title, durationSeconds: audio?.durationSeconds});
  film.id = id;
  await writeJson(path.join(directory, 'input.json'), {...input, clock: clockForInput(input.kind)});
  await writeJson(path.join(directory, 'brief.json'), film.brief);
  await writeJson(path.join(directory, 'assets.json'), {assets});
  await writeJson(path.join(directory, 'film.json'), film);
  await writeJson(path.join(directory, 'project.json'), createProductionState());
  await writeFile(path.join(directory, 'design-review.md'), reviewMarkdown(film));
  if (webpage) await writeJson(path.join(directory, 'source.json'), webpage);
  if (audio) await writeJson(path.join(directory, 'audio-probe.json'), audio);
  console.log(`Created ${input.kind} draft: ${path.relative(projectRoot, directory)}`);
  console.log('Review design-review.md, then approve G1 before rendering the sample scene.');
};

const updateApproval = async (kind: 'design' | 'sample'): Promise<void> => {
  const id = flag('--project');
  if (!id) throw new Error('--project is required');
  const file = path.join(projectDirectory(id), 'project.json');
  const state = productionStateSchema.parse(await readJson(file));
  const updated = kind === 'design'
    ? approveDesign(state, new Date().toISOString())
    : approveSample(state, new Date().toISOString());
  await writeJson(file, updated);
  console.log(`${kind} approved; status=${updated.status}`);
};

const render = async (): Promise<void> => {
  const id = flag('--project');
  const scope = flag('--scope') as 'sample' | 'film' | undefined;
  if (!id || !scope || !['sample', 'film'].includes(scope)) {
    throw new Error('render requires --project <id> --scope sample|film');
  }
  const directory = projectDirectory(id);
  const film = filmSchema.parse(await readJson(path.join(directory, 'film.json')));
  const state = productionStateSchema.parse(await readJson(path.join(directory, 'project.json')));
  assertRenderAllowed(state, scope);
  const props = scope === 'sample' ? {film, sceneId: film.scenes[0].id} : {film};
  const propsFile = path.join(directory, `render-${scope}-props.json`);
  await writeJson(propsFile, props);
  const output = path.join(directory, `${scope}.mp4`);
  await execFileAsync('npx', [
    'remotion', 'render', 'core/index.ts', scope === 'sample' ? 'SampleScene' : 'Film',
    output, `--props=${propsFile}`, '--concurrency=2',
  ], {cwd: projectRoot, maxBuffer: 10_000_000});
  console.log(`Rendered ${path.relative(projectRoot, output)}`);
};

try {
  if (command === 'init') await init();
  else if (command === 'approve-design') await updateApproval('design');
  else if (command === 'approve-sample') await updateApproval('sample');
  else if (command === 'render') await render();
  else {
    console.log('Usage: npm run forge -- init --input <value> [--input ...] [--audio-kind song|instrumental] [--name id]');
    console.log('       npm run forge -- approve-design|approve-sample --project <id>');
    console.log('       npm run forge -- render --project <id> --scope sample|film');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
