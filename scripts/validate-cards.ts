import {cardDefinitions} from '../cards/registry';

const ids = new Set<string>();
for (const card of cardDefinitions) {
  const {manifest, Component} = card;
  if (ids.has(manifest.id)) throw new Error(`Duplicate card id: ${manifest.id}`);
  ids.add(manifest.id);
  if (!Component) throw new Error(`Card has no implementation: ${manifest.id}`);
  if (manifest.usage.when.length === 0 || manifest.usage.avoid.length === 0) {
    throw new Error(`Card usage scenarios are incomplete: ${manifest.id}`);
  }
  for (const frame of manifest.qa.frames) {
    if (frame >= manifest.timing.defaultInFrames) {
      throw new Error(`QA frame ${frame} is outside ${manifest.id}`);
    }
  }
}
console.log(`Validated ${cardDefinitions.length} motion cards`);
