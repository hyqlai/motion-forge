import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {sampleFilm} from '../examples/theme-demo/film';
import {filmSchema} from '../core/schema';
import {compileTimeline} from '../core/timeline';
import {approveDesign, approveSample, assertRenderAllowed, createProductionState} from '../core/production-state';
import {classifyInput} from '../providers/input';
import {validateFilm} from './film-validation';

const args = process.argv.slice(2);
const projectFlag = args.indexOf('--project');
const projectId = projectFlag >= 0 ? args[projectFlag + 1] : undefined;
if (projectFlag >= 0 && (!projectId || !/^[a-z0-9-]+$/.test(projectId))) {
  throw new Error('--project requires a valid project id');
}
const film = projectId
  ? filmSchema.parse(JSON.parse(await readFile(path.join('output', 'projects', projectId, 'film.json'), 'utf8')))
  : filmSchema.parse(sampleFilm);
await validateFilm(film, {publicRoot: path.resolve('public')});
const timeline = compileTimeline(film);
if (!projectId && timeline.durationInFrames !== film.output.fps * 16) {
  throw new Error('Demo film must be 16 seconds');
}

const kinds = [
  classifyInput(['https://example.com']).kind,
  classifyInput(['music.wav'], {audioKind: 'instrumental'}).kind,
  classifyInput(['song.wav'], {audioKind: 'song'}).kind,
  classifyInput(['一个主题']).kind,
  classifyInput(['image.png', 'voice.wav']).kind,
].join(',');
if (kinds !== 'url,instrumental,song,theme,assets') throw new Error(`Input routing mismatch: ${kinds}`);

const designState = createProductionState();
let blocked = false;
try {
  assertRenderAllowed(designState, 'sample');
} catch {
  blocked = true;
}
if (!blocked) throw new Error('G1 did not block sample rendering');
const sampleState = approveDesign(designState, new Date().toISOString());
assertRenderAllowed(sampleState, 'sample');
const productionState = approveSample(sampleState, new Date().toISOString());
assertRenderAllowed(productionState, 'film');

console.log(`Validated ${projectId ? `project ${projectId}` : 'template Film IR'}: ${film.scenes.length} scenes, ${timeline.durationInFrames} frames`);
console.log(`Validated input routes: ${kinds}`);
console.log('Validated G1/G2 render gates');
