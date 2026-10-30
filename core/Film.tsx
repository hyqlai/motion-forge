import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {sceneRegistry} from '../scenes/registry';
import {compileTimeline} from './timeline';
import type {FilmSpec, SceneSpec, Theme} from './schema';

export const SceneRenderer: React.FC<{scene: SceneSpec; theme: Theme}> = ({scene, theme}) => {
  const definition = sceneRegistry.get(scene.sceneComponent);
  if (!definition) {
    throw new Error(`Scene component is not registered: ${scene.sceneComponent}`);
  }
  return <definition.Component scene={scene} theme={theme} />;
};

export type FilmProps = {
  film: FilmSpec;
};

const FilmAudio: React.FC<FilmProps & {startFrom?: number}> = ({film, startFrom = 0}) => {
  const bgm = film.audio.bgm;
  if (!bgm) return null;
  return <Audio src={staticFile(bgm.src)} volume={bgm.volume} loop={bgm.loop} startFrom={startFrom} />;
};

export const Film: React.FC<FilmProps> = ({film}) => {
  const timeline = compileTimeline(film);
  return (
    <AbsoluteFill style={{background: film.theme.background}}>
      <FilmAudio film={film} />
      {timeline.scenes.map((scene) => (
        <Sequence key={scene.id} from={scene.from} durationInFrames={scene.durationInFrames} name={scene.title}>
          <SceneRenderer scene={scene} theme={film.theme} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const SingleSceneFilm: React.FC<FilmProps & {sceneId: string}> = ({film, sceneId}) => {
  const scene = film.scenes.find((item) => item.id === sceneId);
  if (!scene) throw new Error(`Unknown scene: ${sceneId}`);
  const from = compileTimeline(film).scenes.find((item) => item.id === sceneId)?.from ?? 0;
  return (
    <AbsoluteFill style={{background: film.theme.background}}>
      <FilmAudio film={film} startFrom={from} />
      <SceneRenderer scene={scene} theme={film.theme} />
    </AbsoluteFill>
  );
};
