import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Player} from '@remotion/player';
import {Film, SingleSceneFilm} from '../../core/Film';
import {compileTimeline} from '../../core/timeline';
import type {FilmSpec, SceneSpec} from '../../core/schema';
import type {MotionCardDefinition} from '../../core/card';
import {sampleFilm} from '../../examples/theme-demo/film';
import {cardDefinitions} from '../../cards/registry';
import {CardPreview} from '../../cards/CardPreview';
import {AudioTrackEditor} from './AudioTracks';

const updateSceneContent = (scene: SceneSpec, value: string): SceneSpec => {
  const lines = value.split('\n').filter(Boolean);
  const props = {...scene.props};
  if (scene.sceneComponent === 'scene/stack-explainer') props.items = lines;
  else if (scene.sceneComponent === 'scene/svg-journey') props.steps = lines;
  else props.text = value;
  return {...scene, onScreenText: lines, props};
};

// 单张动效卡片：纯代码实时渲染组件，滚动入视口时自动循环播放代码动画
const LiveCardItem: React.FC<{
  card: MotionCardDefinition;
  isSelected: boolean;
  onSelect: () => void;
}> = ({card, isSelected, onSelect}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {threshold: 0.05}
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const duration = card.manifest.timing.defaultInFrames;

  return (
    <div
      ref={containerRef}
      className={`gallery-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="g-card-player-frame">
        {isVisible ? (
          <Player
            key={card.manifest.id}
            component={CardPreview}
            inputProps={{cardId: card.manifest.id, durationInFrames: duration}}
            durationInFrames={duration}
            compositionWidth={960}
            compositionHeight={540}
            fps={30}
            autoPlay
            loop
            controls={false}
            style={{
              width: '100%',
              aspectRatio: '16/9',
              pointerEvents: 'none',
              display: 'block',
            }}
          />
        ) : (
          <div style={{width: '100%', aspectRatio: '16/9', background: '#05070a'}} />
        )}
        <div className="g-card-badge">{card.manifest.kind}</div>
        <div className="g-card-frames">{duration}f ({(duration / 30).toFixed(1)}s)</div>
      </div>
      <div className="g-card-body">
        <div className="g-card-title">{card.manifest.title}</div>
        <div className="g-card-id">{card.manifest.id}</div>
        <div className="g-card-summary">{card.manifest.summary}</div>
        <div className="g-card-footer">
          {card.manifest.intents.slice(0, 2).map((intent) => (
            <span key={intent} className="g-card-intent">{intent}</span>
          ))}
          <span style={{marginLeft: 'auto', fontSize: 11, color: '#ffb703', fontWeight: 700}}>
            {card.manifest.energy.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'studio' | 'gallery'>('gallery'); // 默认展示 Gallery
  const [film, setFilm] = useState<FilmSpec>(sampleFilm);
  const [sceneId, setSceneId] = useState(sampleFilm.scenes[0].id);
  const [previewMode, setPreviewMode] = useState<'film' | 'scene'>('scene');
  const [cardId, setCardId] = useState(cardDefinitions[0].manifest.id);
  const [kind, setKind] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  // 维护当前动效卡的用户微调参数（时长、节拍、式样变体等）
  const [paramOverrides, setParamOverrides] = useState<Record<string, any>>({});
  const [projectId] = useState(() => new URLSearchParams(window.location.search).get('project'));
  const [isProjectLoading, setIsProjectLoading] = useState(Boolean(projectId));
  const [projectLoadError, setProjectLoadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (!projectId) return;
    const controller = new AbortController();
    setIsProjectLoading(true);
    setProjectLoadError('');
    const loadProject = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/film`, {signal: controller.signal});
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? '项目加载失败');
        const nextFilm = body as FilmSpec;
        setFilm(nextFilm);
        setSceneId(nextFilm.scenes[0].id);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setProjectLoadError(error instanceof Error ? error.message : '项目加载失败');
      } finally {
        if (!controller.signal.aborted) setIsProjectLoading(false);
      }
    };
    void loadProject();
    return () => controller.abort();
  }, [projectId]);

  const timeline = useMemo(() => compileTimeline(film), [film]);
  const scene = film.scenes.find((item) => item.id === sceneId) ?? film.scenes[0];
  const selectedCard = cardDefinitions.find((card) => card.manifest.id === cardId) ?? cardDefinitions[0];

  const visibleCards = useMemo(() => {
    return cardDefinitions.filter((card) => {
      if (kind !== 'all' && card.manifest.kind !== kind) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return card.manifest.title.toLowerCase().includes(q) ||
               card.manifest.id.toLowerCase().includes(q) ||
               card.manifest.summary.toLowerCase().includes(q) ||
               card.manifest.intents.some((i) => i.toLowerCase().includes(q));
      }
      return true;
    });
  }, [kind, searchQuery]);

  const textValue = scene.sceneComponent === 'scene/stack-explainer' || scene.sceneComponent === 'scene/svg-journey'
    ? scene.onScreenText.join('\n')
    : String(scene.props.text ?? scene.onScreenText.join('\n'));

  const changeText = (value: string): void => {
    setFilm((current) => ({
      ...current,
      scenes: current.scenes.map((item) => item.id === scene.id ? updateSceneContent(item, value) : item),
    }));
  };

  const handleParamChange = (paramName: string, value: number): void => {
    setParamOverrides((prev) => ({...prev, [paramName]: value}));
  };

  const activeDuration = paramOverrides['totalFrames'] ?? selectedCard.manifest.timing.defaultInFrames;

  // 将当前动效卡一键应用到当前分镜
  const applyCardToCurrentScene = (): void => {
    const isCamera = selectedCard.manifest.kind === 'camera';
    setFilm((current) => ({
      ...current,
      scenes: current.scenes.map((s) => {
        if (s.id !== scene.id) return s;
        if (isCamera) {
          return {
            ...s,
            motion: {
              ...s.motion,
              camera: {cardId: selectedCard.manifest.id, params: {...paramOverrides}},
            },
          };
        }
        return {
          ...s,
          motion: {
            ...s.motion,
            primary: {cardId: selectedCard.manifest.id, params: {...paramOverrides}},
          },
        };
      }),
    }));
    setViewMode('studio');
  };

  const saveProject = async (): Promise<void> => {
    if (!projectId) return;
    setIsSaving(true);
    setSaveMessage('');
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/film`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(film),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? '保存失败');
      setFilm(body.film as FilmSpec);
      setSaveMessage(body.approvalReset ? '已保存；设计已变更，G1/G2 需重新确认' : 'Film IR 已保存');
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  if (projectId && isProjectLoading) {
    return <main className="app-shell" style={{padding: 32}}>正在加载项目 {projectId}…</main>;
  }
  if (projectId && projectLoadError) {
    return <main className="app-shell" style={{padding: 32}} role="alert">无法加载项目 {projectId}：{projectLoadError}</main>;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="brand-mark">MF</span>
          <strong>Motion Forge</strong>
          <span className="project-name">{film.title}</span>
        </div>
        <div className="nav-tabs">
          <button
            className={`nav-tab ${viewMode === 'gallery' ? 'active' : ''}`}
            onClick={() => setViewMode('gallery')}
          >
            🎴 动效卡库 Gallery ({cardDefinitions.length})
          </button>
          <button
            className={`nav-tab ${viewMode === 'studio' ? 'active' : ''}`}
            onClick={() => setViewMode('studio')}
          >
            🎬 分镜制作工作台
          </button>
          {projectId && (
            <button className="nav-tab" onClick={() => void saveProject()} disabled={isSaving}>
              {isSaving ? '保存中…' : '保存 Film IR'}
            </button>
          )}
        </div>
        <div className="topbar-meta">{saveMessage || (projectId ? `项目 ${projectId} · 修改后需重新确认` : 'G1 设计确认 · G2 样板镜确认 · 内置示例')}</div>
      </header>

      {viewMode === 'gallery' ? (
        <section className="gallery-layout">
          {/* 顶部过滤工具条 */}
          <div className="gallery-top-bar">
            <div className="gallery-filter-chips">
              {[
                {label: '全部 ALL', value: 'all'},
                {label: '运镜 CAMERA', value: 'camera'},
                {label: '排印 TYPOGRAPHY', value: 'typography'},
                {label: '交互 INTERACTION', value: 'interaction'},
                {label: '数据 DATA', value: 'data'},
                {label: '特效 EFFECTS', value: 'effects'},
                {label: '节奏 RHYTHM', value: 'rhythm'},
                {label: '商业 COMMERCIAL', value: 'commercial'},
                {label: '转场 TRANSITION', value: 'transition'},
                {label: '媒体 MEDIA', value: 'media'},
              ].map((item) => (
                <button
                  key={item.value}
                  className={`chip-btn ${kind === item.value ? 'active' : ''}`}
                  onClick={() => setKind(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              className="gallery-search"
              placeholder="搜索卡片名、语义、分类..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* 动效卡全景流 + 右侧实时调试抽屉 */}
          <div className="gallery-content-split">
            {/* 左侧：全部卡片实时自动运行动画的网格流 */}
            <div className="gallery-grid">
              {visibleCards.map((card) => (
                <LiveCardItem
                  key={card.manifest.id}
                  card={card}
                  isSelected={card.manifest.id === selectedCard.manifest.id}
                  onSelect={() => {
                    setCardId(card.manifest.id);
                    setParamOverrides({});
                  }}
                />
              ))}
            </div>

            {/* 右侧：当前选中卡的实时控制与详细说明 */}
            <aside className="gallery-inspector">
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <span className="g-card-badge" style={{position: 'static'}}>{selectedCard.manifest.kind}</span>
                <span style={{fontSize: 12, color: '#ffb703', fontWeight: 700}}>{selectedCard.manifest.energy.toUpperCase()} ENERGY</span>
              </div>
              <h3>{selectedCard.manifest.title}</h3>
              <div className="inspector-meta">{selectedCard.manifest.id}</div>

              <div className="big-preview">
                <Player
                  key={`${selectedCard.manifest.id}-${JSON.stringify(paramOverrides)}`}
                  component={CardPreview}
                  inputProps={{
                    cardId: selectedCard.manifest.id,
                    durationInFrames: activeDuration,
                    params: paramOverrides,
                  }}
                  durationInFrames={activeDuration}
                  compositionWidth={960}
                  compositionHeight={540}
                  fps={30}
                  autoPlay
                  loop
                  controls
                  style={{width: '100%', aspectRatio: '16/9'}}
                />
              </div>

              <p style={{fontSize: 13, color: '#9aa7b9', lineHeight: 1.5, margin: 0}}>
                {selectedCard.manifest.summary}
              </p>

              {/* 多式样选择器（如果有多种变体） */}
              {(selectedCard.manifest as any).styles && (selectedCard.manifest as any).styles.length > 1 && (
                <div className="timing-section" style={{marginTop: 14}}>
                  <div className="timing-title">
                    <span>🎭 动效式样选择 (Styles)</span>
                    <span style={{color: '#ffb703', fontWeight: 700}}>
                      {String(paramOverrides['style'] ?? (selectedCard.manifest as any).styles[0].key)}
                    </span>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8}}>
                    {(selectedCard.manifest as any).styles.map((s: {key: string; label: string}) => {
                      const activeStyle = paramOverrides['style'] ?? (selectedCard.manifest as any).styles[0].key;
                      const isSelectedStyle = activeStyle === s.key;
                      return (
                        <button
                          key={s.key}
                          style={{
                            background: isSelectedStyle ? '#ffb703' : '#141c2b',
                            color: isSelectedStyle ? '#0c111b' : '#c3cbe2',
                            border: `1px solid ${isSelectedStyle ? '#ffb703' : '#2c384d'}`,
                            padding: '8px 12px',
                            borderRadius: 6,
                            textAlign: 'left',
                            fontSize: 12,
                            fontWeight: isSelectedStyle ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onClick={() => setParamOverrides((prev) => ({...prev, style: s.key}))}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 时长与节拍滑杆调节 */}
              <div className="timing-section">
                <div className="timing-title">
                  <span>⏱ 动效时长与节拍实时调节</span>
                  <span>{activeDuration}f ({(activeDuration / 30).toFixed(1)}s)</span>
                </div>
                {/* 基础总时长滑杆：保证每张卡都可以自由调节播放长度 */}
                {(!selectedCard.manifest.timing.params || !selectedCard.manifest.timing.params.some((p) => p.name === 'totalFrames')) && (
                  <div className="slider-row">
                    <div className="slider-label">
                      <span>总时长</span>
                      <span>{activeDuration} f ({(activeDuration / 30).toFixed(1)}s)</span>
                    </div>
                    <input
                      type="range"
                      className="slider-input"
                      min={selectedCard.manifest.timing.minimumInFrames ?? 30}
                      max={Math.max(240, selectedCard.manifest.timing.defaultInFrames * 2)}
                      step={5}
                      value={activeDuration}
                      onChange={(e) => handleParamChange('totalFrames', Number(e.target.value))}
                    />
                  </div>
                )}
                {/* 细粒度专属节拍参数 */}
                {selectedCard.manifest.timing.params?.map((p) => {
                  const currentValue = paramOverrides[p.name] ?? p.defaultValue;
                  return (
                    <div key={p.name} className="slider-row">
                      <div className="slider-label">
                        <span>{p.label}</span>
                        <span>{currentValue} {p.unit === 'seconds' ? 's' : 'f'}</span>
                      </div>
                      <input
                        type="range"
                        className="slider-input"
                        min={p.min}
                        max={p.max}
                        step={p.step}
                        value={currentValue}
                        onChange={(e) => handleParamChange(p.name, Number(e.target.value))}
                      />
                    </div>
                  );
                })}
              </div>

              <button className="apply-btn" onClick={applyCardToCurrentScene}>
                应用此卡到当前分镜 ({selectedCard.manifest.kind === 'camera' ? '运镜' : '主动效'})
              </button>

              <div className="usage-block">
                <strong>适用场景</strong>
                {selectedCard.manifest.usage.when.map((item) => <span key={item}>· {item}</span>)}
              </div>
              <div className="usage-block avoid">
                <strong>已知坑与不建议</strong>
                {selectedCard.manifest.usage.avoid.map((item) => <span key={item}>· {item}</span>)}
              </div>
            </aside>
          </div>
        </section>
      ) : (
        <section className="workspace">
          <aside className="scene-panel">
            <div className="panel-heading">分镜 <span>{film.scenes.length}</span></div>
            {timeline.scenes.map((item) => (
              <button
                className={`scene-row ${item.id === scene.id ? 'selected' : ''}`}
                key={item.id}
                onClick={() => {setSceneId(item.id); setPreviewMode('scene');}}
              >
                <span className="scene-index">{item.id.slice(0, 3)}</span>
                <span><strong>{item.title}</strong><small>{item.semantic} · {(item.durationInFrames / film.output.fps).toFixed(1)}s</small></span>
              </button>
            ))}
            <div className="panel-heading library-heading">动效卡库</div>
            <select value={kind} onChange={(event) => setKind(event.target.value)} className="kind-filter">
              <option value="all">全部类型 ({cardDefinitions.length})</option>
              <option value="camera">运镜效果</option>
              <option value="typography">文字排印</option>
              <option value="interaction">组件交互</option>
              <option value="data">数据图表</option>
              <option value="effects">光影特效</option>
              <option value="rhythm">剪辑节奏</option>
              <option value="commercial">商业镜头</option>
              <option value="transition">转场效果</option>
              <option value="media">媒体素材</option>
            </select>
            {visibleCards.map((card) => (
              <button
                className={`card-row ${card.manifest.id === selectedCard.manifest.id ? 'selected' : ''}`}
                key={card.manifest.id}
                onClick={() => {
                  setCardId(card.manifest.id);
                  setParamOverrides({});
                }}
              >
                <strong>{card.manifest.title}</strong>
                <small>{card.manifest.kind} · {card.manifest.energy}</small>
              </button>
            ))}
          </aside>

          <section className="stage-panel">
            <div className="stage-toolbar">
              <div className="segmented">
                <button className={previewMode === 'scene' ? 'active' : ''} onClick={() => setPreviewMode('scene')}>单镜预览</button>
                <button className={previewMode === 'film' ? 'active' : ''} onClick={() => setPreviewMode('film')}>全片预览</button>
              </div>
              <span>{film.output.width}×{film.output.height} · {film.output.fps}fps</span>
            </div>
            <div className="player-frame">
              {previewMode === 'scene' ? (
                <Player
                  key={`${scene.id}-${film.scenes.length}-${scene.motion.camera?.cardId}-${scene.motion.primary?.cardId}`}
                  component={SingleSceneFilm}
                  inputProps={{film, sceneId: scene.id}}
                  durationInFrames={scene.durationInFrames}
                  compositionWidth={film.output.width}
                  compositionHeight={film.output.height}
                  fps={film.output.fps}
                  controls
                  style={{width: '100%', aspectRatio: `${film.output.width}/${film.output.height}`}}
                />
              ) : (
                <Player
                  component={Film}
                  inputProps={{film}}
                  durationInFrames={timeline.durationInFrames}
                  compositionWidth={film.output.width}
                  compositionHeight={film.output.height}
                  fps={film.output.fps}
                  controls
                  style={{width: '100%', aspectRatio: `${film.output.width}/${film.output.height}`}}
                />
              )}
            </div>
            <div className="timeline">
              {timeline.scenes.map((item) => (
                <button
                  key={item.id}
                  className={item.id === scene.id ? 'timeline-clip active' : 'timeline-clip'}
                  style={{flexGrow: item.durationInFrames}}
                  onClick={() => {setSceneId(item.id); setPreviewMode('scene');}}
                >{item.id} · {item.title}</button>
              ))}
            </div>
            <AudioTrackEditor film={film} scene={scene} onChange={setFilm} />
          </section>

          <aside className="inspector-panel">
            <div className="panel-heading">分镜检查器</div>
            <label className="field-label">分镜 ID<input value={scene.id} readOnly /></label>
            <label className="field-label">叙事目的<textarea value={scene.intent} readOnly rows={2} /></label>
            <label className="field-label">实际上屏文字<textarea value={textValue} onChange={(event) => changeText(event.target.value)} rows={5} /></label>
            <div className="property-grid">
              <span>布局</span><strong>{scene.layout.kind}</strong>
              <span>渲染</span><strong>{scene.renderer}</strong>
              <span>主动效</span><strong>{scene.motion.primary?.cardId}</strong>
              <span>运镜</span><strong>{scene.motion.camera?.cardId ?? '无'}</strong>
            </div>
            <div className="approval-note">修改写入项目 Film IR 后会使既有审批失效；其他分镜模块不受影响。</div>

            <div className="panel-heading card-inspector-heading">动效参考卡</div>
            <div className="card-preview">
              <Player
                key={`${selectedCard.manifest.id}-${JSON.stringify(paramOverrides)}`}
                component={CardPreview}
                inputProps={{
                  cardId: selectedCard.manifest.id,
                  durationInFrames: activeDuration,
                  params: paramOverrides,
                }}
                durationInFrames={activeDuration}
                compositionWidth={960}
                compositionHeight={540}
                fps={30}
                controls
                style={{width: '100%', aspectRatio: '16/9'}}
              />
            </div>
            <h3>{selectedCard.manifest.title}</h3>
            <p>{selectedCard.manifest.summary}</p>

            {/* 时长与节拍滑杆调节 */}
            {selectedCard.manifest.timing.params && selectedCard.manifest.timing.params.length > 0 ? (
              <div className="timing-section">
                <div className="timing-title">
                  <span>⏱ 关键节拍调节</span>
                  <span>{activeDuration}f ({(activeDuration / 30).toFixed(1)}s)</span>
                </div>
                {selectedCard.manifest.timing.params.map((p) => {
                  const currentValue = paramOverrides[p.name] ?? p.defaultValue;
                  return (
                    <div key={p.name} className="slider-row">
                      <div className="slider-label">
                        <span>{p.label}</span>
                        <span>{currentValue} {p.unit === 'seconds' ? 's' : 'f'}</span>
                      </div>
                      <input
                        type="range"
                        className="slider-input"
                        min={p.min}
                        max={p.max}
                        step={p.step}
                        value={currentValue}
                        onChange={(e) => handleParamChange(p.name, Number(e.target.value))}
                      />
                    </div>
                  );
                })}
              </div>
            ) : null}

            <button className="apply-btn" onClick={applyCardToCurrentScene}>
              应用到当前分镜 ({selectedCard.manifest.kind === 'camera' ? '运镜' : '主动效'})
            </button>

            <div className="usage-block"><strong>使用场景</strong>{selectedCard.manifest.usage.when.map((item) => <span key={item}>· {item}</span>)}</div>
            <div className="usage-block avoid"><strong>不建议</strong>{selectedCard.manifest.usage.avoid.map((item) => <span key={item}>· {item}</span>)}</div>
          </aside>
        </section>
      )}
    </main>
  );
};
