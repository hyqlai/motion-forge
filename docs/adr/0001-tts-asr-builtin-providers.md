# TTS/ASR 内建 provider 接口而非调用外部技能

阶段 5 需要 TTS/ASR 能力。存在两个选择：调用独立的 Fish Audio skill（外部技能），或在技能代码库内建 TTS/ASR provider 接口。

**决定**：内建 provider 接口（`TTSProvider` / `ASRProvider`），Fish Audio 作为首个实现。

**理由**：
- 外部技能调用引入进程间依赖和不可控的输出格式；内建接口使音频产出直接落入项目 `public/assets/`，符合独立工程约束。
- provider 接口使后续接入其他 TTS/ASR 供应商（如 Azure、Google）只需新增实现类，不修改调用方。
- API key 通过环境变量注入，不写入代码或配置文件。

**Considered Options**：直接调用 Fish Audio skill（被否：输出路径不可控，且与项目独立化约束冲突）。
