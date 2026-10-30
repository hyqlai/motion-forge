# Motion Forge

Motion Forge 是一个本地运行的通用 AI 视频制作系统：用自然语言或结构化输入策划视频，用 Remotion、HTML、SVG、Canvas 和 Three.js 生成画面，并通过浏览器工作台继续编辑。

## 已确认的产品形态

- 输入：链接、纯音乐、歌曲、主题、图片/视频/口播等混合素材。
- 片种：故事、科普、音乐故事、产品宣传、产品发布、哲理短片等。
- 流程：分镜与视觉设计确认 → 有声样板镜确认 → 自动完成全片。
- 素材：用户素材优先，其次代码绘制和免费资源检索；付费 AI 生成需单独确认。
- 音频：按片种自动判断是否需要旁白；无音频时可检索免费 BGM 和音效。
- 交付：MP4、可编辑视频工程、浏览器工作台。
- 架构：统一 Remotion 内核，独立分镜模块，可插拔动效卡，单镜及局部重渲。

## 目录

```text
core/          分镜协议、时间线、渲染与制作状态机
cards/         动效卡、清单、预览和索引
providers/     链接、素材、免费资源与音频提供方
scenes/        独立分镜和通用场景组件
skill/         Agent 制作流程入口
workbench/     浏览器工作台
scripts/       CLI、迁移和验收脚本
examples/      示例工程
public/        Remotion 本地音频与静态资源
output/        渲染与验收产物
docs/          需求、架构、协议、迁移和开发计划
```

详细文档从 [docs/index.md](docs/index.md) 进入。

## 当前实施范围

第一阶段正在打通端到端闭环：统一协议、代表卡、五类输入适配器、两道确认闸和工作台骨架。现有动效卡先建立全量迁移清单，再按卡片契约逐批迁移和验收；不能把复制文件视为迁移完成。

## 常用命令

```bash
npm install
npm run cards:inventory
npm run validate
npm run build
npm run studio
npm run workbench
npm run render
```

## 创建与确认一个视频项目

```bash
npm run forge -- init --input "重力的作用" --name gravity --title "重力如何塑造世界"
# 检查 output/projects/gravity/design-review.md 后确认 G1
npm run forge -- approve-design --project gravity
npm run forge -- render --project gravity --scope sample
# 检查有声样板镜后确认 G2
npm run forge -- approve-sample --project gravity
npm run forge -- render --project gravity --scope film
```

音频输入用 `--audio-kind song` 指定歌曲，不指定时按纯音乐处理。混合素材重复传入多个 `--input`。当前生成的是待创意确认的草案，不代表自动内容策划、TTS、歌词对齐或免费资源 provider 已完成。

渲染产物统一写入项目内 `output/`。
