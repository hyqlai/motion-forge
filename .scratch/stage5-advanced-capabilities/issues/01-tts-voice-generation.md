# 01: TTS 旁白生成链路

**What to build:** 视频制作 Agent 可通过统一 TTS Provider 接口调用 Fish Audio，为分镜旁白生成音频并保存到独立项目；后续可替换其他供应商而不修改制作流程。

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] TTS Provider 接口与注册机制支持按 ID 获取实现，Fish Audio 作为首个实现。
- [x] API key 仅从环境变量读取，不出现在代码、日志或项目产物中。
- [x] 可为指定分镜生成旁白音频，音频以项目相对路径登记并通过目标 Film 校验。
- [x] 认证失败、余额不足、限流和服务端错误有明确分类，仅可重试错误执行有限退避。
- [x] 未启用 TTS 或未配置密钥时不自动发起外部调用，既有本地草案流程不受影响。
- [x] mock HTTP 验证成功与失败行为，现有 validate、TypeScript 与工作台构建通过。
