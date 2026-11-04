import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {sceneRegistry} from '../scenes/registry';
import {compileAudioTracks, SFX_VOLUME} from './audio';
import {compileTimeline, type Timeline} from './timeline';
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

// Voice/SFX 在全片合成中按 compileTimeline 的绝对帧放置；单镜预览只取当前场景并归零到局部帧。
const FilmAudio: React.FC<{film: FilmSpec; timeline: Timeline; sceneId?: string}> = ({film, timeline, sceneId}) => {
  const tracks = compileAudioTracks(film, timeline);
  const scene = sceneId ? timeline.scenes.find((item) => item.id === sceneId) : undefined;
  if (sceneId && !scene) throw new Error(`Unknown scene: ${sceneId}`);
  const offset = scene?.from ?? 0;
  const voice = sceneId ? tracks.voice.filter((segment) => segment.sceneId === sceneId) : tracks.voice;
  const sfx = sceneId ? tracks.sfx.filter((event) => event.sceneId === sceneId) : tracks.sfx;

  return (
    <>
      {tracks.bgm && (
        <Audio
          src={staticFile(tracks.bgm.src)}
          volume={tracks.bgm.volume}
          loop={tracks.bgm.loop}
          startFrom={offset}
        />
      )}
      {voice.map((segment) => (
        <Sequence
          key={`voice-${segment.sceneId}-${segment.start}-${segment.end}`}
          from={segment.from - offset}
          durationInFrames={segment.durationInFrames}
          name={`Voice ${segment.sceneId}`}
        >
          <Audio src={staticFile(segment.src)} startFrom={segment.start} volume={1} />
        </Sequence>
      ))}
      {sfx.map((event) => (
        <Sequence
          key={`sfx-${event.sceneId}-${event.frame}-${event.kind}`}
          from={event.at - offset}
          name={`SFX ${event.kind}`}
        >
          <Audio src={staticFile(event.src)} volume={SFX_VOLUME} />
        </Sequence>
      ))}
    </>
  );
};

export const Film: React.FC<FilmProps> = ({film}) => {
  const timeline = compileTimeline(film);
  return (
    <AbsoluteFill style={{background: film.theme.background}}>
      <FilmAudio film={film} timeline={timeline} />
      {timeline.scenes.map((scene) => (
        <Sequence key={scene.id} from={scene.from} durationInFrames={scene.durationInFrames} name={scene.title}>
          <SceneRenderer scene={scene} theme={film.theme} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const SingleSceneFilm: React.FC<FilmProps & {sceneId: string}> = ({film, sceneId}) => {
  const timeline = compileTimeline(film);
  const scene = film.scenes.find((item) => item.id === sceneId);
  if (!scene) throw new Error(`Unknown scene: ${sceneId}`);
  return (
    <AbsoluteFill style={{background: film.theme.background}}>
      <FilmAudio film={film} timeline={timeline} sceneId={sceneId} />
      <SceneRenderer scene={scene} theme={film.theme} />
    </AbsoluteFill>
  );
};
