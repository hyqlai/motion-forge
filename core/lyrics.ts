import type {FilmSpec, SceneSpec} from './schema';

export type TranscriptSegment = {
  text: string;
  startSeconds: number;
  endSeconds: number;
};

export type LyricGroupingOptions = {
  pauseSeconds?: number;
  maxLineSeconds?: number;
  maxLineChars?: number;
};

export type ResolvedLyricGroupingOptions = Required<LyricGroupingOptions>;

export const DEFAULT_LYRIC_GROUPING: ResolvedLyricGroupingOptions = {
  pauseSeconds: 0.45,
  maxLineSeconds: 5,
  maxLineChars: 28,
};

export type LyricLine = {
  index: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  segments: TranscriptSegment[];
};

const cjkPattern = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const boundaryPunctuation = /[，,。.!！？?；;、：:）)】\]」』]$/u;
const leadingPunctuation = /^[\p{P}\p{S}]/u;
const timeTolerance = 1e-6;

const assertSegments = (segments: readonly TranscriptSegment[]): void => {
  if (segments.length === 0) {
    throw new Error('ASR transcription contains no word-level segments');
  }
  let previousEnd = -Infinity;
  segments.forEach((segment, index) => {
    if (typeof segment.text !== 'string' || segment.text.trim() === '') {
      throw new Error(`ASR segment ${index + 1} has no text`);
    }
    if (!Number.isFinite(segment.startSeconds) || !Number.isFinite(segment.endSeconds)) {
      throw new Error(`ASR segment ${index + 1} is missing timestamps`);
    }
    if (segment.startSeconds < 0 || segment.endSeconds <= segment.startSeconds) {
      throw new Error(`ASR segment ${index + 1} has an invalid time range`);
    }
    if (segment.startSeconds < previousEnd - timeTolerance) {
      throw new Error(`ASR segments are not ordered by time at segment ${index + 1}`);
    }
    previousEnd = Math.max(previousEnd, segment.endSeconds);
  });
};

const needsSpace = (previousText: string, nextText: string): boolean => {
  const last = previousText.at(-1);
  const first = nextText[0];
  if (!last || !first) return false;
  if (/\s/.test(last) || /\s/.test(first)) return false;
  if (cjkPattern.test(last) || cjkPattern.test(first)) return false;
  if (leadingPunctuation.test(first)) return false;
  return true;
};

const joinSegments = (segments: readonly TranscriptSegment[]): string => {
  let text = '';
  for (const segment of segments) {
    const value = segment.text.trim();
    if (!value) continue;
    text = text && needsSpace(text, value) ? `${text} ${value}` : `${text}${value}`;
  }
  return text.replace(/\s+/g, ' ').trim();
};

// 词级时间戳是唯一时间事实源：只按停顿、行长和文本边界切句，不重写或补造时间。
export const groupTranscriptSegments = (
  segments: readonly TranscriptSegment[],
  options: LyricGroupingOptions = {},
): LyricLine[] => {
  assertSegments(segments);
  const grouping: ResolvedLyricGroupingOptions = {...DEFAULT_LYRIC_GROUPING, ...options};
  if (grouping.pauseSeconds < 0 || grouping.maxLineSeconds <= 0 || grouping.maxLineChars <= 0) {
    throw new Error('Lyric grouping thresholds must be positive');
  }

  const groups: TranscriptSegment[][] = [];
  let current: TranscriptSegment[] = [];

  for (const segment of segments) {
    const previous = current.at(-1);
    if (previous) {
      const gap = segment.startSeconds - previous.endSeconds;
      const candidate = joinSegments([...current, segment]);
      const exceedsPause = gap > grouping.pauseSeconds;
      const exceedsDuration = segment.endSeconds - current[0].startSeconds > grouping.maxLineSeconds;
      const exceedsChars = candidate.length > grouping.maxLineChars;
      const endsSentence = boundaryPunctuation.test(previous.text.trim());
      if (exceedsPause || exceedsDuration || exceedsChars || endsSentence) {
        groups.push(current);
        current = [];
      }
    }
    current.push(segment);
  }
  if (current.length > 0) groups.push(current);

  return groups.map((group, index) => ({
    index: index + 1,
    startSeconds: group[0].startSeconds,
    endSeconds: group[group.length - 1].endSeconds,
    text: joinSegments(group),
    segments: group,
  }));
};

export type LyricsAnalysis = {
  schemaVersion: '1.0.0';
  provider: string;
  model?: string;
  language?: string;
  transcribedAt: string;
  audio: {assetId: string; path: string};
  transcription: {
    text: string;
    durationSeconds: number;
    segments: TranscriptSegment[];
  };
  grouping: ResolvedLyricGroupingOptions;
  lines: LyricLine[];
};

export type CreateLyricsAnalysisOptions = {
  provider: string;
  model?: string;
  language?: string;
  transcribedAt?: string;
  audio: {assetId: string; path: string};
  text: string;
  durationSeconds: number;
  segments: readonly TranscriptSegment[];
  grouping?: LyricGroupingOptions;
};

export const createLyricsAnalysis = (options: CreateLyricsAnalysisOptions): LyricsAnalysis => {
  if (!options.text.trim()) throw new Error('ASR transcription text is empty');
  if (!Number.isFinite(options.durationSeconds) || options.durationSeconds <= 0) {
    throw new Error('ASR transcription duration must be positive');
  }
  const grouping: ResolvedLyricGroupingOptions = {...DEFAULT_LYRIC_GROUPING, ...options.grouping};
  const lines = groupTranscriptSegments(options.segments, grouping);
  const lastLine = lines[lines.length - 1];
  if (lastLine.endSeconds > options.durationSeconds + 0.5) {
    throw new Error('ASR lyric timestamps exceed the transcription duration');
  }
  return {
    schemaVersion: '1.0.0',
    provider: options.provider,
    model: options.model,
    language: options.language,
    transcribedAt: options.transcribedAt ?? new Date().toISOString(),
    audio: options.audio,
    transcription: {
      text: options.text,
      durationSeconds: options.durationSeconds,
      segments: options.segments.map((segment) => ({...segment})),
    },
    grouping,
    lines,
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// 读取已有分析产物时重新按词级时间戳计算逐行分组，避免手改 lyrics.json 伪造时间。
export const parseLyricsAnalysis = (value: unknown): LyricsAnalysis => {
  if (!isRecord(value)) throw new Error('lyrics.json must be a JSON object');
  if (value.schemaVersion !== '1.0.0') throw new Error('Unsupported lyrics analysis schema version');
  if (typeof value.provider !== 'string' || !value.provider.trim()) {
    throw new Error('lyrics.json is missing the ASR provider');
  }
  if (!isRecord(value.audio) || typeof value.audio.assetId !== 'string' || typeof value.audio.path !== 'string') {
    throw new Error('lyrics.json is missing the source audio reference');
  }
  if (!isRecord(value.transcription)) throw new Error('lyrics.json is missing the transcription');
  const transcription = value.transcription;
  if (typeof transcription.text !== 'string' || !transcription.text.trim()) {
    throw new Error('lyrics.json transcription text is empty');
  }
  if (
    typeof transcription.durationSeconds !== 'number' ||
    !Number.isFinite(transcription.durationSeconds) ||
    transcription.durationSeconds <= 0
  ) {
    throw new Error('lyrics.json transcription duration is invalid');
  }
  if (!Array.isArray(transcription.segments)) {
    throw new Error('lyrics.json transcription segments are missing');
  }
  const grouping: ResolvedLyricGroupingOptions = {...DEFAULT_LYRIC_GROUPING};
  if (value.grouping !== undefined) {
    if (!isRecord(value.grouping)) throw new Error('lyrics.json grouping must be an object');
    for (const key of ['pauseSeconds', 'maxLineSeconds', 'maxLineChars'] as const) {
      const threshold = value.grouping[key];
      if (threshold === undefined) continue;
      if (typeof threshold !== 'number' || !Number.isFinite(threshold)) {
        throw new Error(`lyrics.json grouping ${key} is invalid`);
      }
      grouping[key] = threshold;
    }
  }
  const segments = transcription.segments as TranscriptSegment[];
  const lines = groupTranscriptSegments(segments, grouping);
  if (!Array.isArray(value.lines) || value.lines.length !== lines.length) {
    throw new Error('lyrics.json lines do not match its word-level transcription');
  }
  value.lines.forEach((line, index) => {
    const expected = lines[index];
    if (
      !isRecord(line) ||
      line.index !== expected.index ||
      line.text !== expected.text ||
      line.startSeconds !== expected.startSeconds ||
      line.endSeconds !== expected.endSeconds
    ) {
      throw new Error(`lyrics.json line ${index + 1} does not match its word-level transcription`);
    }
  });
  if (lines[lines.length - 1].endSeconds > transcription.durationSeconds + 0.5) {
    throw new Error('lyrics.json lyric timestamps exceed the transcription duration');
  }
  return {
    schemaVersion: '1.0.0',
    provider: value.provider,
    model: typeof value.model === 'string' ? value.model : undefined,
    language: typeof value.language === 'string' ? value.language : undefined,
    transcribedAt: typeof value.transcribedAt === 'string' ? value.transcribedAt : '',
    audio: {assetId: value.audio.assetId, path: value.audio.path},
    transcription: {
      text: transcription.text,
      durationSeconds: transcription.durationSeconds,
      segments: segments.map((segment) => ({
        text: segment.text,
        startSeconds: segment.startSeconds,
        endSeconds: segment.endSeconds,
      })),
    },
    grouping,
    lines,
  };
};

const frameNumber = (value: number): string => String(value).padStart(3, '0');

const gapScene = (
  kind: 'intro' | 'interlude' | 'outro',
  gapIndex: number,
  startFrame: number,
  endFrame: number,
  fps: number,
): SceneSpec => ({
  id: `S01-g${frameNumber(gapIndex)}`,
  title: `间奏 ${frameNumber(gapIndex)}`,
  intent: `与歌曲时间线对齐的${kind === 'intro' ? '前奏' : kind === 'outro' ? '尾奏' : '间奏'}留白`,
  semantic: '间奏',
  durationInFrames: endFrame - startFrame,
  onScreenText: [],
  assetIds: [],
  layout: {kind: 'full-bleed', options: {}},
  renderer: 'canvas',
  sceneComponent: 'scene/canvas-music',
  motion: {primary: {cardId: 'effects/canvas-particles', params: {}}},
  props: {
    text: '',
    gap: {kind, startSeconds: startFrame / fps, endSeconds: endFrame / fps},
  },
  qa: {frames: [0], checkpoints: ['间奏画面不抢歌词主体']},
});

const lyricScene = (line: LyricLine, lineCount: number, assetId: string, frames: number): SceneSpec => {
  return {
    id: `S01-l${frameNumber(line.index)}`,
    title: `歌词 ${frameNumber(line.index)}`,
    intent: `演唱第 ${line.index} 行歌词，时间区间来自 ASR 分析`,
    semantic: '歌词',
    durationInFrames: frames,
    onScreenText: [line.text],
    assetIds: [assetId],
    layout: {kind: 'hero', options: {}},
    renderer: 'html',
    sceneComponent: 'scene/kinetic-title',
    motion: {
      primary: {cardId: 'typography/keyword-reveal', params: {}},
      camera: {cardId: 'camera/slow-push', params: {zoomTo: 1.03}},
    },
    props: {
      text: line.text,
      eyebrow: `LYRIC ${line.index}/${lineCount}`,
      lyric: {
        index: line.index,
        startSeconds: line.startSeconds,
        endSeconds: line.endSeconds,
        text: line.text,
      },
    },
    qa: {
      frames: frames > 1 ? [0, Math.floor(frames / 2)] : [0],
      checkpoints: ['文字与演唱同步', '起止时间来自 lyrics.json'],
    },
  };
};

// 歌词镜头严格按绝对时间换算帧边界；间隙补间奏镜头，避免后续歌词整体漂移。
export const draftLyricFilm = (film: FilmSpec, analysis: LyricsAnalysis): FilmSpec => {
  const fps = film.output.fps;
  const totalFrames = Math.round(analysis.transcription.durationSeconds * fps);
  if (totalFrames < 1) throw new Error('Transcription is too short to build a lyric draft');
  const scenes: SceneSpec[] = [];
  let cursor = 0;
  let gapIndex = 0;

  const addGap = (endFrame: number, kind: 'intro' | 'interlude' | 'outro'): void => {
    if (endFrame <= cursor) return;
    gapIndex += 1;
    scenes.push(gapScene(kind, gapIndex, cursor, endFrame, fps));
    cursor = endFrame;
  };

  for (const line of analysis.lines) {
    if (line.endSeconds <= line.startSeconds) {
      throw new Error(`Lyric line ${line.index} has no positive duration`);
    }
    const lineStart = Math.max(cursor, Math.round(line.startSeconds * fps));
    const lineEnd = Math.round(line.endSeconds * fps);
    if (lineEnd <= lineStart) {
      throw new Error(`Lyric line ${line.index} is shorter than one frame at ${fps}fps`);
    }
    addGap(lineStart, cursor === 0 ? 'intro' : 'interlude');
    const scene = lyricScene(line, analysis.lines.length, analysis.audio.assetId, lineEnd - lineStart);
    scenes.push(scene);
    cursor = lineEnd;
  }

  if (cursor > totalFrames) {
    throw new Error('Lyric timestamps exceed the transcription duration when converted to frames');
  }
  addGap(totalFrames, 'outro');

  return {...film, scenes};
};
