# Motion Forge

## 项目性质

本项目是一个 **Code-to-Video 技能包**，核心功能是指导编程 Agent 用代码完成视频制作。技能目录只承载流程规范、动效卡参考、运行时模板和工程生成器。

**硬约束**：
- Agent 在使用本技能过程中的**所有产出**（代码、素材、Film IR、审批记录、渲染结果）必须写入**用户项目目录**，严禁写入技能目录。
- 用户项目目录**不得对技能目录有任何代码层级依赖**（import、npm file: 依赖、软链接、绝对路径引用），项目必须**独立安装、独立校验、独立渲染**。
- 真实项目通过 `npm run forge -- create --dir <绝对路径>` 在技能目录之外生成，生成后完全自包含。
- 详细规范见 `SKILL.md` 的「项目工程独立化原则」章节。

## Agent skills

### Issue tracker

Issue 以本地 markdown 文件形式存放在 `.scratch/` 目录下。详见 `docs/agents/issue-tracker.md`。

### Domain docs

单上下文布局（根目录 `GLOSSARY.md` + `docs/adr/`）。详见 `docs/agents/domain.md`。

### Secret scanning

提交前用 gitleaks 扫描暂存区，阻止密钥进入历史。启用与误报处理见 `docs/agents/secret-scanning.md`。
