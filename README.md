# Motion Forge

Motion Forge 是一个本地运行的通用 AI 视频制作系统：用自然语言或结构化输入策划视频，用 Remotion、HTML、SVG、Canvas 和 Three.js 生成画面，并通过浏览器工作台继续编辑。模板仓库负责 Agent 制作指南、动效参考和独立工程生成；每个视频项目持有完整运行时，可脱离模板渲染。

## 已确认的产品形态

- 输入：链接、纯音乐、歌曲、主题、图片/视频/口播等混合素材。
- 片种：故事、科普、音乐故事、产品宣传、产品发布、哲理短片等。
- 流程：独立工程创建 → 分镜与视觉设计确认 → 有声样板镜确认 → 自动完成全片。
- 素材：初始化时复制到项目 `public/assets/<id>/`，以项目内相对路径注册；缺失素材立即报错。
- 音频：单曲/纯音乐自动接入 Film BGM；旁白可在设计阶段通过 Fish Audio TTS 生成，并作为项目本地 Voice 素材登记。
- 交付：MP4、自包含可编辑工程、可加载目标项目并写回 Film IR 的浏览器工作台。
- 架构：统一 Remotion 内核，独立分镜模块，可插拔动效卡，单镜及局部重渲。

## 目录

```text
core/          分镜协议、时间线、渲染与制作状态机
cards/         265 张动效卡、清单、预览和索引
providers/     链接、素材、免费资源与音频提供方
scenes/        独立分镜和通用场景组件
workbench/     浏览器工作台
scripts/       工程生成、校验、渲染和迁移脚本
examples/      渲染入口与内置示例 Film
public/        Remotion 本地音频、字体与静态资源
output/        渲染、项目数据与验收产物
docs/          需求、架构、协议、迁移和开发计划
SKILL.md       Agent 制作流程、动效设计思路与质量门禁
```

详细文档从 [docs/index.md](docs/index.md) 进入。

## 常用命令

```bash
npm ci
npm run validate
npm run build
npm run tts:verify
npm run studio
npm run workbench
npm run render
```

## 创建与确认一个独立视频项目

先在模板目录生成自包含工程：

```bash
npm run forge -- create --dir /absolute/path/gravity-video \
  --input "重力的作用" --name gravity --title "重力如何塑造世界"
cd /absolute/path/gravity-video
npm ci
# 生成结构化内容策划工作单，由 Agent 自身 LLM 填写 content-plan.json
npm run forge -- plan --project gravity
# 填写完成后校验并转换为 Film IR
npm run forge -- apply-plan --project gravity
npm run validate -- --project gravity
```

之后只在独立项目内执行：

```bash
# 检查 output/projects/gravity/design-review.md 后确认 G1
npm run forge -- approve-design --project gravity
npm run forge -- render --project gravity --scope sample
# 检查有声样板镜后确认 G2
npm run forge -- approve-sample --project gravity
npm run forge -- render --project gravity --scope film
npm run workbench -- --host 0.0.0.0
# 浏览器打开 http://127.0.0.1:5178/?project=gravity
```

音频输入用 `--audio-kind song` 指定歌曲，不指定时按纯音乐处理。混合素材重复传入多个 `--input`。主题与 URL 输入可先通过 `plan --project <id>` 生成结构化策划模板，再由 Agent 自身 LLM 填写 `content-plan.json` 并用 `apply-plan` 转换为 Film IR；该流程不调用外部 LLM API，应用后仍停留在 G1 等待用户确认。图片素材可通过显式 `search-images` / `fetch-image` 子命令从 Pexels 检索并下载到项目本地（需 `PEXELS_API_KEY`，详见 [`docs/contracts/resource-provider.md`](docs/contracts/resource-provider.md)）。歌词对齐尚未包含在本次流程中。渲染产物统一写入项目内 `output/projects/<id>/`。

旁白音频通过 Fish Audio 生成，密钥只从 `FISH_API_KEY` 读取；未配置密钥时命令直接报错，不会发起外部请求：

```bash
export FISH_API_KEY=<your-key>
npm run forge -- tts --project gravity --scene S01-opening \
  --voice <reference-id> --format mp3
# 也可用 --text "旁白文本" 覆盖 scene.narration，用 --out assets/gravity/voice.mp3 指定落盘路径
```

音频写入项目 `public/` 下并由 `film.json` 的 `assets` 登记，命令结束前会自动执行目标 Film 校验。

## 从 Pixabay Music 获取 BGM

在独立项目内，用环境变量提供密钥并搜索、下载 BGM：

```bash
PIXABAY_API_KEY=... npm run forge -- bgm --project gravity \
  --query "calm cinematic piano" --volume 0.2 --loop
```

下载文件写入 `public/assets/<id>/bgm-<pixabay-id>.<ext>`，Film IR 只登记项目相对路径，`assets.json` 保留来源、作者和 Pixabay Content License。多条结果时用 `--candidate <id>` 明确选择；`--search-only` 只看候选不落盘。未配置 `PIXABAY_API_KEY` 或设置 `PIXABAY_MUSIC_ENABLED=false` 时不会发起外部请求。详见 [Pixabay Music BGM Provider](docs/providers/pixabay-music.md)。
