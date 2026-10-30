import {access, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {cardDefinitions} from '../cards/registry';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const onlyArgument = process.argv.find((arg) => arg.startsWith('--only='));
if (!onlyArgument) throw new Error('Visual approval requires --only=<card-id>[,<card-id>]');
const only = onlyArgument.slice('--only='.length).split(',');
const cards = cardDefinitions.filter((card) => only.includes(card.manifest.id));
if (cards.length !== only.length) throw new Error('Some requested cards are not registered');

const readyPath = path.join(projectRoot, 'docs', 'migration', 'ready.json');
const ready = JSON.parse(await readFile(readyPath, 'utf8')) as Record<string, {
  targetId: string;
  approvedAt: string;
  evidence: string[];
}>;

for (const card of cards) {
  const {manifest} = card;
  if (!manifest.migration) throw new Error(`Not a migrated card: ${manifest.id}`);
  const directory = path.join(projectRoot, 'output', 'card-renders', manifest.id);
  const evidence = [
    path.join(directory, 'preview.mp4'),
    ...manifest.qa.frames.map((frame) => path.join(directory, `frame-${frame}.png`)),
  ];
  // 只有完整产物存在时才能写 ready，避免把渲染失败误记为迁移完成。
  await Promise.all(evidence.map((file) => access(file)));
  const manifestPath = path.join(projectRoot, 'cards', manifest.kind, manifest.id.split('/')[1], 'card.json');
  const raw = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>;
  raw.migration = {...manifest.migration, status: 'ready'};
  await writeFile(manifestPath, `${JSON.stringify(raw, null, 2)}\n`);
  ready[manifest.migration.source] = {
    targetId: manifest.id,
    approvedAt: new Date().toISOString(),
    evidence: evidence.map((file) => path.relative(projectRoot, file)),
  };
  console.log(`Approved ${manifest.migration.source} → ${manifest.id}`);
}
await writeFile(readyPath, `${JSON.stringify(ready, null, 2)}\n`);
