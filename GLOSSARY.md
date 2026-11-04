# Glossary

## Provider

可插拔的外部能力提供方。通过注册表管理，支持替换实现而不影响调用方。

### TTS Provider

文本转语音（Text-to-Speech）能力的提供方。输入文本和音色参数，输出音频 Buffer。首个实现为 Fish Audio。

### ASR Provider

语音识别（Automatic Speech Recognition）能力的提供方。输入音频文件路径，输出带词级时间戳的转写结果。首个实现为 Fish Audio，密钥只从 `FISH_API_KEY` 读取，默认模型 `transcribe-1-pro`。

### 歌词对齐 (Lyric Alignment)

把 ASR 词级 segments 按停顿、行时长、行字数和文本边界组合为逐行歌词，保留每行起止时间。结果写入项目 `analysis/lyrics.json`，歌曲分镜可据此生成上屏文字与时间区间，无需重复转写。

### Resource Provider

素材资源（图片/视频/音频/UI）的检索与下载提供方。已定义 `ResourceProvider` 接口，首批实现为 Pexels（图片）和 Pixabay Music（BGM）。

## 多轨音频

Film IR 中的音频由三个独立轨道组成，各自有独立的音量、时序和来源。

### BGM

背景音乐轨道。持续播放，支持 loop 和音量控制。通过 `audio.bgm` 声明。

### Voice

旁白/配音轨道。按场景对齐，每个 segment 关联一个 sceneId 和时间区间。通过 `audio.voice.segments` 声明。

### SFX

音效轨道。按帧触发，每个 event 关联一个 sceneId 和帧号。通过 `audio.sfx.events` 声明。

## 增量渲染

基于场景内容哈希的变化检测，只重渲发生变化的场景及受影响的转场边界，未变化场景复用已有帧缓存。与全量渲染（每次渲染所有帧）相对。

## 内容策划

由技能提供结构化模板，Agent 使用自身 LLM 能力将主题/URL/素材转化为分镜脚本的过程。不调用外部 LLM API。

## 草稿生成

`createDraft()` 用硬编码模板生成的初始 3 镜草案，供 G1 评审前修改。与内容策划的区别：草稿生成无智能，内容策划由 LLM 驱动。

## 交付包

视频项目的完整导出物，包含 MP4 视频、可编辑工程（Film IR + 代码 + 配置）、QA 报告和素材清单。可独立运行，不依赖技能目录。
