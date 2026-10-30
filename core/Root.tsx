import React from 'react';
import {Composition} from 'remotion';
import {cardDefinitions} from '../cards/registry';
import {CardPreview} from '../cards/CardPreview';
import {sampleFilm} from '../examples/theme-demo/film';
import {Film, SingleSceneFilm} from './Film';
import {filmSchema} from './schema';
import {compileTimeline} from './timeline';

export const RemotionRoot: React.FC = () => {
  const timeline = compileTimeline(sampleFilm);
  return (
    <>
      <Composition
        id="Film"
        component={Film}
        durationInFrames={timeline.durationInFrames}
        fps={sampleFilm.output.fps}
        width={sampleFilm.output.width}
        height={sampleFilm.output.height}
        defaultProps={{film: sampleFilm}}
        calculateMetadata={({props}) => {
          const film = filmSchema.parse(props.film);
          return {
            durationInFrames: compileTimeline(film).durationInFrames,
            fps: film.output.fps,
            width: film.output.width,
            height: film.output.height,
          };
        }}
      />
      <Composition
        id="SampleScene"
        component={SingleSceneFilm}
        durationInFrames={sampleFilm.scenes[0].durationInFrames}
        fps={sampleFilm.output.fps}
        width={sampleFilm.output.width}
        height={sampleFilm.output.height}
        defaultProps={{film: sampleFilm, sceneId: sampleFilm.scenes[0].id}}
        calculateMetadata={({props}) => {
          const film = filmSchema.parse(props.film);
          const scene = film.scenes.find((item) => item.id === props.sceneId);
          if (!scene) throw new Error(`Unknown scene: ${props.sceneId}`);
          return {
            durationInFrames: scene.durationInFrames,
            fps: film.output.fps,
            width: film.output.width,
            height: film.output.height,
          };
        }}
      />
      {cardDefinitions.map((card) => (
        <Composition
          key={card.manifest.id}
          id={`Card-${card.manifest.id.replace('/', '-')}`}
          component={CardPreview}
          durationInFrames={card.manifest.timing.defaultInFrames}
          fps={30}
          width={960}
          height={540}
          defaultProps={{cardId: card.manifest.id, durationInFrames: card.manifest.timing.defaultInFrames}}
          calculateMetadata={({props}) => ({
            durationInFrames: props.durationInFrames,
            fps: 30,
            width: 960,
            height: 540,
          })}
        />
      ))}
    </>
  );
};
