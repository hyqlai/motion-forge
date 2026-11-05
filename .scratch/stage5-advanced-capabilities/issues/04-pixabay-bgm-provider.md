# 04: Pixabay Music BGM 检索与有声渲染

**What to build:** 视频制作 Agent 可通过 Pixabay Music Provider 搜索并下载 BGM，将音频接入 Film 的 BGM 轨道，并在独立项目中渲染带真实音乐的样板镜。

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Pixabay Music 实现现有 Resource Provider 接口，保留来源与音频元数据。
- [x] 下载后的音频以项目相对路径接入 `audio.bgm`，音量与循环设置符合 Film IR。
- [x] 独立项目可渲染含真实 BGM 的样板镜，MP4 含可解码音频流。
- [x] 密钥仅从环境变量读取，未启用搜索时不自动产生外部调用。
- [x] 搜索无结果、认证失败、限流和下载失败均显式报告，不伪造音乐素材。
- [x] mock HTTP 验证搜索与下载，真实渲染及现有 validate、TypeScript、工作台构建通过。
