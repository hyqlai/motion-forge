# Issue tracker: Local Markdown

本仓库的 issue 和 spec 以 markdown 文件形式存放在 `.scratch/` 目录下。

## 约定

- 每个 feature 一个目录：`.scratch/<feature-slug>/`
- Spec 文件：`.scratch/<feature-slug>/spec.md`
- 实现 issue 每张票一个文件：`.scratch/<feature-slug>/issues/<NN>-<slug>.md`，从 `01` 开始编号，不合并为单文件
- Triage 状态记录为 issue 文件顶部的 `Status:` 行（角色字符串见 `triage-labels.md`）
- 评论和对话历史追加到文件底部的 `## Comments` 标题下

## 当 skill 说"publish to the issue tracker"

在 `.scratch/<feature-slug>/` 下创建新文件（目录不存在则创建）。

## 当 skill 说"fetch the relevant ticket"

读取引用路径的文件。用户通常直接传路径或 issue 编号。

## Wayfinding 操作

由 `/wayfinder` 使用。**map** 是一个文件，每个 ticket 对应一个**子**文件。

- **Map**：`.scratch/<effort>/map.md`（包含 Notes / Decisions-so-far / Fog 正文）
- **子 ticket**：`.scratch/<effort>/issues/NN-<slug>.md`，从 `01` 开始编号，正文写问题。`Type:` 行记录类型（`research`/`prototype`/`grilling`/`task`）；`Status:` 行记录 `claimed`/`resolved`
- **Blocking**：顶部 `Blocked by: NN, NN` 行。所有列出的文件均为 `resolved` 时解除阻塞
- **Frontier**：扫描 `.scratch/<effort>/issues/` 中未关闭、未阻塞、未认领的文件，编号最小者优先
- **Claim**：设置 `Status: claimed` 并保存后再开始工作
- **Resolve**：在 `## Answer` 标题下追加答案，设置 `Status: resolved`，然后向 `map.md` 的 Decisions-so-far 追加上下文指针（摘要 + 链接）
