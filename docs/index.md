# Motion Forge 文档索引

## 架构

- [系统架构](architecture/system.md)：最终产品形态、模块边界、渲染技术路线、两道确认闸和独立修改原则。
- [增量渲染](architecture/incremental-rendering.md)：场景内容哈希、帧缓存、渲染基线、转场边界与完整全片合成。

## 领域模型

- [术语表](../GLOSSARY.md)：领域概念的标准定义。
- [ADR](adr/)：不可逆或需解释的架构决策记录。

## 协议

- [Film IR 分镜协议](contracts/film.md)：输入、素材、分镜、时间锚、BGM/Voice/SFX 三轨音频和验收数据契约。
- [动效卡协议](contracts/motion-card.md)：卡片分类、使用场景、props、时间、预览、注册和验收契约。
- [QA 与交付包契约](contracts/delivery.md)：导出命令、QA 证据、包结构、安全脱敏和独立验收。

## Provider

- [Pexels 图片 Provider 契约](contracts/resource-provider.md)：搜索、下载、元数据、环境变量、错误分类和 mock 验收。
- [Pixabay Music BGM Provider](providers/pixabay-music.md)：BGM 搜索、下载落盘、来源与授权元数据、环境变量和 mock 验收。

## 迁移

- [现有能力与迁移策略](migration/sources.md)：五个源项目的特点、迁移范围、去重和验收原则。
- [迁移与验收流程](migration/workflow.md)：契约改造、独立渲染、视觉批准和状态回写。
- `cards.json`：由 `npm run cards:inventory` 生成的机器可读全量清单。
- `inventory.md`：由同一命令生成的人类可读清单。
- `ready.json`：仅有完整验收证据的迁移卡状态。

## 制作指引

- [高级场景制作与验收](../pipelines/advanced-scenes.md)：一镜到底、复杂 SVG 闭合路径几何形变和 Three.js 的选卡、实际能力边界、视觉/性能约束、G1/G2、QA 与独立交付验证。

## 开发计划

- [分阶段开发计划](plans/development.md)：实施顺序、阶段产物、验收标准和当前状态。
