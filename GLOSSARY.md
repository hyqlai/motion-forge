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

背景音乐轨道。持续播放，支持 loop 和音量控制。通过 `audio.bgm` 声明，`src` 是 `public/` 下的项目相对路径；旧版仅 BGM 的 Film IR 保持兼容。

### Voice

旁白/配音轨道。按场景对齐，每个 segment 包含 `sceneId`、`start`、`end` 和 `text`，起止帧都是场景局部帧。旁白音源取该分镜 `assetIds` 中唯一的 `kind: voice` 资产。通过 `audio.voice.segments` 声明。

### SFX

音效轨道。按帧触发，每个 event 包含 `sceneId`、`frame` 和 `kind`；`frame` 是场景局部帧，`kind` 指向 `film.assets` 中 `kind: audio`、`role: sfx` 的资产 ID。通过 `audio.sfx.events` 声明。

### 三轨时序

Voice/SFX 在 Film IR 中使用场景局部帧，渲染器按 `compileTimeline` 生成的全片时间线换算为绝对帧；分镜组件本身仍只读取局部帧。三轨的本地路径、时间区间、场景引用和文件存在性由目标 Film 校验统一检查。

## 增量渲染

基于场景内容哈希的变化检测，只重渲发生变化的场景及受影响的转场边界，未变化场景复用已有帧缓存。与全量渲染（每次渲染所有帧）相对。增量模式不绕过 G1/G2、目标 Film 校验或全片完整性校验，最终仍输出完整 `film.mp4`。

### 场景内容哈希

以分镜结构、动效槽位、公开 props、关联素材和三轨音频引用为输入的内容指纹；只排除临时路径、时间戳、`downloadedAt` 等明确不稳定字段，保留 `props.metadata` 及其他可能影响画面的字段。哈希不匹配即不能复用旧帧，禁止仅按分镜 ID 复用缓存。

### 帧缓存

成功渲染后按视觉内容版本保存的单镜 MP4 段与整轨音频缓存，连同文件哈希、场景哈希和渲染器内容版本写入项目内 `.render-cache/manifest.json`。

### 渲染基线

一次完整 MP4 校验通过后原子写入的 `manifest.json`，记录分镜内容版本、缓存文件哈希与渲染器内容版本；任何渲染或拼接失败都不得更新基线。

### 转场边界

声明 `motion.transitionOut` 的分镜与其后继分镜之间的画面依赖。变化分镜的前一镜若声明 `transitionOut`，或变化分镜自身声明 `transitionOut`，则相邻分镜必须一起重渲。

### 渲染器内容版本

运行时代码、动效卡资源、全局静态素材、依赖清单和增量渲染实现的内容指纹；版本变化使全部帧缓存失效，避免代码或素材依赖变化被旧缓存掩盖。渲染设置（如 `--gl`、并发和浏览器可执行文件名）也进入场景内容哈希，但浏览器绝对路径等临时环境信息不进入哈希。

## 内容策划

由技能提供结构化模板，Agent 使用自身 LLM 能力将主题/URL/素材转化为分镜脚本的过程。不调用外部 LLM API。

## 草稿生成

`createDraft()` 用硬编码模板生成的初始 3 镜草案，供 G1 评审前修改。与内容策划的区别：草稿生成无智能，内容策划由 LLM 驱动。

## 交付包

视频项目的完整导出物，包含 MP4 视频、可编辑工程（Film IR + 代码 + 配置）、QA 报告和素材清单。可独立运行，不依赖技能目录。
