# 内容策划使用 Agent 自身 LLM，不引入外部 LLM API

自动内容策划需要 LLM 生成分镜脚本。存在两个选择：调用外部 LLM API（OpenAI/Claude），或利用 Agent 自身的 LLM 能力。

**决定**：技能提供结构化策划模板（`pipelines/content-planning.md`），由 Agent 自身的 LLM 完成内容策划，不引入外部 LLM API 依赖。

**理由**：
- 本技能的用户就是编程 Agent（Claude Code / Codex / Cursor 等），Agent 本身已具备 LLM 能力。
- 引入外部 LLM API 会增加 API key 管理、计费、延迟和故障点，而 Agent 的 LLM 已经可用。
- 技能的价值在于结构化的策划模板和质量约束，不在于 LLM 本身。

**Considered Options**：调用 OpenAI/Claude API（被否：增加不必要的外部依赖和成本，且 Agent 已有 LLM 能力）。
