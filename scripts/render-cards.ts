import {execFile} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {cardDefinitions} from '../cards/registry';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv.find((arg) => arg.startsWith('--only='))?.slice('--only='.length).split(',');
const cards = cardDefinitions.filter((card) => {
  if (!card.manifest.migration) return false;
  return !only || only.includes(card.manifest.id) || only.includes(card.manifest.migration?.source ?? '');
});

for (const card of cards) {
  const id = card.manifest.id;
  const compositionId = `Card-${id.replace('/', '-')}`;
  const directory = path.join(projectRoot, 'output', 'card-renders', id);
  await mkdir(directory, {recursive: true});
  const video = path.join(directory, 'preview.mp4');
  await execFileAsync('npx', [
    'remotion', 'render', 'core/index.ts', compositionId, video, '--concurrency=2',
  ], {cwd: projectRoot, maxBuffer: 12_000_000});
  for (const frame of card.manifest.qa.frames) {
    await execFileAsync('npx', [
      'remotion', 'still', 'core/index.ts', compositionId,
      path.join(directory, `frame-${frame}.png`), `--frame=${frame}`,
    ], {cwd: projectRoot, maxBuffer: 8_000_000});
  }
  console.log(`Rendered ${id}: preview + ${card.manifest.qa.frames.length} QA frames`);
}

if (cards.length === 0) console.log('No migrated cards selected');
