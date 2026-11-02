---
name: motion-forge
description: Use when creating or revising code-driven videos (Remotion + React 19 + Three.js + SVG + Canvas 2D) from a URL, instrumental audio, song, theme, or mixed assets (images/video/narration). Supports documentaries, science explainers, music stories, product launches, promos, and philosophical essays. Enforces G1 storyboard/design review and G2 sample-scene review gates, provides an open catalog of 265 motion cards across 9 specialized domains without restricting creative combination, modular scenario pipelines, and outputs editable Remotion projects with browser workbench.
---

# Motion Forge: Code-to-Video (Code2Video) 工业级制作技能主指南

本项目本身即为一个完全自包含、可独立分发的 **Code-to-Video 工业级 Skill**。系统基于 **Remotion 4.x + React 19 + TypeScript + Three.js (@remotion/three) + Canvas 2D + SVG** 统一多技术栈内核，内置 **265 张原子解耦动效卡**（划分为 9 大专业领域）、底层视觉基座（`_shared/`）、可视化本地调试工作台与严格的 **G1/G2 两道质量确认门禁**。

---

## 目录
1. [核心架构与五大技术铁律](#一核心架构与五大技术铁律)
2. [两道质量确认门禁标准作业程序 (G1 & G2 Gates SOP)](#二两道质量确认门禁标准作业程序-g1--g2-gates-sop)
3. [多场景独立流水线体系 (Scenario Pipelines)](#三多场景独立流水线体系-scenario-pipelines)
4. [265 张动效卡全景资产与导演决策心法 (Creative & Open Motion Design)](#四265-张动效卡全景资产与导演决策心法-creative--open-motion-design)
   - [开放式选型原则：不设限的艺术想象力](#1-开放式选型原则不设限的艺术想象力)
   - [九大领域动效分类资产全景 (265 张卡)](#2-九大领域动效分类资产全景-265-张卡)
   - [六大片种经典灵感组合范式 (仅供启发，自由创新)](#3-六大片种经典灵感组合范式-仅供启发自由创新)
   - [四槽位装配规范与客观质量红线](#4-四槽位装配规范与客观质量红线)
5. [Film IR 分镜协议与多技术栈渲染规范](#五film-ir-分镜协议与多技术栈渲染规范)
6. [CLI 工具链全生命周期与本地工作台交互](#六cli-工具链全生命周期与本地工作台交互)
7. [最终交付与故障排查清单](#七最终交付与故障排查清单)

---

## 一、核心架构与五大技术铁律

在编写任何视频分镜或渲染代码前，Agent 必须坚守以下五条不可妥协的设计纪律：

1. **绝对解耦与局部时钟原则（Local Frame Only）**：
   - 每个分镜（Scene）只使用局部帧号（`frame 0` 到 `durationInFrames`），严禁在分镜内部硬编码全片绝对时间戳（`absoluteFrame` 或 `from`）。全片绝对时钟由 Core 层通过时间线累加编译；
   - 分镜之间**严禁跨模块互相 `import` 内部组件**。所有分镜共享的状态必须通过 `Film IR` 的 `props` 传入；
   - 动效卡（Cards）只承载运动数学与视觉逻辑，严禁将项目专有的具体文案或业务图片路径写死在卡片内部。

2. **纯函数帧时钟确定性（Frame-Deterministic Execution）**：
   - 所有的动画变形、物体位移、透明度变换必须是当前局部帧 `frame` 的纯数学计算函数：$Value = f(frame)$；
   - **严禁**使用浏览器的 `requestAnimationFrame`、`setInterval`、`setTimeout` 或外部自运行时间线；
   - **严禁**使用未置种子的无参 `Math.random()`（必须使用 Remotion 内置带种子的 `random(seed)`），确保同一帧无论何时 seek 渲染，画面像素 100% 幂等一致。

3. **真实素材本地闭环原则（Local Assets Only）**：
   - 渲染引擎禁止在视频合成中直连外部远程未经验证的 URL（防范断网、防盗链与请求延迟）；
   - 外部图片、视频片段、音频配乐必须由 Providers 提前下载落盘至项目本地目录，并于 `assets.json` 中统一注册管理。缺失的素材必须显式标记并向用户申报，**严禁静默占位或假数据糊弄**。

4. **多技术路线统一帧渲染哲学（Multi-Tech Rendering）**：
   - 排版与交互 UI 采用 **HTML/CSS + Spring 弹性动画**；
   - 几何轮廓、连线、图表与遮罩采用 **SVG 路径插值**；
   - 粒子、流体与数万高频运动点采用 **Canvas 2D**；
   - 3D 立体模型、空间光影与三维运镜采用 **Three.js (@remotion/three)**。
   - 所有技术路线统一服从 Remotion 的 `useCurrentFrame()` 帧同步时钟。

5. **项目工程独立化原则（Standalone Project）**：
   - 本技能目录只承载流程规范、动效卡参考、通用运行时模板和 `forge create` 工程生成器；**用户项目的全部内容**（`core/`、`cards/`、`scenes/`、`public/` 素材、`film.json`、`package.json`、工作台与渲染产出）必须落位在用户项目自己的目录中，独立 `npm ci`、独立校验和渲染，可脱离技能目录运行；
   - 严禁把项目专属代码/素材写进技能目录，也严禁用软链接把项目内容挂回技能目录——`forge create` 将运行时、动效卡和默认 Film 以真实文件拷贝到项目，项目专属分镜组件直接写在项目的 `scenes/` 下；
   - 技能目录内 `output/projects/` 与 CLI 的门禁流程仅适用于技能自带示例；真实项目的 G1/G2 评审记录保存在项目目录内。

   **新项目初始化（输入：项目绝对路径与输入素材；输出：可独立安装依赖的工程骨架）**：
   1. 在模板目录运行 `npm run forge -- create --dir /absolute/project --input <输入> [--audio-kind song|instrumental] [--name <id>]`。目标必须是模板之外的空目录，命令会生成完整运行时副本、复制本地素材到 `public/assets/<id>/` 并创建项目草稿；
   2. 初始化完成后进入 `PROJECT_ROOT`，执行 `npm ci`、`npm run validate -- --project <id>`。真实项目的代码、素材、Film IR、审批状态和输出都由 `PROJECT_ROOT/output/projects/<id>/` 与 `PROJECT_ROOT/public/` 自包含；
   3. 本地素材只使用 `public/` 下的相对路径；远程来源仅作为来源元数据记录，不进入渲染引用。缺素材立即停止，不能让项目以绝对路径或外部软链接冒充独立工程；
   4. 后续所有命令先执行 `cd <PROJECT_ROOT>`，再运行项目内脚本。渲染产物与评审记录不得写回模板目录；
   5. 模板目录仅在 `create` 时作为只读来源。生成后，项目中的 import、npm 依赖、脚本和素材引用不得再指向该目录。

### 失败分支与恢复路径

| 触发条件 | 一线处理 | 仍失败或需要变更时 |
| :--- | :--- | :--- |
| 项目根目录不明确，或即将写入技能目录 | 停止写入，与用户确认项目绝对路径；后续命令均以该项目目录为工作目录 | 未获得明确路径前只讨论方案，不创建文件 |
| 必需素材缺失、不可读或授权不明 | 报告具体路径与原因，暂停受影响分镜；不得静默占位或编造素材 | 由用户补充素材或明确批准替代方案，并同步修订 G1 |
| G1 未获确认或被要求修改 | 停留在设计阶段，修订 `film.json` 与 `design-review.md` | 不制作样板镜，不执行 G1 审批命令 |
| 样板镜出现黑屏、音画错位、文字越界或质感不合格 | 保持 G2 锁定，定位到具体分镜并修复，只重渲样板镜 | 再次提交 G2；不得用全片渲染代替样板验证 |
| 已审批的叙事、布局、时长、素材或音频发生变化 | 使原 G1/G2 结论失效，回到 G1 重新确认受影响范围 | 新 G1 通过后重新制作并确认有声样板镜 |
| 构建、校验或渲染命令失败 | 保留完整日志，修复根因后重跑同一命令；不得注释报错或跳过校验 | 仍未通过则停止交付，明确报告阻塞项和已完成的验证 |
| 独立性扫描发现外部绝对路径、`file:` 依赖或指向技能目录的软链接 | 将所需代码或素材真实拷贝进项目，改为项目内引用 | 在隔离副本中重新安装并渲染；未通过不得宣称可独立运行 |

---

## 二、两道质量确认门禁标准作业程序 (G1 & G2 Gates SOP)

为了防止 Agent “凭空想象、盲目堆砌代码、造成严重计算浪费和预期偏离”，系统强制规定**两道确认门禁（Two-Gate Review）**。**严禁跳过门禁直接渲染全片！**

```text
[用户输入] 
   ↓
[需求分析 & 素材筹备] 
   ↓
[编写 Film IR 草稿] 
   ↓
【🔴 CHECKPOINT G1：分镜与设计确认】 → 向用户呈现排版清晰的剧本与视觉表，STOP 等待批准
   ↓ (用户确认通过后执行 npm run forge -- approve-design)
[制作真实有声样板镜] 
   ↓
【🔴 CHECKPOINT G2：有声样板镜确认】 → 渲染代表镜视频，用户审查真实视听质感与音画对齐，STOP 等待批准
   ↓ (用户确认通过后执行 npm run forge -- approve-sample)
[全片代码装配与批量渲染]
   ↓
[最终交付 (MP4 + 可编辑工程 + 工作台)]
```

### 1. G1 门禁：分镜与视觉设计确认 (Design Review)
在编写任何复杂渲染代码前，Agent 必须先完成《G1 分镜与视觉设计方案》，并向用户呈报一份排版清晰的 Markdown 评审文档，至少包含：
- **基本属性**：片种类型、目标受众、画幅比例（横屏 16:9 / 竖屏 9:16）、目标总时长与帧率（如 30fps）；
- **视觉主题**：主色调、背景色、文字主色、高亮强调色（Accent）、排版字体族；
- **主时钟选型**：口播语音对齐 / 歌曲歌词对齐 / 纯音乐节拍网格 / 文本阅读时长；
- **分镜剧本详表**（必须严格按照下表格式向用户呈现）：

| 分镜序号 | 镜头名称 | 叙事目的与语义 (Semantic) | 实际上屏文字 (On-Screen Text) | 画面布局与元素 | 主动效卡 (Primary) | 运镜卡 (Camera) | 转场卡 (Transition) | 局部时长 (Frames/Sec) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| S01 | 开篇破局 | Hook 钩子：制造悬念 | "为什么 90% 的企业AI转型以失败告终？" | 居中巨大高对比标题 + 红色告警发光底板 | `typography/halation-bloom` | `camera/slow-push` | `transition/cube-rotate` | 90f (3.0s) |
| S02 | 数据展示 | Data 证明：给出惨烈统计 | "78% 停留在玩具阶段<br>12% 产生负向ROI" | 左右双列对比面板 + 动态数字与落砂图表 | `data/particle-sand-fill` | 无 | `transition/whip-pan` | 150f (5.0s) |

- **🔴 CHECKPOINT · STOP**：向用户展示完毕后，必须结束本轮并询问是否同意分镜规划；不得在同一轮执行审批、制作样板镜或渲染全片。
- **通过信号**：只有用户在后续回复中明确确认 G1 后，Agent 才在 `PROJECT_ROOT` 运行：
  ```bash
  npm run forge -- approve-design --project <project-id>
  ```

### 2. G2 门禁：有声样板镜确认 (Sample Review)
G1 确认通过后，**不得立刻渲染全片**。必须挑选全片最具代表性、视觉最复杂、包含真实音画元素的 1 个分镜（通常为 Hook 镜头或核心高潮镜头），制作并渲染为样板镜视频：
- **渲染命令**：
  ```bash
  npm run forge -- render --project <project-id> --scope sample
  ```
- **质检要点**：
  - 音画是否精确同步？字幕是否在发音开始前 1~2 帧入场？
  - 画面文字是否存在遮挡、折行破坏、超出安全区？
  - 动效速度与音乐情绪是否匹配？是否给人呼吸感？
- **🔴 CHECKPOINT · STOP**：提供真实样板镜视频与质检结果后，必须结束本轮并等待用户审查；不得自行代替用户批准 G2。
- **通过信号**：只有用户明确确认样板镜后，才在 `PROJECT_ROOT` 运行：
  ```bash
  npm run forge -- approve-sample --project <project-id>
  ```
- 只有完成 G2 审批后，项目状态机才解锁全片最终渲染权限！

---

## 三、多场景独立流水线体系 (Scenario Pipelines)

不同输入类型的端到端处理逻辑拆分为独立的指导文件，存放于 `pipelines/` 目录下。Agent 应根据用户输入的实际类型查阅对应指南：

| 场景类型 | 适用输入与片种 | 对应独立 Pipeline 指南文件 |
| :--- | :--- | :--- |
| **场景 1：URL 链接成片** | 博客、公众号、SaaS Landing Page、技术文档、新闻发布 | [`pipelines/url-to-video.md`](pipelines/url-to-video.md) |
| **场景 2：纯音乐音频成片** | 纯乐器、电子乐、史诗配乐；哲理片、卡点快闪、意境散文 | [`pipelines/instrumental-to-video.md`](pipelines/instrumental-to-video.md) |
| **场景 3：歌曲带人声成片** | 完整歌曲（演唱+伴奏）；动态歌词 MV、音乐叙事故事短片 | [`pipelines/song-to-video.md`](pipelines/song-to-video.md) |
| **场景 4：纯主题自主规划成片** | 一句话主题/命题；深度科普、人文哲学、商业洞察、通识短片 | [`pipelines/theme-to-video.md`](pipelines/theme-to-video.md) |
| **场景 5：用户多模态素材混剪** | 用户自有图片、截屏、短视频片段、口播录音；产品演示、Vlog | [`pipelines/assets-to-video.md`](pipelines/assets-to-video.md) |
| **场景扩展指南** | 如何扩展新的输入（如表格、PPT、双人播客等） | [`pipelines/extending-pipeline.md`](pipelines/extending-pipeline.md) |

---

## 四、265 张动效卡全景资产与导演决策心法 (Creative & Open Motion Design)

系统内建的 **265 张原子动效卡** 是 Agent 创作视频的视觉画笔。

### 1. 开放式选型原则：不设限的艺术想象力
- **严禁生搬硬套与教条限制**：本系统**绝不限定**“某种片种必须使用某些卡片”。相反，我们鼓励 Agent 依据文案的情感张力、叙事悬念、听觉节拍自主搭配与创新；
- **Agent 是真正的视觉导演**：动效卡是一套模块化积木。你可以用原本用于科技产品的 `interaction/command-palette-summon` 来表达古代思想家的“知识检索”；也可以用机场机械翻牌 `typography/split-flap-flip` 展现时空穿越或生命倒计时；
- **自由调节无级参数**：每张卡片均暴露了丰富的参数（如弹簧硬度、重力大小、模糊半径、粒子数量等），Agent 可在 `film.json` 的 `params` 中自由定制个性化运动手感。

---

### 2. 九大领域动效分类资产全景 (265 张卡)

所有 265 张卡片已完成规范化封装，支持横竖屏双模自适应，按领域完全内聚解耦：

| 类别 (Kind) | 目录与卡片总数 | 核心视觉职能 | 代表性卡片资产 (可在代码中直接引用) |
| :--- | :--- | :--- | :--- |
| **`camera` (运镜)** | `cards/camera/` (21张) | 空间推拉摇移、镜头焦段、透视畸变，为扁平画面建立纵深空间 | `dolly-zoom` (希区柯克滑动变焦), `slow-push` (深沉慢推), `slow-pull` (渐远拉出), `shot-crash-zoom-punch` (重击冲击变焦), `space-camera-moves` (三维空间翻滚), `tension-camera-moves` (地平线倾斜张力), `overhead-camera-moves` (俯视大跨度摇移), `whip-pan` (甩镜), `orbit-drift` (环绕漂移) |
| **`typography` (文字排印)** | `cards/typography/` (52张) | 标题入场、字幕律动、金句强化、代码终端、字符解码 | `split-flap-flip` (机场复古机械翻牌), `scramble-decode` (乱码矩阵解码), `halation-bloom` (胶卷红晕过曝冲光), `type-rhythm-sync` (节拍字幕对齐), `tracking-expand-reveal` (字距扩散展开), `terminal-typewriter` (黑客终端打字), `keyword-reveal` (关键词渐显), `quote-card` (典雅名言卡), `highlighter-sweep` (荧光笔划线标记), `cel-flash-stomp` (定格重击频闪) |
| **`interaction` (组件与交互)** | `cards/interaction/` (58张) | 拟物实体、交互部件、悬浮卡片、弹窗与光标协作 | `command-palette-summon` (Cmd+K 悬浮召唤), `stack-reveal` (卡片折叠展开), `popup-book-rise` (纸艺立体书挺立), `masking-tape-slap` (美纹胶带拍贴), `autolayout-gap-dial` (自动布局拨盘), `carousel-3d` (3D 轮播图), `theme-switch-moves` (主题切换涟漪), `collab-cursor-moves` (多光标协奏), `type-and-filter` (输入过滤), `glassmorphism-card` (毛玻璃面板) |
| **`data` (数据与图表)** | `cards/data/` (20张) | 物理粒子沉降、动态折线柱状、仪表盘、数字狂飙冲刺 | `particle-sand-fill` (重力落砂沉降), `counter-confetti` (数字冲刺狂飙+彩带纸屑), `number-counter` (翻滚计数), `chart-grow` (柱状折线生长), `chart-live-moves` (实时数据流), `gauge-readout-moves` (仪表指针跳跃), `before-after-slider-scrub` (前后对比滑杆), `scroll-brake-moves` (滚动刹车定格) |
| **`effects` (特效与光影)** | `cards/effects/` (22张) | 光晕扫光、HUD 扫描准星、三维自转晶体、氛围微粒场 | `three-crystal` (Three.js 三维自转晶体), `light-play-moves` (扫光漫射), `spotlight-sweep-moves` (探照灯掠影), `glow-flyline-moves` (发光飞线轨迹), `fui-hud-moves` (科技线框展开), `impact-feedback` (动漫重击冲击波), `canvas-particles` (数万流动微粒), `flying-words` (词云穿梭) |
| **`rhythm` (剪辑与节奏)** | `cards/rhythm/` (8张) | 节奏抽帧、快闪打断、分屏对决、蒙太奇切镜 | `beat-cut-moves` (节拍闪光快切), `speed-ramp-freeze` (变速定格批注), `quad-split-parallel-scenes` (四分屏平行视线), `panel-grid-moves` (漫画分镜格重排), `rhythm-interrupt-moves` (跳切重击推进), `trailer-grammar-moves` (预告片重击黑场) |
| **`commercial` (商业镜头)** | `cards/commercial/` (43张) | 产品宣讲镜头、品牌片头片尾、开场引题、最终落版 | `hook` (痛点钩子镜头), `price-card` (定价与方案卡), `features` (特性清单流), `store-card` (门店与位置指引), `fact-sheet` (事实说明清单), `brand-ink-open` (墨水扩散片头), `logo-shrink-wordmark-lockup` (Logo 收缩落版), `ui-to-brand-morph` (界面变异为品牌标志) |
| **`transition` (镜头转场)** | `cards/transition/` (26张) | 镜头边界处的时空变换与视线过渡，消除生硬跳切 | `cube-rotate` (3D 立方体多维翻转), `clock-wipe` (时钟指针擦除), `bubble-swarm-takeover` (气泡群聚遮罩), `color-block-step-wipe` (色块步进擦除), `paper-plane-messenger` (纸飞机穿梭), `push-through` (穿透推进), `whip-pan` (高速甩镜头模糊), `dark-tunnel` (暗调隧道穿梭) |
| **`media` (多媒体展示)** | `cards/media/` (15张) | 外部图片、视频片段的入场构图与画中画对比 | `media-pop-in` (轻快弹入), `split-compare` (左右分屏滑块对比), `svg-path` (矢量路径延展), `video-pip-float` (悬浮画中画), `photo-polaroid-scatter` (拍立得照片散落) |

> **底层基座 (`cards/_shared/`)**：提供全库通用的渲染原语（如 `SpeedBlur` 动态模糊、`softShadow` 双层物理柔阴影、`Stage` 舞台光源反光板）与商业排版字号自适应计算，不作为独立卡片对外暴露。

---

### 3. 六大片种经典灵感组合范式 (仅供启发，自由创新)

以下仅为常见风格的灵感搭配参考，**并非死板规则**。Agent 完全可以根据实际创意进行混搭：

- **科普与硬核通识 (Science Explainer)**：
  - *灵感搭配*：`typography/scramble-decode`（字符解码破局） + `data/particle-sand-fill`（物理落砂演示量级） + `media/svg-path`（概念连线） + `transition/color-block-step-wipe`。
- **哲学思辨与深度散文 (Philosophical Essay)**：
  - *灵感搭配*：`typography/halation-bloom`（高光胶片冲光） + `camera/dolly-zoom`（空间纵深抽离） + `typography/quote-card`（典雅引用） + `effects/canvas-particles`（微弱浮尘）。
- **科技产品与功能发布 (Product Promo)**：
  - *灵感搭配*：`effects/three-crystal`（三维构件亮相） + `interaction/command-palette-summon`（生产力呼出） + `data/counter-confetti`（性能破纪录） + `transition/cube-rotate`。
- **商业战略与数据看板 (Business & Strategy)**：
  - *灵感搭配*：`data/gauge-readout-moves`（仪表指针） + `data/chart-live-moves`（曲线生长） + `typography/highlighter-sweep`（数据标记） + `transition/clock-wipe`。
- **音乐情绪与动态 MV (Music Story & Lyrics)**：
  - *灵感搭配*：`typography/type-rhythm-sync`（主歌节拍字条） + `typography/cel-flash-stomp`（副歌定格重音） + `camera/shot-crash-zoom-punch`（重击冲撞） + `transition/whip-pan`。
- **复古手作与剪贴簿 (Scrapbook & Handcrafted)**：
  - *灵感搭配*：`interaction/masking-tape-slap`（胶带拍贴） + `interaction/popup-book-rise`（立体书升起） + `typography/split-flap-flip`（机械翻牌） + `transition/paper-plane-messenger`。

---

### 4. 四槽位装配规范与客观质量红线

每张分镜在 `film.json` 的 `motion` 属性中支持四个解耦槽位：
```json
{
  "motion": {
    "camera": { "cardId": "camera/slow-push", "params": { "scale": 1.15 } },
    "primary": { "cardId": "data/particle-sand-fill", "params": { "gravity": 1.2 } },
    "text": { "cardId": "typography/halation-bloom", "params": { "bloomIntensity": 0.8 } },
    "transitionOut": { "cardId": "transition/cube-rotate", "params": { "direction": "left" } }
  }
}
```

- **客观质量红线（必须坚守）**：
  1. **明确视觉焦点**：同一个分镜中，画面应有明确的主角。如果使用了剧烈的 `primary` 组件动效，运镜 `camera` 宜平稳呼吸；若运镜使用了强烈的 `shot-crash-zoom-punch`，组件内容宜保持相对静态，避免群魔乱舞导致视觉晕眩；
  2. **留足认知停留期（Cognitive Hold Time）**：动效完成入场展开后，画面文字与核心结构必须**保留至少 45~90 帧（1.5s ~ 3.0s）的稳定停留期**，确保观众能够从容阅读和理解，严禁刚做完动画瞬间切走；
  3. **文字长度与画幅匹配**：横屏单行文本建议不超过 22 个汉字，竖屏单行建议不超过 14 个汉字，防止折行重叠或冲出视频安全区。

---

## 五、Film IR 分镜协议与多技术栈渲染规范

`film.json` 是全工程的**唯一语义事实源**。

### 1. 标准 Film IR 结构
```json
{
  "id": "project-slug",
  "title": "项目视频标题",
  "genre": "explainer",
  "brief": {
    "goal": "核心叙事目标",
    "audience": "目标受众",
    "tone": "基调气质"
  },
  "output": { "width": 1920, "height": 1080, "fps": 30 },
  "theme": {
    "background": "#0a0f1d",
    "foreground": "#f8fafc",
    "accent": "#38bdf8",
    "fontFamily": "Inter, PingFang SC, sans-serif"
  },
  "scenes": [
    {
      "id": "scene-01",
      "title": "镜头名称",
      "intent": "叙事意图",
      "semantic": "hook",
      "durationInFrames": 90,
      "onScreenText": ["实际上屏主标题", "副标题说明文案"],
      "layout": { "kind": "center-headline" },
      "renderer": "html",
      "sceneComponent": "scene/stack-explainer",
      "motion": {
        "camera": { "cardId": "camera/slow-push" },
        "primary": { "cardId": "interaction/stack-reveal" },
        "text": { "cardId": "typography/scramble-decode" },
        "transitionOut": { "cardId": "transition/cube-rotate" }
      },
      "props": {},
      "qa": { "keyFrames": [20, 45, 80] }
    }
  ]
}
```

### 2. 双模自适应机制 (16:9 ↔ 9:16)
所有场景与卡片统一支持响应式缩放。在分镜代码中使用基准比例容器：
```tsx
import React from 'react';
import { useVideoConfig } from 'remotion';

export const AdaptiveStage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useVideoConfig();
  const isPortrait = height > width;
  const baseWidth = isPortrait ? 1080 : 1920;
  const baseHeight = isPortrait ? 1920 : 1080;
  const scale = Math.min(width / baseWidth, height / baseHeight);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: baseWidth, height: baseHeight, transform: `scale(${scale})`, flexShrink: 0 }}>
        {children}
      </div>
    </div>
  );
};
```

---

## 六、CLI 工具链全生命周期与本地工作台交互

### 1. 生命周期命令对照表

创建命令在模板目录运行；下表其余命令的工作目录必须是 `PROJECT_ROOT`。`<id>` 只作为 `PROJECT_ROOT/output/projects/<id>/` 内的项目标识。

| 步骤 | CLI 命令 | 说明与前置条件 |
| :--- | :--- | :--- |
| **1. 独立工程生成** | `npm run forge -- create --dir <absolute-project> --input <输入> [--audio-kind song\|instrumental] [--name <id>]` | 在模板目录生成独立工程，拷贝完整运行时，本地化素材并创建 `output/projects/<id>/film.json` 草稿 |
| **2. 目标项目校验** | `npm run validate -- --project <id>` | 在项目内校验目标 Film IR、卡片、场景、素材和输入路由；不能用内置示例通过代替目标项目检查 |
| **3. G1 设计审批** | `npm run forge -- approve-design --project <id>` | 用户确认分镜方案后执行，推进至 `sample-review` 阶段 |
| **4. 样板镜渲染** | `npm run forge -- render --project <id> --scope sample` | 渲染代表性分镜，在项目内生成 `output/projects/<id>/sample.mp4`；渲染前自动重验目标 Film |
| **5. G2 样板镜审批** | `npm run forge -- approve-sample --project <id>` | 用户确认样板镜质感后执行，推进至 `production` 阶段 |
| **6. 全片最终渲染** | `npm run forge -- render --project <id> --scope film` | 解锁全片合成，输出 `output/projects/<id>/film.mp4`；可传 `--browser-executable` 与 `--gl` 诊断渲染环境 |
| **7. 工程构建验收** | `npm run build` | TypeScript 与工作台构建均通过；不替代目标 Film 校验或真实渲染 |
| **8. 本地工作台** | `npm run workbench -- --host 0.0.0.0` | 启动项目内浏览器工作台（默认端口 5178） |

### 2. 本地工作台 (Workbench) 核心功能
项目工作台地址为 `http://127.0.0.1:5178/?project=<id>`；不带 `project` 参数时只显示内置示例：
- **🎴 动效卡库 Gallery**：全量 265 张卡片纯代码循环实时运行，支持搜索、右侧滑杆无级调节参数并一键写入当前分镜；
- **🎬 分镜制作工作台**：加载 `output/projects/<id>/film.json`，实时播放整片或单镜；修改文案和卡片后点击“保存 Film IR”写回项目；
- **审批重置**：工作台保存会改变已审批设计时，将项目退回 `design-review` 并使既有 G1/G2 结论失效。

---

## 七、最终交付与故障排查清单

### 1. 交付完整性检查
- [ ] **最终视频**：`PROJECT_ROOT/output/projects/<id>/film.mp4` 正常播放、声音清晰；
- [ ] **分镜事实源**：`PROJECT_ROOT/output/projects/<id>/film.json` 与视频分镜完全对应；
- [ ] **本地素材包**：`assets.json` 中素材已全部保存在项目内，渲染时不请求远程素材；
- [ ] **审批状态记录**：`project.json` 的 `status` 为 `production` 或 `delivered`，且 `designApprovedAt`、`sampleApprovedAt` 均有有效时间戳；
- [ ] **项目内验证**：在 `PROJECT_ROOT` 执行 `npm run validate -- --project <id>` 与 `npm run build`，目标项目校验和编译均通过；
- [ ] **独立渲染验证**：项目由 `forge create` 生成并在干净副本中重新执行 `npm ci`、`npm run validate -- --project <id>`、`npm run build` 和 `npm run forge -- render --project <id> --scope film`；扫描确认无模板目录绝对路径、`file:` 依赖或外部软链接，并将验证日志保存到 `PROJECT_ROOT/output/projects/<id>/verification/`；
- [ ] **可编辑工程交付**：项目包含运行时代码、动效卡、分镜、本地素材、锁文件和渲染脚本；只有实际启动工作台后才提供 `http://127.0.0.1:5178/?project=<id>` 链接。

仅通过 `npm run build` 或 import 检查不算独立渲染验证；最终 MP4、可编辑工程和验证记录必须全部从项目目录交付。

### 2. 常见故障排查
- **黑屏或丢帧**：检查 `sceneComponent` 是否已在注册表中声明，Three.js 是否置于 Remotion 纯帧时钟下；
- **文字出界重叠**：检查单行字数是否超标，是否包裹了 `AdaptiveStage`；
- **音画不同步**：检查秒转帧公式是否严格为 $Math.round(seconds \times fps)$。
