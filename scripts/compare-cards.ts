import {execFile} from 'node:child_process';
import {copyFile, mkdir, readdir, readFile, writeFile, access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {cardDefinitions} from '../cards/registry';

// 来源对照渲染：把迁移卡与来源实现按归一化时间渲染到对应帧，并排拼图供人工目检。
// 左边 = 来源实现，右边 = 迁移实现；运动曲线（时序/缓动/幅度）必须一致，配色可随主题不同。
//
// 用法：npm run cards:compare -- [--only=<id,...>]
// 产物：output/card-compare/<kind>/<name>/compare-frame-<N>.png 与 compare.png（竖排总览）

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// 来源仓库与本项目同级；交付包不携带迁移来源仓库。
const sourcesRoot = path.resolve(projectRoot, '..');
const stagingRoot = path.join(projectRoot, 'output', 'card-compare', '_staging');
const entriesRoot = path.join(projectRoot, 'output', 'card-compare', '_entries');
const outRoot = path.join(projectRoot, 'output', 'card-compare');

const only = process.argv.find((arg) => arg.startsWith('--only='))?.slice('--only='.length).split(',');

// video-shotcraft 的来源不是自包含卡：命名导出组件 + 时长常量，1920×1080@30，依赖 demos/_fixtures
const shotcraftSources: Record<string, {component: string; durationExport: string; durationInFrames: number; width: number; height: number}> = {
  'video-shotcraft/demos/typography/flying-words/FlyingWords.tsx': {component: 'FlyingWords', durationExport: 'FLYING_WORDS_DURATION', durationInFrames: 180, width: 1920, height: 1080},
  'video-shotcraft/demos/ui-entrance/card-stack/CardStack.tsx': {component: 'CardStack', durationExport: 'CARD_STACK_DURATION', durationInFrames: 150, width: 1920, height: 1080},
};

const brewParams: Record<string, Record<string, unknown>> = {
  hook: {visual: 'stat', text: '3 分钟搭建全自动视频流水线', badge: '代码生成视频'},
  chat: {messages: [{from: 'user', text: '能否把已有动效卡迁移过来？'}, {from: 'ai', text: '已迁移 252 张卡片，零偏差。'}]},
  phone: {src: 'textures/live/card1.png', focus: [{area: 'middle', label: '核心界面'}]},
  mockApp: {kind: 'dashboard', title: '今日数据', stat: {label: '交付率', value: '98%'}, items: [{text: '完成率', value: '98%'}]},
  meter: {value: 98, label: '系统保真度'},
  compare: {left: {label: '传统手工', items: ['反复确认', '手工对帧']}, right: {label: '代码驱动', items: ['批量导出', '参数化微调']}},
  counter: {to: 252, label: '已迁移全量动效卡'},
  dataChart: {title: '视频生产效率', takeaway: '提升 10 倍交付速度', chartType: 'bar', data: [{label: '手工', value: 10}, {label: '模板', value: 35}, {label: '代码', value: 95}], refs: ['2026 行业基准']},
  features: {items: [{icon: 'zap', title: '解耦分镜', desc: '独立修改任意分镜'}, {icon: 'cpu', title: '多技术路线', desc: '支持 SVG / Canvas / Three.js'}, {icon: 'shield', title: '零依赖本地化', desc: '纯代码确定性渲染'}]},
  steps: {items: [{title: '输入链接或音乐', desc: '提取节奏与文案'}, {title: '分镜规划', desc: '匹配最佳动效卡'}, {title: '一键渲染', desc: '生成专业成片'}]},
  quickList: {items: [{text: '故事短片'}, {text: '科普视频'}, {text: '音乐故事'}, {text: '产品宣传'}]},
  endCard: {brand: 'Motion Forge', slogan: '让代码描绘每一个镜头'},
  photoShot: {layout: 'hero', media: [{source: 'merchant', tag: '实拍', src: 'textures/live/card1.png'}]},
  priceCard: {layout: 'card', items: [{itemId: 'pkg1', name: '自用专业版', price: '199', unit: '元/年'}]},
  storeCard: {layout: 'card', name: 'Motion Studio', landmark: '上海科技园区'},
  reviewCard: {quotes: [{user: '开发者', text: '镜头运动和节奏感非常精准'}], evidence: '工业级动效标准'},
  factSheet: {layout: 'list', title: '核心技术指标', rows: [{key: '渲染引擎', val: 'Remotion 4.0'}, {key: '总动效卡', val: '252 张'}]},
  credCard: {layout: 'person', name: '王工', role: '架构师', years: 10, creds: ['系统设计', '全自动化']},
  beforeAfter: {before: 'textures/live/card1.png', after: 'textures/live/card2.png', consent: true, retouched: true, subVertical: false},
};

type SourceShape = {durationInFrames: number; fps: number; width: number; height: number};

// 把来源文件复制进项目内 staging，保持相对目录结构，让 remotion 的模块解析落在本项目的 node_modules 上
const stageSource = async (sourcePath: string): Promise<string> => {
  if (sourcePath.startsWith('brewreel/')) {
    const slug = path.basename(sourcePath, path.extname(sourcePath));
    return path.join(projectRoot, 'cards', '_brewreel', 'shots', `${slug}.tsx`);
  }
  const sourceFile = path.join(sourcesRoot, sourcePath);
  const sourceDir = path.dirname(sourceFile);
  const stagedDir = path.join(stagingRoot, path.dirname(sourcePath));
  await mkdir(stagedDir, {recursive: true});
  const files = await readdir(sourceDir);
  for (const f of files) {
    if (f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.json')) {
      await copyFile(path.join(sourceDir, f), path.join(stagedDir, f));
    }
  }
  return path.join(stagingRoot, sourcePath);
};

// 动态通过 tsx 求值来源导出的 meta，避免静态正则漏掉表达式/换行/计算逻辑
const evalTalkcraftMeta = async (staged: string): Promise<SourceShape> => {
  const code = `import {meta} from ${JSON.stringify(staged)}; console.log(JSON.stringify(meta));`;
  const {stdout} = await execFileAsync('npx', ['tsx', '-e', code], {
    cwd: projectRoot,
    env: {...process.env, NODE_PATH: path.join(projectRoot, 'node_modules')},
    maxBuffer: 4_000_000,
  });
  return JSON.parse(stdout.trim()) as SourceShape;
};

// 动态分析 video-shotcraft 组件导出与时长
const evalShotcraftSource = async (staged: string): Promise<{component: string; durationInFrames: number; width: number; height: number}> => {
  const code = await readFile(staged, 'utf8');
  const compMatch = code.match(/export const (\w+):\s*React\.FC/) || code.match(/export function (\w+)/);
  if (!compMatch) throw new Error(`Cannot find exported component in ${staged}`);
  const compName = compMatch[1];
  const durMatch = code.match(/export const (\w+_DURATION|\w+_DUR)\s*=/);
  let durationInFrames = 120;
  if (durMatch) {
    const durName = durMatch[1];
    const evalCode = `import {${durName}} from ${JSON.stringify(staged)}; console.log(${durName});`;
    try {
      const {stdout} = await execFileAsync('npx', ['tsx', '-e', evalCode], {
        cwd: projectRoot,
        env: {...process.env, NODE_PATH: path.join(projectRoot, 'node_modules')},
        maxBuffer: 4_000_000,
      });
      durationInFrames = Math.round(Number(stdout.trim())) || 120;
    } catch {
      durationInFrames = 120;
    }
  }
  return {component: compName, durationInFrames, width: 1920, height: 1080};
};

const writeEntry = async (cardId: string, staged: string, sourcePath: string, durationInFrames = 75): Promise<{entry: string; shape: SourceShape}> => {
  let body: string;
  let shape: SourceShape;
  if (sourcePath.startsWith('video-shotcraft/')) {
    const shotcraft = await evalShotcraftSource(staged);
    shape = {durationInFrames: shotcraft.durationInFrames, fps: 30, width: shotcraft.width, height: shotcraft.height};
    body = `import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {${shotcraft.component} as Component} from ${JSON.stringify(staged)};
const Root: React.FC = () => (
  <Composition id="Source" component={Component} durationInFrames={${shotcraft.durationInFrames}} fps={30} width={${shotcraft.width}} height={${shotcraft.height}} />
);
registerRoot(Root);
`;
  } else if (sourcePath.startsWith('brewreel/')) {
    const slug = path.basename(sourcePath, path.extname(sourcePath));
    const paramObj = brewParams[slug] ?? {};
    shape = {durationInFrames, fps: 30, width: 1080, height: 1920};
    body = `import React from 'react';
import {Composition, registerRoot, useCurrentFrame} from 'remotion';
import ShotComponent from ${JSON.stringify(staged)};
const defaultParams = ${JSON.stringify(paramObj)};
const SourceWrapper: React.FC = () => {
  const frame = useCurrentFrame();
  const dur = ${shape.durationInFrames} / 30;
  const t = (frame / 30) % dur;
  const mockMeta = {title: 'Brand Story', product: 'Motion Forge', theme: 'aurora', aspect: '9:16', industry: 'tech'};
  return <ShotComponent params={defaultParams} t={t} dur={dur} beat={0.5} index={0} isLast={false} mood={0.85} meta={mockMeta} />;
};
const Root: React.FC = () => (
  <Composition id="Source" component={SourceWrapper} durationInFrames={${shape.durationInFrames}} fps={30} width={1080} height={1920} />
);
registerRoot(Root);
`;
  } else {
    shape = await evalTalkcraftMeta(staged);
    body = `import React from 'react';
import {Composition, registerRoot} from 'remotion';
import Component, {meta} from ${JSON.stringify(staged)};
const Root: React.FC = () => (
  <Composition id="Source" component={Component} durationInFrames={meta.durationInFrames} fps={meta.fps} width={meta.width} height={meta.height} />
);
registerRoot(Root);
`;
  }
  const entry = path.join(entriesRoot, `${cardId.replace('/', '-')}.tsx`);
  await mkdir(entriesRoot, {recursive: true});
  await writeFile(entry, body);
  return {entry, shape};
};

const run = async (command: string, args: string[]): Promise<void> => {
  await execFileAsync(command, args, {cwd: projectRoot, maxBuffer: 12_000_000});
};

// shotcraft 依赖的 fixtures 和 textures 只需整体复制一次
const stageShotcraftFixtures = async (): Promise<void> => {
  const from = path.join(sourcesRoot, 'video-shotcraft', 'demos', '_fixtures');
  const to = path.join(stagingRoot, 'video-shotcraft', 'demos', '_fixtures');
  await mkdir(to, {recursive: true});
  for (const file of await readdir(from)) {
    if (file.endsWith('.tsx')) await copyFile(path.join(from, file), path.join(to, file));
  }
  const fromTex = path.join(sourcesRoot, 'video-shotcraft', 'demos', '_textures');
  const toTex = path.join(stagingRoot, 'video-shotcraft', 'demos', '_textures');
  await mkdir(toTex, {recursive: true});
  for (const file of await readdir(fromTex)) {
    await copyFile(path.join(fromTex, file), path.join(toTex, file));
  }
};

const cards = cardDefinitions.filter((card) => {
  if (!card.manifest.migration) return false;
  return !only || only.includes(card.manifest.id) || only.includes(card.manifest.migration?.source ?? '');
});

if (cards.some((card) => card.manifest.migration?.sourcePath.startsWith('video-shotcraft/'))) {
  await stageShotcraftFixtures();
}

let compared = 0;
const skipped: string[] = [];

for (const card of cards) {
  const {manifest} = card;
  const id = manifest.id;
  const migration = manifest.migration!;
  const oursDir = path.join(projectRoot, 'output', 'card-renders', id);
  // 迁移侧的 QA 帧必须先由 cards:render 产出，对照才有意义
  try {
    await Promise.all(manifest.qa.frames.map((frame) => access(path.join(oursDir, `frame-${frame}.png`))));
  } catch {
    skipped.push(id);
    continue;
  }

  const outDir = path.join(outRoot, id);
  await mkdir(outDir, {recursive: true});
  const staged = await stageSource(migration.sourcePath);
  const {entry, shape} = await writeEntry(id, staged, migration.sourcePath, manifest.timing.defaultInFrames);

  // 归一化时间对齐：我们的第 f 帧对应来源的 round(f/(Do-1) * (Ds-1)) 帧
  const oursDuration = manifest.timing.defaultInFrames;
  const pairs = manifest.qa.frames.map((frame) => ({
    ours: frame,
    source: Math.max(0, Math.min(shape.durationInFrames - 1, Math.round((frame / (oursDuration - 1)) * (shape.durationInFrames - 1)))),
  }));

  const bundleDir = path.join(outRoot, '_bundles', id.replace('/', '-'));
  await mkdir(bundleDir, {recursive: true});
  await run('npx', ['remotion', 'bundle', entry, `--out-dir=${bundleDir}`]);

  const compares: string[] = [];
  for (const pair of pairs) {
    const sourceFrame = path.join(outDir, `source-frame-${pair.ours}.png`);
    await run('npx', ['remotion', 'still', bundleDir, 'Source', sourceFrame, `--frame=${pair.source}`]);
    const compare = path.join(outDir, `compare-frame-${pair.ours}.png`);
    // 左来源右迁移，统一缩到 960×540 再横拼
    await run('ffmpeg', [
      '-y', '-i', sourceFrame, '-i', path.join(oursDir, `frame-${pair.ours}.png`),
      '-filter_complex', `[0:v]scale=960:540[a];[1:v]scale=960:540[b];[a][b]hstack=inputs=2[out]`,
      '-map', '[out]', compare,
    ]);
    compares.push(compare);
  }
  // 竖排总览图，一张看完所有 QA 帧对照
  const inputs = compares.flatMap((file) => ['-i', file]);
  await run('ffmpeg', [
    '-y', ...inputs,
    '-filter_complex', `${compares.map((_, i) => `[${i}:v]`).join('')}vstack=inputs=${compares.length}[out]`,
    '-map', '[out]', path.join(outDir, 'compare.png'),
  ]);
  compared += 1;
  console.log(`Compared ${id} ← ${migration.source}（${pairs.map((p) => `${p.ours}↔${p.source}`).join(', ')}）`);
}

console.log(`\nCompared ${compared} cards.`);
if (skipped.length > 0) {
  console.log(`Skipped（缺迁移侧 QA 帧，先跑 cards:render）：${skipped.join(', ')}`);
}
if (cards.length === 0) console.log('No migrated cards selected');
