import {mkdir, readFile, readdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.dirname(projectRoot);

type Source = {
  id: string;
  directory: string;
  categoryFromDirectory: boolean;
};

type InventoryCard = {
  id: string;
  slug: string;
  source: string;
  sourcePath: string;
  category: string;
  summary: string;
  usage: string;
  duration: string;
  energy: string;
  inputs: string;
  semantics: string;
  implementation: string;
  status: 'pending' | 'ready';
  targetId?: string;
  evidence?: string[];
};

type ReadyRecord = Record<string, {targetId: string; evidence?: string[]}>;

const sources: Source[] = [
  {
    id: 'video-shotcraft',
    directory: path.join(sourceRoot, 'video-shotcraft', 'references', 'shots'),
    categoryFromDirectory: true,
  },
  {
    id: 'video-talkcraft',
    directory: path.join(sourceRoot, 'video-talkcraft', 'references', 'cards'),
    categoryFromDirectory: false,
  },
  {
    id: 'brewreel',
    directory: path.join(sourceRoot, 'brewreel', 'docs', 'shots'),
    categoryFromDirectory: false,
  },
];

const walk = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, {withFileTypes: true});
  const files = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  }));
  return files.flat();
};

const frontmatter = (source: string): Record<string, string> => {
  if (!source.startsWith('---\n')) return {};
  const end = source.indexOf('\n---', 4);
  if (end < 0) return {};
  const result: Record<string, string> = {};
  for (const line of source.slice(4, end).split('\n')) {
    const separator = line.indexOf(':');
    if (separator > 0) {
      result[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
    }
  }
  return result;
};

const readSource = async (source: Source): Promise<InventoryCard[]> => {
  const files = (await walk(source.directory)).filter((file) => {
    return file.endsWith('.md') && !file.endsWith('.en.md') && !file.endsWith('README.md') && !file.endsWith('ATTRIBUTION.md');
  });

  return Promise.all(files.map(async (file): Promise<InventoryCard> => {
    const raw = await readFile(file, 'utf8');
    const meta = frontmatter(raw);
    const slug = meta.name ?? path.basename(file, '.md');
    const relative = path.relative(source.directory, file);
    const category = source.categoryFromDirectory
      ? relative.split(path.sep)[0]
      : meta['类别'] ?? 'shot';
    return {
      id: `${source.id}/${slug}`,
      slug,
      source: source.id,
      sourcePath: path.relative(projectRoot, file),
      category,
      summary: meta['一句话'] ?? '',
      usage: meta['适用'] ?? '',
      duration: meta['时长'] ?? '',
      energy: meta['能量'] ?? '',
      inputs: meta['输入'] ?? '',
      semantics: meta['语义'] ?? '',
      implementation: meta['代码'] ?? '',
      status: 'pending',
    };
  }));
};

const cards = (await Promise.all(sources.map(readSource))).flat()
  .sort((a, b) => a.id.localeCompare(b.id));
const outputDirectory = path.join(projectRoot, 'docs', 'migration');
await mkdir(outputDirectory, {recursive: true});
const ready = JSON.parse(
  await readFile(path.join(outputDirectory, 'ready.json'), 'utf8'),
) as ReadyRecord;
for (const card of cards) {
  const record = ready[card.id];
  if (record) {
    card.status = 'ready';
    card.targetId = record.targetId;
    card.evidence = record.evidence;
  }
}
await writeFile(
  path.join(outputDirectory, 'cards.json'),
  `${JSON.stringify({schemaVersion: '1.0.0', cards}, null, 2)}\n`,
);

const counts = cards.reduce<Record<string, number>>((result, card) => {
  result[card.source] = (result[card.source] ?? 0) + 1;
  return result;
}, {});
const readyCount = cards.filter((card) => card.status === 'ready').length;
const summary = Object.entries(counts)
  .map(([source, count]) => `| ${source} | ${count} |`)
  .join('\n');
const rows = cards.map((card) => {
  const usage = (card.usage || card.summary || '待补充').replaceAll('|', '\\|').replaceAll('\n', ' ');
  const status = card.targetId ? `${card.status} → ${card.targetId}` : card.status;
  return `| ${card.id} | ${card.category} | ${usage} | ${status} |`;
}).join('\n');
const markdown = `# 动效卡迁移清单\n\n本文件由 \`npm run cards:inventory\` 生成，请勿手改。pending 表示仅盘点，ready 表示已按契约迁移并有验收证据。\n\n| 来源 | 卡片数 |\n|---|---:|\n${summary}\n| **合计** | **${cards.length}** |\n| **已验收** | **${readyCount}** |\n\n| 卡片 | 类别 | 使用场景 | 状态 |\n|---|---|---|---|\n${rows}\n`;
await writeFile(path.join(outputDirectory, 'inventory.md'), markdown);
console.log(`Inventoried ${cards.length} cards (${readyCount} ready): ${JSON.stringify(counts)}`);
