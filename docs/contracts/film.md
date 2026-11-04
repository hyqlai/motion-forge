# Film IR 分镜协议

## 1. 项目文件

- `brief.json`：目标、受众、片种、语言、画幅、时长和用户硬约束。
- `assets.json`：本地素材、来源、角色、技术信息和分析结果引用。
- `analysis/`：ASR、歌词、节拍、段落、能量、视频切镜等分析。
- `film.json`：语义分镜唯一事实源。
- `timeline.json`：核心编译产物，不由模型逐帧手填。
- `project.json`：制作状态、确认记录和版本。
- `output/projects/<id>/`：上述项目事实源、审批记录、样板镜、全片、渲染中间件和验证日志。
- `public/assets/<id>/`：项目素材实体；Film IR 只登记其下相对路径。

## 2. 分镜字段

每镜至少包含：

| 字段 | 含义 |
|---|---|
| `id` | 稳定 ID，重排顺序时不改变 |
| `title` / `intent` | 镜头名称与叙事目的 |
| `semantic` | 钩子、定义、例证、步骤、对比、数据、转折、金句、结尾等 |
| `durationInFrames` | 当前镜头局部时长 |
| `onScreenText` | 实际上屏文字，不是内容摘要 |
| `narration` | 可选旁白及其时间锚引用 |
| `assetIds` | 引用素材清单，不写远程临时链接 |
| `layout` | 布局原型及局部覆盖 |
| `renderer` | html、svg、canvas、three 或 mixed |
| `sceneComponent` | 独立分镜组件注册名 |
| `motion` | 主动效、运镜、文字强调和出场转场槽位 |
| `props` | 该分镜组件的公开参数 |
| `qa` | 必验帧和内容检查点 |

分镜不得包含 `from`、全片绝对帧号或依赖其他分镜内部实现的字段。

## 3. 动效槽位

- `primary`：组件、素材或文字主动效，通常一个。
- `camera`：可选运镜，服务主体。
- `text`：可选文字强调，锚到语音、歌词或音乐事件。
- `transitionOut`：与下一镜的边界设计。

每个槽位通过 `cardId + variant + params + timing` 引用卡片。分镜不复制卡片内部动画代码。

## 4. 时间

场景实现只读取局部帧。核心按分镜顺序累加局部时长生成全片时间线，字幕、配音、BGM、SFX 和转场从同一时间线派生。音频分析保留浮点秒，只在渲染边界转换为帧。

## 5. 素材与内容

屏上文字、数据、引用和素材 ID 都必须可追溯到 brief、用户素材或来源记录。科普与产品数据不得为了填空而编造。素材缺失必须显式标记，不能用静默占位冒充完成。`assets.json.path` 与 `audio.bgm.src` 必须是 `public/` 下项目相对路径，不得使用绝对路径、远程 URL、`..` 越界或外部软链接；原始绝对路径和来源 URL 只允许保存在 `source`/输入元数据中。

通过外部 Provider 获取的 BGM 还必须在对应 asset 的 `metadata` 中保留 `provider`、`sourceUrl`、`license`、`licenseUrl`，且 `audio.bgm.src` 必须与该 asset 的 `path` 一致；未成功下载并验证为可解码音频的曲目不得写入 Film IR。

通过 `forge tts` 生成的旁白音频写入 `public/assets/<id>/`，以 `kind: voice`、`role: narration` 的 asset 登记，并在对应分镜的 `assetIds` 中引用。`metadata` 记录 provider、model、format 和 voice 等生成参数；不得记录 API key 或远程临时地址。生成结束前会执行目标 Film 校验，校验失败不得更新 `film.json`。

## 6. 工作台

工作台通过 `?project=<id>` 读取 `output/projects/<id>/film.json`，编辑 Film IR 和公开 props 后写回同一文件；写回请求必须通过 Project ID、请求体大小、同源和 Film Schema 校验。设计内容发生变化时状态退回 `design-review`，旧 G1/G2 结论失效。原合成与工作台拆解合成必须做同帧一致性检查。

## 7. 歌词分析产物

歌曲项目通过 `forge transcribe` 调用 ASR Provider，把结果写入 `output/projects/<id>/analysis/lyrics.json`。该文件是重复制作时可复用的时间事实源，结构如下：

| 字段 | 含义 |
|---|---|
| `schemaVersion` | 固定为 `1.0.0` |
| `provider` / `model` / `language` | 转写供应方、模型与请求语言 |
| `transcribedAt` | 转写时间 |
| `audio` | `{assetId, path}`，引用项目内已本地化的歌曲素材 |
| `transcription` | 全文、音频时长（秒）和词级 `segments`（`{text,startSeconds,endSeconds}`） |
| `grouping` | `pauseSeconds`、`maxLineSeconds`、`maxLineChars` 分组阈值 |
| `lines` | 逐行歌词 `{index,startSeconds,endSeconds,text,segments}` |

逐行歌词只能由 `transcription.segments` 按停顿、行时长/字数和文本边界计算，不得手写或补造时间。读取已有 `lyrics.json` 生成分镜时，必须重新按词级 segments 校验 `lines`，不一致即拒绝。

`forge lyrics-draft` 从该产物生成歌词分镜：歌词镜头在 `props.lyric` 中携带 `{index,startSeconds,endSeconds,text}`，间奏留白镜头在 `props.gap` 中携带时间区间；分镜局部帧按绝对时间换算，间隙用间奏镜头补齐。草案写回后项目状态退回 `design-review`，仍须重新通过 G1。
