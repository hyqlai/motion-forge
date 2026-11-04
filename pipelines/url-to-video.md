# 场景 Pipeline：URL 链接成片 (URL-to-Video)

本指南指导 Agent 基于用户提供的外部链接地址（网页文章、产品官网、SaaS 落地页、技术文档、新闻报道等），全流程完成从信息解构、叙事再创作到代码驱动视频生成。

---

## 一、场景定位与适用范围

- **典型输入**：
  - 深度长文 / 微信公众号文章 / 技术博客
  - SaaS / AI 产品的官网与 Landing Page
  - 新闻快报 / 行业研究白皮书 / GitHub 仓库 Release 页面
- **常见输出片种**：
  - 核心观点快剪与精读摘要（1~2 分钟）
  - 科技/软件产品功能发布片（30s~1 分钟）
  - 商业与行业洞察通识短片（1~3 分钟）

---

## 二、端到端工作流水线

```text
[用户提供 URL]
   ↓
1. 网页信息抓取与结构清洗 (fetchWebpage)
   ↓
2. 提炼核心叙事内核 (痛点、解法、数据、行动)
   ↓
3. 本地视觉素材沉淀 (抓取图表、截屏、Logo)
   ↓
4. 主时钟确立 (阅读语速估算 或 TTS 配音时钟)
   ↓
5. 自由构思分镜与动效选型 (编写 Film IR)
   ↓
6. 【G1 门禁】提交分镜剧本表，等待用户确认
   ↓
7. 【G2 门禁】渲染有声样板镜，验证真实质感
   ↓
8. 全片批量渲染与可交互交付
```

---

## 三、核心步骤实操指南

### 步骤 1：链接信息抓取与清洗
在技能/template 目录生成独立工程，由 `create` 调用 `providers/url.ts` 抓取网页并保存 `source.json`：
```bash
npm run forge -- create --dir /absolute/project --input "https://example.com/target-page" --name "project-slug"
```
进入 `PROJECT_ROOT` 后生成结构化策划工作单：
```bash
npm run forge -- plan --project "project-slug"
```
抓取结果保存在 `output/projects/project-slug/source.json`，包含：
- 网页标题（`title`）与最终 URL（`finalUrl`）；
- 清洗后的正文 `text`，作为事实追溯的唯一依据；
- 抓取时间 `capturedAt`。

完整字段约束见 [`pipelines/content-planning.md`](content-planning.md)。

### 步骤 2：叙事提炼与导演思考
**不要做机械的全文复述！** 视频是高信息密度且依赖视听节奏的媒介。Agent 应扮演“内容导演”：
- **提炼冲突与痛点 (Hook)**：原文解决了什么原本让人痛苦/昂贵的问题？作为开篇 3~5 秒的破局点；
- **重构逻辑骨架**：将文章的长篇大论梳理成 3~5 个清晰的递进逻辑支点；
- **视觉化翻译**：把文本中的抽象结论（如“性能提升5倍”）翻译为具象的画面指示（对比柱状图、狂飙计数器）；
- **事实可追溯**：每条引用、数字和结论都要在 `content-plan.json` 的 `facts` 中登记 `quote` 与 `sourceUrl`，`quote` 必须是 `source.json` 正文中的逐字片段；每个分镜至少引用一条事实。

### 步骤 3：主时钟建立
- **若生成旁白 (TTS)**：以生成的语音字级时间戳为基准，每个分镜时长严格贴合台词发音，并在句末留出 15~30 帧（0.5s~1s）的气口；
- **若无语音（纯字幕+BGM）**：按观众平均阅读舒适度（中文约 200~240 字/分钟，即每个汉字保留 7~9 帧时间，留足认知停留），绝不能一闪而过。

### 步骤 4：分镜编排与动效选型（开放灵感，自主决策）
**Agent 拥有完全的艺术自主权，根据文章的气质自主挑选和组合动效卡。**

以下提供常见灵感参考，供启发思路，**绝不作为硬性限制**：
- **极客/开发者/技术文档向**：
  - 标题可用字符解码 `typography/scramble-decode`、终端打字 `typography/typewriter-reveal`；
  - 核心操作可用悬浮命令框 `interaction/command-palette-summon` 或多层代码折叠；
  - 架构转场可用空间 3D 立方体 `transition/cube-rotate`。
- **SaaS / 消费级商业产品向**：
  - 产品界面可用 `commercial/mock-app`、毛玻璃面板 `interaction/host-card-glass-board`；
  - 数据亮点可用物理落砂 `data/particle-sand-fill` 或仪表跳动 `data/gauge-readout-moves`；
  - 转场可用丝滑的色块步进 `transition/wipe-transitions`。
- **行业深度报道 / 商业社论向**：
  - 观点金句可用胶片红晕冲光 `typography/halation-bloom` 或优雅引用卡 `typography/quote-card`；
  - 配合缓慢推焦运镜 `camera/slow-push`，呈现沉稳理性基调。

所有 `cardId` 必须存在于 `cards/` 注册表；`apply-plan` 会在转换前拒绝不存在的卡。

---

## 四、G1 分镜评审呈报标准

`apply-plan` 成功后，Agent 将 `output/projects/<id>/design-review.md` 呈现给用户。该文档由 Film IR 自动生成，已包含叙事弧线、每镜旁白、上屏文字、画面描述与来源事实；Agent 可补充导演阐述，但不得改写已校验的事实：

```markdown
# 《[提取的文章标题]》G1 分镜与视觉设计确认

- **输入来源**：https://example.com/target-page
- **建议画幅**：1920×1080 (横屏) 或 1080×1920 (竖屏) @ 30fps
- **视觉基调**：提取自原网页的品牌色（如背景深蓝 #0a0f1d，强调天蓝 #38bdf8）
- **时钟模式**：旁白口播对齐 / 文本阅读停留时钟

| 分镜 | 镜头意图 | 旁白 | 实际上屏文字 (精炼) | 画面布局与构图 | 主动效卡 (Agent 自选) | 运镜设计 | 边界转场 | 时长 (f) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| S01 | 抛出痛点 | 传统工作流要花掉四个小时。 | "传统工作流：耗时 4 小时" | 居中大字 + 红色告警底色 | `typography/halation-bloom` | `camera/slow-push` | `transition/cube-rotate` | 90f |
| S02 | 方案解构 | 新架构把这条链路变成自动流水线。 | "新一代架构：全自动流水线" | 左右分栏：旧 vs 新 | `interaction/stack-reveal` | 无 | `transition/whip-pan` | 120f |
...

### 来源事实与依据

| 事实 | 陈述 | 原文依据 | 来源 |
| :--- | :--- | :--- | :--- |
| F01 | 传统流程耗时 4 小时 | （source.json 中的逐字原文） | https://example.com/target-page |
```

**呈报后向用户明确提问，获得拍板确认后执行：**
```bash
npm run forge -- approve-design --project <id>
```

---

## 五、样板镜与全片产出

1. 渲染代表镜：
   ```bash
   npm run forge -- render --project <id> --scope sample
   ```
2. 用户验收样板镜视听质感，批复后执行：
   ```bash
   npm run forge -- approve-sample --project <id>
   ```
3. 渲染全片：
   ```bash
   npm run forge -- render --project <id> --scope film
   ```
4. 提示用户启动工作台 `npm run workbench` 查看或进行局部微调。
