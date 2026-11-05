# 高级场景制作与验收指引

本指引覆盖一镜到底、复杂 SVG 路径形变和高级 Three.js 三类场景。它们都复用现有注册卡、场景组件、`MotionStage` 与完整 `Film` 合成，不新增场景框架，也不把卡片单预览当作完整 Film 验收。

## 1. 能力边界与选型

| 能力 | 已验收卡片 | 真实场景组件 | 完整 Film fixture | 验收时长 |
| --- | --- | --- | --- | --- |
| 一镜到底 | `transition/long-take-world` | `scene/kinetic-title` | `scripts/fixtures/advanced-scenes/long-take.json` | 120 帧 / 4 秒 |
| 复杂 SVG 路径形变 | `interaction/gooey-morph` | `scene/svg-journey` | `scripts/fixtures/advanced-scenes/svg.json` | 120 帧 / 4 秒 |
| 高级 Three.js | `effects/three-crystal` | `scene/three-launch` | `scripts/fixtures/advanced-scenes/three.json` | 120 帧 / 4 秒 |

这些 fixture 都是单场景但完整的 Film IR，经过 `Film` 的 `calculateMetadata`、时间线、目标校验和真实 MP4 渲染。它们用于证明制作链路和能力边界，不代表已存在通用的长镜头、任意路径插值或自由三维场景生成器。

## 2. 一镜到底：固定两幕纵深穿透

### 何时使用

- 适合“概念 → 终局”“设想 → 事实”这类固定两幕空间叙事，希望镜头连续推进而不是直接切镜。
- 需要暗色、纵深、穿越卡片的发布或故事段落时，可选择 `transition/long-take-world`。
- 不适合多站点世界地图、可配置相机路线、快节奏多信息阅读，或两幕文案必须始终清晰可读的场景。

### 视觉与时长约束

- 当前实现是固定两幕的 CSS 3D `translate3d` 穿透，不是 README 所描述的可配置多站点 `WorldRig`。卡内文案、两幕结构和路线不由 Film `props` 参数化，验收结果不能外推为自定义长镜头引擎。
- 30fps 下，前 36 帧停留，约第 36–96 帧连续推进，之后保持第二幕。虽然 manifest 允许 90 帧，完整制作建议至少 120 帧，避免切掉落定和阅读时间；需要更长停留可增加 Film 场景时长。
- 中段两幕会交叠穿透，这是空间过渡而非新的阅读停点。G1/G2 不应把中段交叠帧当作正文排版审查，应分别检查首幕、过渡连续性、第二幕落定和末帧。
- 该卡不依赖 WebGL，但仍需检查低分辨率下的文字可读性、交叠时的视觉混乱和长停留是否拖沓。

## 3. 复杂 SVG：闭合路径几何形变

### 何时使用

- 适合一个母体裂变为 3～4 项并列证据、平台或交付物，需要观众看见轮廓本身连续改变的场景。
- 使用 `interaction/gooey-morph`；`interaction/draw-svg-trace` 和 `media/svg-path` 只负责描边生长，不再列为本项形变验收卡。
- 不适合任意两个 SVG `d` 字符串互转、通用 Logo morph、超过 4 张分裂卡片或大段正文阅读。

### 路径与视觉约束

- 本卡把圆角母体和四瓣曲线各表示为 16 个锚点，逐帧插值后生成 16 段三次贝塞尔曲线。同一个 `<path data-gooey-morph-path>` 的 `d` 在起始、中段与末帧必须实际不同，不能用 `strokeDashoffset`、整体位移或改名冒充 morph。
- 路径配合 `feGaussianBlur + feColorMatrix` 粘连滤镜；标题和分裂卡片不参与模糊。卡片文字来自 Film `props.title/steps`，最多取前 4 项。
- 30fps 下，形变区间为分镜时长的 25%～65%，分裂落位为 55%～85%。建议完整使用至少 120 帧，避免末段阅读时间不足；该能力仍不是任意路径插值框架。
- 重点检查曲线闭合、形变中段没有异常自交或裁切、滤镜没有模糊文字、末帧轮廓与四张卡片完整。小尺寸冒烟通过后仍需按最终交付分辨率复核。

## 4. 高级 Three.js：程序化晶体与 HTML 合成

### 何时使用

- 适合产品揭示、科技主题、音乐高潮或片尾视觉母题，使用 `effects/three-crystal` 和 `scene/three-launch`。
- 当前卡提供低面数十二面体、确定性帧驱动旋转、环境光/方向光/点光源，以及可编辑的 HTML `text` 标题；主题色会驱动材质与灯光。
- 不承诺外部 glTF/FBX 模型、HDR 环境贴图、自定义 Shader、自由相机漫游或折射晶体。这些能力不在本工单范围内。

### 性能与渲染约束

- Three.js 渲染必须显式使用 `--gl swangle`。`swangle` 通过 ANGLE 使用 SwiftShader 软件渲染，无 GPU 环境也可创建 WebGL 上下文，但速度通常低于硬件渲染。
- 先用 fixture 的 640×360、120 帧验证链路，再按目标分辨率制作。提高分辨率、几何面数、灯光数量或并发都会增加软件光栅化成本；保持项目默认 `--concurrency=2`，不要在无实测依据时提高并发。
- 当前卡不加载网络模型或 HDR，适合离线独立工程。新增外部三维资源前必须补本地化、路径校验和离线性验收，不能沿用本 fixture 的通过结论。
- G2 至少检查首帧、中段旋转和末帧，确认晶体不是黑屏/纯色、HTML 标题在画布上层且不被裁切。真实成片还应检查相邻帧运动，而非只看一张静帧。

## 5. G1/G2、QA 与交付

常规项目仍按既有门禁执行：

```bash
npm run validate -- --project <id>
npm run forge -- approve-design --project <id>
npm run forge -- render --project <id> --scope sample --gl swangle --bundle-cache=false
npm run forge -- approve-sample --project <id>
npm run forge -- render --project <id> --scope film --gl swangle --bundle-cache=false
npm run forge -- export --project <id>
```

- G1：确认选卡与真实内容匹配，尤其确认长镜头的固定文案和 SVG 卡最多 4 项的分裂文字可接受；检查时长不会截断关键动作。
- G2：必须渲染真实样板镜，不以 Gallery 或卡片单预览代替。确认路径 `d` 的实际插值、曲线闭合、空间穿透、三维主体、标题和画面边界。
- 全片 QA：核对 Film 总帧数、fps、时长、宽高、H.264 编码与完整解码；人工查看抽帧接触表，机器像素检查不能替代审美和路径判断。
- 导出：现有 `forge export` 会把实际卡号写入 `scene-card-registry` 证据，并检查目标 Film、G1/G2、帧数、完整解码和交付安全。交付母版为 `video/film.mp4`，可编辑事实源位于 `output/projects/<id>/film.json`。

## 6. 一键回归与证据

```bash
# 三类完整 Film、导出及独立副本验证
npm run advanced:verify

# 单类小步回归
npm run advanced:verify -- --only long-take
npm run advanced:verify -- --only svg
npm run advanced:verify -- --only three

# 保留模板外临时独立工程，供失败诊断
KEEP_FIXTURE=1 npm run advanced:verify
```

脚本沿用 `tsx`、CLI、ffprobe/ffmpeg 和真实 Remotion 渲染，不引入测试框架。每类场景都会：

1. 在模板外创建独立工程，执行全量卡片与目标 Film 校验；SVG 场景还直接检查 QA 帧的真实标记，要求同一路径包含多段三次贝塞尔曲线且至少出现 3 种 `d`。
2. 经过 G1、真实样板镜、G2 和 swangle 全片渲染，验证帧数、时长、尺寸、fps 和完整解码。
3. 解码全部帧为灰度像素，拒绝 QA 帧为空白或近均匀画面，并记录抽帧间最大平均像素差；同时输出原始 PNG 抽帧和接触表供人工复核。
4. 执行 `forge export`，要求现有 10 项 QA 全部通过，并确认交付包包含实际 Film fixture、MP4、QA 和可编辑工程。
5. 复制到干净交付副本，在无 API 密钥环境中独立执行 `npm ci`、目标校验和构建；随后把场景时长增加 15 帧，重新经过 G1/G2 和真实渲染，证明可继续编辑而不是只能播放母版。

每次结果写入 `output/advanced-scenes/<run-id>/`：

- `verification.json` / `verification.md`：每类帧数、时长、像素指标、QA 和独立渲染证据；SVG 另含 `pathMorph.frames / uniquePaths / cubicSegments`。
- `<scenario>/contact-sheet.jpg`、`frames/`、ffprobe JSON 与各阶段日志。
- `deliveries/<project-id>/`：未经后续干净副本修改的完整交付包。

fixture 故意不含音轨，以隔离高级视觉链路；实际项目的 BGM/Voice/SFX 仍须运行既有音频验证与 QA，不能把本脚本的无音轨通过当作混音验收。
