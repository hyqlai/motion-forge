import {sampleFilm} from '../examples/theme-demo/film';
import {filmSchema} from '../core/schema';
import {compileTimeline} from '../core/timeline';
import {approveDesign, approveSample, assertRenderAllowed, createProductionState} from '../core/production-state';
import {classifyInput} from '../providers/input';
import {cardRegistry} from '../cards/registry';
import {sceneRegistry} from '../scenes/registry';

const film = filmSchema.parse(sampleFilm);
const timeline = compileTimeline(film);
const expectedDuration = film.scenes.reduce((total, scene) => total + scene.durationInFrames, 0);
if (timeline.durationInFrames !== expectedDuration) throw new Error('Timeline duration mismatch');
if (timeline.durationInFrames !== film.output.fps * 16) throw new Error('Demo film must be 16 seconds');

for (const scene of film.scenes) {
  if (!sceneRegistry.has(scene.sceneComponent)) throw new Error(`Missing scene component: ${scene.sceneComponent}`);
  for (const motion of [scene.motion.primary, scene.motion.camera, scene.motion.text, scene.motion.transitionOut]) {
    if (motion && !cardRegistry.has(motion.cardId)) throw new Error(`Missing card: ${motion.cardId}`);
  }
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

console.log(`Validated Film IR: ${film.scenes.length} scenes, ${timeline.durationInFrames} frames`);
console.log(`Validated input routes: ${kinds}`);
console.log('Validated G1/G2 render gates');
