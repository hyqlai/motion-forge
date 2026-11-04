# 内容策划工作流（Agent 自身 LLM）

本指南定义从主题或 URL 到 G1 分镜评审之间的内容策划步骤。策划由 Agent 自身的 LLM 完成，技能只提供结构化模板、校验规则和转换命令；**不调用任何外部 LLM API**（ADR-0002）。

## 1. 适用范围

- 一句话主题、命题、概念（`pipelines/theme-to-video.md`）。
- 网页、文章、产品页、技术文档（`pipelines/url-to-video.md`）。
- 歌曲、纯音乐、素材混剪仍走各自 pipeline；内容策划模板不替代 ASR、TTS 或素材 Provider。

## 2. 工作流

在独立工程根目录执行（`<id>` 为 `output/projects/<id>/` 的项目标识）：

```bash
# 1. 生成结构化策划工作单；URL 输入复用 create 时抓取的 source.json
npm run forge -- plan --project <id>

# 2. Agent 用自身 LLM 填写 output/projects/<id>/content-plan.json
#    把 status 从 draft 改为 ready，替换全部 <填写：…> 占位符

# 3. 校验并转换为 Film IR
npm run forge -- apply-plan --project <id>

# 4. 把 design-review.md 呈报用户，停留在 G1
#    用户明确批准后才执行：
npm run forge -- approve-design --project <id>
```

`plan --project <id>` 需要项目内已有 `input.json`；URL 项目还需要 `source.json`。未经过 `create` 的临时验证可以在模板目录使用 `plan --input <theme|url> --name <id> --allow-template-example`，该参数只用于技能自带示例，真实项目必须使用独立工程。

生成的文件：

| 文件 | 作用 |
| :--- | :--- |
| `content-plan.template.json` | 结构化策划模板，全部字段和占位符 |
| `content-plan.md` | 本次输入的策划工作单：约束、来源摘录、可用场景与动效目录 |
| `content-plan.json` | Agent 填写的策划，`apply-plan` 的输入 |
| `source.json`（URL） | `create`/`plan --input` 抓取的来源快照，事实追溯的事实源 |
| `film.json` | 校验通过后生成的 Film IR，G1 唯一事实源 |
| `design-review.md` | G1 评审文档，包含叙事弧线、每镜旁白与来源事实 |

## 3. 模板硬约束

`apply-plan` 会拒绝不满足以下条件的策划：

- **叙事弧线**：至少 3 幕、最多 6 幕；第一幕为 `hook`，最后一幕为 `resolution`；每个分镜必须且只能属于一幕，幕内顺序与 `scenes` 顺序一致，分镜的 `arcId` 必须指向所在幕。
- **每镜旁白**：`narration` 必填，必须是可直接朗读的完整句子，不能是内容摘要。
- **上屏文字**：`onScreenText` 至少一条，必须是实际出现在画面上的文字。
- **视觉描述**：`visual.description` 说明主体、构图、色彩、留白与文字层级；`visual.layoutKind` 对应 Film IR 的 `layout.kind`。
- **动效建议**：`motion.primary` 必填，可选 `camera`、`text`、`transitionOut`；卡片 ID 必须存在于 `cards/` 注册表。
- **时长**：`totalDurationSeconds` 必须等于所有分镜 `durationSeconds` 之和；每镜至少一帧，帧数按 `durationSeconds × fps` 四舍五入。
- **素材**：`assets[].path` 必须是项目 `public/` 下的相对路径；`assetIds` 必须能解析到已登记素材并通过文件存在性检查。
- **状态**：模板 `status` 为 `draft`；只有改为 `ready` 且不再包含 `<填写`/`TODO` 占位符的策划才能应用。

## 4. URL 事实追溯

URL 策划必须声明 `facts`，并且：

- `quote` 必须能在 `source.json` 的正文中逐字找到（忽略空白差异）；
- `sourceUrl` 必须等于抓取记录的 `url` 或 `finalUrl`；
- `sceneIds` 与分镜的 `factIds` 双向一致；
- 每个分镜至少引用一条事实。

`apply-plan` 在写入 `film.json` 之前完成来源、Film Schema、场景/卡片注册表与素材校验。任何一项失败都不会写入新 Film IR，也不会改变已有审批状态。

## 5. 校验与门禁

`apply-plan` 通过后项目状态固定为 `design-review`：

- 不会自动执行 `approve-design` 或 `approve-sample`；
- 对已经过 G1/G2 的项目再次应用策划，会重置为 `design-review` 并清空审批时间戳，必须重新走 G1/G2；
- 样板镜与全片渲染继续受 `assertRenderAllowed` 限制。

## 6. 代表性样本

仓库自带两个可复现样本：

- `examples/content-planning/theme-plan.json`：纯主题策划，4 幕、24 秒。
- `examples/content-planning/url-plan.json`：URL 策划，5 条来源事实，配合 `examples/content-planning/source-page.html` 使用。

本地验证 URL 样本时，在仓库根目录启动静态服务：

```bash
python3 -m http.server 4173 --directory examples/content-planning --bind 127.0.0.1
```

然后按第 2 节流程执行 `plan`、`apply-plan`、`npm run validate -- --project <id>`。
