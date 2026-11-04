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

## 6. 工作台

工作台通过 `?project=<id>` 读取 `output/projects/<id>/film.json`，编辑 Film IR 和公开 props 后写回同一文件；写回请求必须通过 Project ID、请求体大小、同源和 Film Schema 校验。设计内容发生变化时状态退回 `design-review`，旧 G1/G2 结论失效。原合成与工作台拆解合成必须做同帧一致性检查。
