import {spawn} from 'node:child_process';
import {constants} from 'node:fs';
import {access, copyFile, cp, mkdir, readFile, readdir, realpath, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {filmSchema, productionStateSchema, type FilmSpec} from '../core/schema';
import {approveDesign, approveSample, assertRenderAllowed, createProductionState} from '../core/production-state';
import {classifyInput, clockForInput, type ClassifiedInput} from '../providers/input';
import {createDraft} from '../providers/draft';
import {fetchWebpage} from '../providers/url';
import {probeAudio} from '../providers/audio';
import {validateFilm} from './film-validation';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const standaloneMarker = 'motion-forge-project.json';
const templateDirectories = ['core', 'cards', 'providers', 'scenes', 'scripts', 'workbench', 'public', 'examples'];
const templateFiles = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'remotion.config.ts',
  '.gitignore',
  'README.md',
];

const args = process.argv.slice(2);
const command = args[0];
const flagValues = (name: string): string[] => args.flatMap((value, index) => {
  if (value === name) return [args[index + 1]].filter((next): next is string => Boolean(next) && !next.startsWith('--'));
  if (value.startsWith(`${name}=`)) return [value.slice(name.length + 1)].filter(Boolean);
  return [];
});
const flag = (name: string): string | undefined => flagValues(name)[0];

const slugify = (value: string): string => {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
  if (!slug) throw new Error('Please provide --name using letters or numbers');
  return slug;
};

const projectDirectory = (root: string, id: string): string => {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error('Invalid project id');
  return path.join(root, 'output', 'projects', id);
};

const writeJson = async (file: string, value: unknown): Promise<void> => {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
};

const readJson = async (file: string): Promise<unknown> => {
  return JSON.parse(await readFile(file, 'utf8'));
};

const reviewMarkdown = (film: FilmSpec): string => {
  const rows = film.scenes.map((scene) => {
    const camera = scene.motion.camera?.cardId ?? '无';
    return `| ${scene.id} | ${scene.intent} | ${scene.onScreenText.join('<br>')} | ${scene.layout.kind} | ${scene.motion.primary?.cardId ?? '无'} | ${camera} |`;
  }).join('\n');
  return `# 《${film.title}》G1 分镜与视觉设计确认\n\n- 片种：${film.genre}\n- 目标：${film.brief.goal}\n- 画幅：${film.output.width}×${film.output.height} @ ${film.output.fps}fps\n- 风格：背景 ${film.theme.background}，前景 ${film.theme.foreground}，强调 ${film.theme.accent}\n- 字体：${film.theme.fontFamily}\n\n| 分镜 | 叙事目的 | 实际上屏文字 | 布局 | 主动效 | 运镜 |\n|---|---|---|---|---|---|\n${rows}\n\n确认设计后运行：\n\n\`\`\`bash\nnpm run forge -- approve-design --project ${film.id}\n\`\`\`\n`;
};

const assertInputFiles = async (input: ClassifiedInput): Promise<void> => {
  if (input.kind === 'theme' || input.kind === 'url') return;
  await Promise.all(input.values.map(async (value) => {
    const source = path.resolve(value);
    const info = await stat(source).catch(() => {
      throw new Error(`Input asset does not exist: ${source}`);
    });
    if (!info.isFile()) throw new Error(`Input asset is not a file: ${source}`);
  }));
};

const localizeAssets = async (root: string, id: string, film: FilmSpec): Promise<void> => {
  if (film.assets.length === 0) return;
  const assetsDirectory = path.join(root, 'public', 'assets', id);
  await mkdir(assetsDirectory, {recursive: true});
  for (const asset of film.assets) {
    const source = path.resolve(asset.path);
    const extension = path.extname(source).toLowerCase();
    const relativePath = path.posix.join('assets', id, `${asset.id}${extension}`);
    const destination = path.join(assetsDirectory, `${asset.id}${extension}`);
    await copyFile(source, destination, constants.COPYFILE_EXCL);
    asset.source ??= source;
    asset.path = relativePath;
  }
};

const assertStandaloneProject = async (root: string, allowTemplateExample: boolean): Promise<void> => {
  if (root === projectRoot) {
    if (allowTemplateExample) return;
    throw new Error('Refusing to initialize a real project inside the template; use create --dir or --allow-template-example');
  }
  try {
    await access(path.join(root, standaloneMarker));
  } catch {
    throw new Error(`Not a standalone Motion Forge project: ${root}`);
  }
};

const init = async (root: string, options: {allowTemplateExample?: boolean} = {}): Promise<void> => {
  await assertStandaloneProject(root, options.allowTemplateExample ?? false);
  const values = flagValues('--input');
  const input = classifyInput(values, {audioKind: flag('--audio-kind') as 'song' | 'instrumental' | undefined});
  await assertInputFiles(input);
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
  const directory = projectDirectory(root, id);
  try {
    await access(directory);
    throw new Error(`Project already exists: ${id}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const {film} = createDraft(input, {title, durationSeconds: audio?.durationSeconds});
  film.id = id;
  await localizeAssets(root, id, film);
  if ((input.kind === 'instrumental' || input.kind === 'song') && film.assets[0]) {
    film.audio.bgm = {src: film.assets[0].path, volume: 1, loop: false};
  }
  await mkdir(directory, {recursive: true});
  await writeJson(path.join(directory, 'input.json'), {...input, clock: clockForInput(input.kind)});
  await writeJson(path.join(directory, 'brief.json'), film.brief);
  await writeJson(path.join(directory, 'assets.json'), {assets: film.assets});
  await writeJson(path.join(directory, 'film.json'), film);
  await writeJson(path.join(directory, 'project.json'), createProductionState());
  await writeFile(path.join(directory, 'design-review.md'), reviewMarkdown(film));
  if (webpage) await writeJson(path.join(directory, 'source.json'), webpage);
  if (audio) await writeJson(path.join(directory, 'audio-probe.json'), audio);
  console.log(`Created ${input.kind} draft: ${directory}`);
  console.log('Review design-review.md, then approve G1 before rendering the sample scene.');
};

const create = async (): Promise<void> => {
  const value = flag('--dir');
  if (!value || !path.isAbsolute(value)) throw new Error('create requires an absolute --dir path');
  const targetRoot = path.resolve(value);
  const relative = path.relative(projectRoot, targetRoot);
  if (relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))) {
    throw new Error('The standalone project must be outside the template directory');
  }
  const entries = await readdir(targetRoot).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
  if (entries && entries.length > 0) throw new Error(`Target directory is not empty: ${targetRoot}`);
  await mkdir(targetRoot, {recursive: true});
  const [realTemplateRoot, realTargetRoot] = await Promise.all([realpath(projectRoot), realpath(targetRoot)]);
  const realRelative = path.relative(realTemplateRoot, realTargetRoot);
  if (realRelative === '' || (!realRelative.startsWith(`..${path.sep}`) && realRelative !== '..' && !path.isAbsolute(realRelative))) {
    throw new Error('The standalone project must not resolve inside the template directory');
  }

  // 项目必须持有真实运行时副本，生成后不再从模板目录解析任何代码或素材。
  for (const directory of templateDirectories) {
    await cp(path.join(projectRoot, directory), path.join(targetRoot, directory), {
      recursive: true,
      force: false,
      errorOnExist: true,
    });
  }
  for (const file of templateFiles) {
    await copyFile(path.join(projectRoot, file), path.join(targetRoot, file), constants.COPYFILE_EXCL);
  }
  await writeJson(path.join(targetRoot, standaloneMarker), {schemaVersion: '1.0.0'});
  await init(targetRoot);
  console.log(`Standalone project ready. Run: cd ${targetRoot}`);
};

const updateApproval = async (kind: 'design' | 'sample'): Promise<void> => {
  const id = flag('--project');
  if (!id) throw new Error('--project is required');
  const file = path.join(projectDirectory(projectRoot, id), 'project.json');
  const state = productionStateSchema.parse(await readJson(file));
  const updated = kind === 'design'
    ? approveDesign(state, new Date().toISOString())
    : approveSample(state, new Date().toISOString());
  await writeJson(file, updated);
  console.log(`${kind} approved; status=${updated.status}`);
};

const runRemotion = async (remotionArgs: string[]): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const child = spawn('npx', remotionArgs, {cwd: projectRoot, stdio: 'inherit'});
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Remotion render failed (${signal ?? `exit ${code}`})`));
    });
  });
};

const render = async (): Promise<void> => {
  const id = flag('--project');
  const scope = flag('--scope') as 'sample' | 'film' | undefined;
  if (!id || !scope || !['sample', 'film'].includes(scope)) {
    throw new Error('render requires --project <id> --scope sample|film');
  }
  const directory = projectDirectory(projectRoot, id);
  const film = filmSchema.parse(await readJson(path.join(directory, 'film.json')));
  const state = productionStateSchema.parse(await readJson(path.join(directory, 'project.json')));
  assertRenderAllowed(state, scope);
  await validateFilm(film, {publicRoot: path.join(projectRoot, 'public')});
  const props = scope === 'sample' ? {film, sceneId: film.scenes[0].id} : {film};
  const propsFile = path.join(directory, `render-${scope}-props.json`);
  await writeJson(propsFile, props);
  const output = path.join(directory, `${scope}.mp4`);
  const remotionArgs = [
    'remotion', 'render', 'core/index.ts', scope === 'sample' ? 'SampleScene' : 'Film',
    output, `--props=${propsFile}`, '--concurrency=2',
  ];
  const browserExecutable = flag('--browser-executable');
  const gl = flag('--gl') ?? 'swangle';
  if (browserExecutable) remotionArgs.push(`--browser-executable=${browserExecutable}`);
  remotionArgs.push(`--gl=${gl}`);
  await runRemotion(remotionArgs);
  console.log(`Rendered ${output}`);
};

try {
  if (command === 'create') await create();
  else if (command === 'init') await init(projectRoot, {allowTemplateExample: args.includes('--allow-template-example')});
  else if (command === 'approve-design') await updateApproval('design');
  else if (command === 'approve-sample') await updateApproval('sample');
  else if (command === 'render') await render();
  else {
    console.log('Usage: npm run forge -- create --dir /absolute/project --input <value> [--input ...] [--audio-kind song|instrumental] [--name id]');
    console.log('       npm run forge -- approve-design|approve-sample --project <id>');
    console.log('       npm run forge -- render --project <id> --scope sample|film [--browser-executable path] [--gl swangle|angle|swiftshader]');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
