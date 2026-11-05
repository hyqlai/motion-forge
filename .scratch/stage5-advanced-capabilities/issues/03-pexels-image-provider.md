# 03: Pexels 图片检索与本地化

**What to build:** 视频制作 Agent 可按主题通过 Pexels Provider 检索并下载图片，将图片登记为独立项目的本地素材，供后续分镜使用。

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Pexels 实现现有 Resource Provider 接口，保留标题、预览、来源和授权相关元数据。
- [x] 图片下载后落入项目本地素材目录，Film IR 仅使用项目相对路径。
- [x] 目标 Film 校验能确认图片存在且不存在远程 URL、外部绝对路径或越界引用。
- [x] 密钥仅从环境变量读取，未启用搜索时保持纯本地工作流。
- [x] 搜索无结果、认证失败、限流和下载失败均显式报告，不静默使用无关占位图。
- [x] mock HTTP 验证搜索、下载与失败行为，现有 validate、TypeScript 与工作台构建通过。
