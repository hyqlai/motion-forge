# 分阶段开发计划

## 阶段 0：需求、架构与盘点

- [x] 新建独立项目目录。
- [x] 落盘产品形态、系统架构、Film IR、动效卡协议和迁移原则。
- [x] 扫描卡片来源，生成 252 张卡的全量迁移清单。
- [x] 锁定运行环境和依赖版本。

验收：文档覆盖五类输入、两道确认闸、免费资源、TTS、工作台和单镜解耦；清单可重复生成。

## 阶段 1：统一内核与代表卡

- [x] 实现 Film IR、Zod 校验、时间线编译和制作状态机。
- [x] 实现 Remotion Root、全片合成和独立分镜合成。
- [x] 实现卡片注册、清单校验和分类索引。
- [x] 实现 HTML、SVG、Canvas、Three.js 代表卡。
- [x] 建立协议、状态机、注册表和输入适配器运行校验。

验收：新增卡不改时间线；单镜可独立渲染；任意 seek 可复现；运行校验和 TypeScript 构建通过。

## 阶段 2：五类输入与确认流程

- [x] 链接适配器：网页信息提取和事实来源记录。
- [x] 纯音乐/歌曲适配器：音频信息探测和主时钟选择。
- [x] 主题适配器：生成 Brief 和制作草案。
- [x] 混合素材适配器：素材盘点、角色和待分析状态。
- [x] 实现 G1/G2 状态约束及审核产物。
- [x] 建立免费图片、视频、UI、BGM、音效 provider 接口。

验收：五类输入都能生成合法项目草案；未通过 G1 不能做样板镜，未通过 G2 不能进入全片生产。此阶段是输入草案和协议闭环，不等于自动内容策划、歌词分析或真实外部资源 provider 已完成。

## 阶段 3：工作台与端到端样片

- [x] 工作台显示分镜、卡片使用场景和分镜时间线。
- [x] 支持全片/单镜预览和公开文字 props 编辑。
- [x] 工作台与 Remotion 使用同一组件和 Film IR。
- [x] 制作五镜样片并实际渲染带 BGM 的 16 秒 MP4。
- [x] 通过浏览器实际验证分镜切换、文字修改和卡片预览。
- [x] 工作台加载 `?project=<id>` 并原子写回 Film IR，设计变更时重置 G1/G2 状态。

验收：运行校验、TypeScript 构建、工作台构建、静帧和真实 MP4 渲染通过；输出和 QA 产物都在项目目录。多轨音频编辑和工作台导出属于后续工作。

## 阶段 3.5：独立工程与目标校验

- [x] 新增 `forge create`，在模板之外生成持有完整运行时、配置、锁文件和素材的独立项目。
- [x] 初始化时复制本地输入到 `public/assets/<id>/`，禁止 Film IR 使用外部绝对路径。
- [x] 新增目标 Film 校验，渲染前检查卡片、场景、素材和音频路径。
- [x] `forge render` 流式输出 Remotion 日志，并支持 `--browser-executable`、`--gl` 环境诊断。
- [x] 通过 npm overrides 消除 Remotion 嵌套 Zod 漏洞，`npm audit --omit=dev` 为零告警。
- [x] 修复 3D 场景 WebGL 渲染：默认使用 `swangle`（SwiftShader via ANGLE）软件渲染后端，不依赖 GPU 即可创建 WebGL 上下文。

验收：真实项目在模板之外生成并独立安装、校验、构建；非法卡片、越界素材和跳过门禁会在浏览器启动前失败。3D 全片（含 `effects/three-crystal` Three.js 场景）通过 `swangle` 渲染 120/120 帧零错误。

## 阶段 4：全量卡片迁移

- [x] 建立来源追踪、独立渲染、视觉批准和状态回写闭环。
- [x] 分批迁移并验收全部 260 张来源卡（video-talkcraft 108 张、video-shotcraft 与 brewreel 152 张），`docs/migration/ready.json` 记录 261 条验收证据。
- [x] 修复相机卡（slow-pull / slow-push）零差异运动曲线，末速非零且永不停死。
- [x] 建立来源对照渲染管线（`npm run cards:compare`），完成并排对照回归（输出到 `output/card-compare/`）。
- [x] 扩充全部 265 张注册卡的 README.md 为完整参考文档（包含意图/动效核心/参数表/已知坑/复用指引/动效范围）。
- [x] 构建浏览器工作台纯代码实时 Live Player Gallery 动效网格，零视频文件，视口感知自播放。
- [x] 动效时长与关键节拍参数化（timingParams），并在工作台检查器提供实时滑杆调节与一键应用到分镜。

验收：迁移卡 260/260 全部 ready；注册卡总数 265（含 5 张内建代表卡 `typography/keyword-reveal`、`interaction/stack-reveal`、`effects/canvas-particles`、`effects/three-crystal`、`media/svg-path`，无需迁移追踪）。`npm run cards:validate` 全量通过。

## 阶段 5：高级能力与完整片种

- [x] Fish Audio TTS Provider 与项目内旁白生成，密钥只从环境变量读取。
- [x] 歌曲 ASR 歌词对齐：`transcribe` 写入 `analysis/lyrics.json`，`lyrics-draft` 复用产物生成逐行歌词分镜并退回 G1。
- [x] Pexels 图片与 Pixabay Music BGM Provider，下载后进入项目本地素材和目标 Film 校验。
- [x] Agent 自身 LLM 内容策划：`plan` 生成结构化工作单，`apply-plan` 校验并写入 Film IR；不调用外部 LLM API。
- [x] BGM/Voice/SFX 三轨音频、场景局部帧换算和工作台编辑写回。
- [x] 单镜及受影响转场边界的增量渲染（见 [`docs/architecture/incremental-rendering.md`](../architecture/incremental-rendering.md)）。
- [x] 最终 QA 与完整交付包：帧数/时长/完整解码、G1/G2、安全扫描、可编辑工程和干净副本独立渲染。
- [x] 一镜到底、复杂 SVG 路径动画和高级 Three.js 场景验收：复用现有卡片与 `MotionStage`，经过完整 Film、G1/G2、真实 MP4、导出及干净副本编辑后重渲染；具体能力边界见 [`pipelines/advanced-scenes.md`](../../pipelines/advanced-scenes.md)。
- [ ] 音乐结构驱动、角色场景和音乐故事完整片种。

验收：上述已勾选项均有对应 CLI、校验或真实渲染产物。五类输入的草案与既有技术样片不等于所有完整片种均已完成；音乐结构驱动、角色场景和音乐故事仍不计入已验收能力。

## 验证产物

### 技术路线样片（阶段 3）
- `output/film.mp4`：16 秒、五镜、含 BGM 的技术路线样片。
- `output/contact-sheet.jpg`：全片抽帧接触表。
- `output/final-frame.jpg`：末帧检查。
- `output/workbench.png`：工作台浏览器实测截图。

### 独立工程与框架验证（阶段 3.5）
- `output/skill-optimization/framework-e2e/`：独立工程端到端验证日志（create、目标校验、负向门禁、G1/G2、有声样板镜、工作台写回/审批重置/安全拦截、3D 全片渲染）。
- `output/skill-optimization/3d-fix-logs/`：3D 场景 WebGL 渲染修复验证（`swangle` 渲染 120/120 帧、ffprobe、抽帧）。
- `output/projects/`：五类输入草案及 G1/G2 验证项目。

### 高级场景（阶段 5）
- `output/advanced-scenes/<run-id>/verification.json` 与 `verification.md`：三类完整 Film 的 G1/G2、帧数、时长、非空像素、完整解码、导出 QA 和干净副本编辑后重渲染证据。
- `output/advanced-scenes/<run-id>/<scenario>/`：长镜头、SVG、Three.js 各自的抽帧、接触表、ffprobe 和分阶段日志。
- `output/advanced-scenes/<run-id>/deliveries/`：三类场景的完整可编辑交付包。运行 `npm run advanced:verify` 可重新生成。
