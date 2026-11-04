# 02: ASR 歌曲转写与逐行歌词

**What to build:** 歌曲输入可通过统一 ASR Provider 接口和 Fish Audio 实现得到词级转写，按停顿与文本边界生成逐行歌词分析产物，并据此形成歌词分镜草案。

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] ASR Provider 接口与注册机制支持按 ID 获取实现，Fish Audio 返回全文、时长和词级 segments。
- [ ] 词级 segments 能按停顿、持续时间和文本边界组合为带起止时间的逐行歌词。
- [ ] 歌词分析结果保存为独立项目产物，后续分镜无需重复转写即可引用。
- [ ] 歌曲草案可使用逐行歌词生成对应上屏文字与时间区间，仍须经过 G1。
- [ ] 无密钥、转写失败或时间戳缺失时显式报错，不伪造歌词或时间信息。
- [ ] 已知时间戳样本与 mock HTTP 验证分组和错误行为，现有 validate、TypeScript 与工作台构建通过。
