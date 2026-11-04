import React from 'react';
import {voiceAssetForScene} from '../../core/audio';
import type {Asset, FilmSpec, SceneSpec, SfxEvent, VoiceSegment} from '../../core/schema';

type AudioTrackEditorProps = {
  film: FilmSpec;
  scene: SceneSpec;
  onChange: (film: FilmSpec) => void;
};

const updateAudio = (
  film: FilmSpec,
  patch: Partial<FilmSpec['audio']>,
): FilmSpec => ({...film, audio: {...film.audio, ...patch}});

const numberValue = (value: string, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const AudioTrackEditor: React.FC<AudioTrackEditorProps> = ({film, scene, onChange}) => {
  const bgm = film.audio.bgm;
  const voiceSegments = film.audio.voice?.segments ?? [];
  const sfxEvents = film.audio.sfx?.events ?? [];
  const audioAssets = film.assets.filter((asset) => asset.kind === 'audio');
  const sfxAssets = film.assets.filter((asset) => asset.kind === 'audio' && asset.role === 'sfx');
  let voiceAsset: Asset | undefined;
  try {
    voiceAsset = voiceAssetForScene(film, scene);
  } catch {
    voiceAsset = undefined;
  }

  const changeBgmSource = (src: string): void => {
    onChange(updateAudio(film, {
      bgm: src
        ? {src, volume: bgm?.volume ?? 0.2, loop: bgm?.loop ?? false}
        : undefined,
    }));
  };

  const changeVoice = (index: number, patch: Partial<VoiceSegment>): void => {
    onChange(updateAudio(film, {
      voice: {
        segments: voiceSegments.map((segment, position) => position === index ? {...segment, ...patch} : segment),
      },
    }));
  };

  const addVoice = (): void => {
    if (!voiceAsset) return;
    const text = scene.narration?.trim() || scene.onScreenText.join(' ') || '待填写旁白';
    onChange(updateAudio(film, {
      voice: {
        segments: [
          ...voiceSegments,
          {sceneId: scene.id, start: 0, end: Math.max(1, scene.durationInFrames), text},
        ],
      },
    }));
  };

  const changeSfx = (index: number, patch: Partial<SfxEvent>): void => {
    onChange(updateAudio(film, {
      sfx: {
        events: sfxEvents.map((event, position) => position === index ? {...event, ...patch} : event),
      },
    }));
  };

  const addSfx = (): void => {
    if (sfxAssets.length === 0) return;
    onChange(updateAudio(film, {
      sfx: {
        events: [...sfxEvents, {sceneId: scene.id, frame: 0, kind: sfxAssets[0].id}],
      },
    }));
  };

  return (
    <section className="audio-tracks">
      <div className="audio-tracks-heading">音频三轨 <span>BGM · Voice · SFX</span></div>

      <div className="audio-track">
        <div className="audio-track-head"><strong>BGM</strong><span>{bgm ? '已接入' : '未接入'}</span></div>
        <label className="audio-field">
          <span>来源</span>
          <select value={bgm?.src ?? ''} onChange={(event) => changeBgmSource(event.target.value)}>
            <option value="">无 BGM</option>
            {audioAssets.map((asset) => (
              <option key={asset.id} value={asset.path}>{asset.id} · {asset.path}</option>
            ))}
          </select>
        </label>
        {bgm && (
          <div className="audio-inline">
            <label className="audio-field audio-volume">
              <span>音量</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={bgm.volume}
                onChange={(event) => onChange(updateAudio(film, {
                  bgm: {...bgm, volume: numberValue(event.target.value, bgm.volume)},
                }))}
              />
              <b>{bgm.volume.toFixed(2)}</b>
            </label>
            <label className="audio-check">
              <input
                type="checkbox"
                checked={bgm.loop}
                onChange={(event) => onChange(updateAudio(film, {bgm: {...bgm, loop: event.target.checked}}))}
              />
              循环
            </label>
          </div>
        )}
      </div>

      <div className="audio-track">
        <div className="audio-track-head"><strong>Voice</strong><span>{voiceSegments.length} 段</span></div>
        {voiceSegments.map((segment, index) => (
          <div className="audio-row" key={`voice-${index}`}>
            <select
              value={segment.sceneId}
              onChange={(event) => changeVoice(index, {sceneId: event.target.value})}
            >
              {film.scenes.map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}
            </select>
            <input
              type="number"
              min={0}
              title="起始帧（场景局部）"
              value={segment.start}
              onChange={(event) => changeVoice(index, {start: numberValue(event.target.value, segment.start)})}
            />
            <input
              type="number"
              min={1}
              title="结束帧（场景局部）"
              value={segment.end}
              onChange={(event) => changeVoice(index, {end: numberValue(event.target.value, segment.end)})}
            />
            <input
              className="audio-text"
              value={segment.text}
              onChange={(event) => changeVoice(index, {text: event.target.value})}
            />
            <button
              className="audio-remove"
              title="删除旁白段"
              onClick={() => onChange(updateAudio(film, {
                voice: {segments: voiceSegments.filter((_, position) => position !== index)},
              }))}
            >×</button>
          </div>
        ))}
        <button className="audio-add" disabled={!voiceAsset} onClick={addVoice}>
          在当前分镜添加旁白段
        </button>
        {!voiceAsset && (
          <p className="audio-hint">当前分镜没有 voice 资产；先运行 forge tts，或把 kind: voice 资产加入 scene.assetIds。</p>
        )}
      </div>

      <div className="audio-track">
        <div className="audio-track-head"><strong>SFX</strong><span>{sfxEvents.length} 个</span></div>
        {sfxEvents.map((event, index) => (
          <div className="audio-row" key={`sfx-${index}`}>
            <select
              value={event.sceneId}
              onChange={(change) => changeSfx(index, {sceneId: change.target.value})}
            >
              {film.scenes.map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}
            </select>
            <input
              type="number"
              min={0}
              title="场景局部帧"
              value={event.frame}
              onChange={(change) => changeSfx(index, {frame: numberValue(change.target.value, event.frame)})}
            />
            <select value={event.kind} onChange={(change) => changeSfx(index, {kind: change.target.value})}>
              {!sfxAssets.some((asset) => asset.id === event.kind) && (
                <option value={event.kind}>{event.kind}（未登记）</option>
              )}
              {sfxAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.id}</option>)}
            </select>
            <button
              className="audio-remove"
              title="删除音效事件"
              onClick={() => onChange(updateAudio(film, {
                sfx: {events: sfxEvents.filter((_, position) => position !== index)},
              }))}
            >×</button>
          </div>
        ))}
        <button className="audio-add" disabled={sfxAssets.length === 0} onClick={addSfx}>
          在当前分镜添加音效事件
        </button>
        {sfxAssets.length === 0 && (
          <p className="audio-hint">未登记 role: sfx 的音频资产；事件的 kind 必须指向这类资产。</p>
        )}
      </div>

      <p className="audio-hint">保存 Film IR 会写回同一份事实源；已审批项目会重置 G1/G2。</p>
    </section>
  );
};
