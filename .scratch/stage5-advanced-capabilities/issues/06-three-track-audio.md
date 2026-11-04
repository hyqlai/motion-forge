# 06: BGM / Voice / SFX 三轨音频

**What to build:** Film IR、渲染器、目标校验和工作台同时支持 BGM、Voice、SFX 三轨，用户可编辑旁白与音效时序，并在最终 MP4 中获得正确混音。

**Blocked by:** 01: TTS 旁白生成链路；04: Pixabay Music BGM 检索与有声渲染

**Status:** ready-for-agent

- [ ] Film IR 支持可选 Voice segments 与 SFX events，旧版仅 BGM 项目保持兼容。
- [ ] Voice segment 关联 sceneId、起止时间与文本，SFX event 关联 sceneId、局部帧与音效类型。
- [ ] 渲染器按全片时间线正确放置三轨，分镜实现仍只使用局部帧。
- [ ] 目标校验覆盖三轨本地路径、时间区间、场景引用和文件存在性。
- [ ] 工作台可查看和编辑 BGM 音量/循环、Voice segments 与 SFX events，并复用 Film IR 写回。
- [ ] 已审批音频发生变化时重置 G1/G2，真实三轨 MP4 解码与时序抽查通过。
- [ ] 现有 validate、TypeScript、工作台构建与端到端渲染通过。
