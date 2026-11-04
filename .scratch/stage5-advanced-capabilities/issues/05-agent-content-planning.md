# 05: Agent 驱动的内容策划

**What to build:** 主题或 URL 输入可通过结构化策划模板，由 Agent 自身 LLM 生成具备叙事弧线的分镜内容，并转换为可评审的 Film IR，而非固定占位草案。

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] 策划模板约束叙事弧线、旁白、上屏文字、视觉描述、动效建议和时长分配。
- [ ] 主题输入能生成完整分镜策划，URL 输入能利用已抓取来源且事实可追溯。
- [ ] 内容策划不调用外部 LLM API，遵循 ADR-0002。
- [ ] 策划结果通过 Film Schema、场景/卡片注册与素材校验后才可进入 G1。
- [ ] 自动策划不绕过 G1/G2，也不修改用户已确认内容而不重置审批。
- [ ] 代表性主题与 URL 样本完成端到端验证，现有 validate、TypeScript 与工作台构建通过。
