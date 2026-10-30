# 场景 Pipeline：用户多模态素材混剪 (Assets-to-Video)

本指南指导 Agent 基于用户提供的本地现有素材（如：几张产品照片、一段屏幕录制、一段手机实拍视频、一段口播音频录音等多种混合资源），进行标准化预处理、分层时钟编排与电影级视觉包装。

---

## 一、场景定位与适用范围

- **典型输入**：
  - 用户录制的口播音频（.mp3 / .wav / .m4a）
  - 产品界面截图、实物白底图或活动现场照片（.png / .jpg / .webp）
  - 实拍短视频片段或软件操作录屏（.mp4 / .mov）
  - 品牌专属 Logo、UI 图标、矢量源文件（.svg）
- **常见输出片种**：
  - 产品发布与功能操作实机演示
  - 个人 IP 口播 Vlog / 知识分享高质感包装短视频
  - 企业年度成果、案例分享宣讲视频

---

## 二、素材标准化预处理与分层架构

收到用户素材后，Agent 应先进行结构化分类与技术清洗：

```text
               ┌── A-Roll (主叙事轨)：口播语音或核心实拍视频 ── 确立主时钟 (Master Clock)
[用户本地素材] ─┤
               └── B-Roll (补充视觉轨)：截图、辅助图片、示意短片 ── 画面空间包装与动态激活
```

### 1. 声音主时钟 (A-Roll Voice)
- 若素材包含口播录音，口播人声即为**绝对主时钟**；
- 进行语音静音切片探测，剔除录音首尾空白，按语音自然停顿将音频切分为对应的分镜段落。

### 2. 静态图片“动态激活”铁律 (Activating Static Images)
**绝对禁止将静态图片生硬、呆板地贴在屏幕正中一动不动！**
Agent 必须运用运动能力为静态素材注入呼吸感与空间感：
- **电影级微运镜**：将图片作为背景或主体，施加缓慢连续的前推 `camera/slow-push`、拉远 `camera/slow-pull` 或大倾角俯视巡游 `camera/overhead-camera-moves`；
- **拟物与实体质感**：
  - 针对票据、便签、代码片段、现场快照，使用美纹纸胶带拍贴 `component/masking-tape-slap` 将其“贴”在画面上；
  - 针对折叠图纸、产品结构卡片，使用立体纸艺挺立 `component/popup-book-rise` 展现“开箱弹出”感；
  - 针对电子屏幕截图，置入悬浮设备外壳 `component/device-mockup-float` 或毛玻璃面板 `component/glassmorphism-card`。

---

## 三、动效选型与装配灵感（开放自由，自主决策）

**Agent 拥有完全的艺术自主权，根据用户素材的质地和行业属性自由挑选动效卡。**

以下提供常见灵感设计思路，**绝不作排他性限制**：

### 1. 科技产品 / 软件功能演示向 (Software Demo & Tech)
- **视觉要点**：突出界面交互的流畅度与生产力提升；
- **动效灵感库**：
  - 交互触发：使用悬浮命令面板 `component/command-palette-summon`、光标点击波纹 `component/impact-feedback`；
  - 多图/多状态对比：左右分屏滑块对比 `media/split-compare`、分步卡片飞入 `component/stack-reveal`；
  - 数据亮点：数值增长滚动 `component/number-counter`、动态折线图 `component/chart-live-moves`；
  - 转场设计：多维立方体翻转 `transition/cube-rotate`、推拉推进 `transition/push-through`。

### 2. 个人品牌口播 / 知识博主向 (Personal Creator & Vlog)
- **视觉要点**：视线高度聚焦主讲人观点，动态字条与高能插画辅助理解；
- **动效灵感库**：
  - 提纲契领：划线高亮文字 `text/highlighter-sweep`、机场翻牌重点 `text/split-flap-flip`；
  - 金句强化：过曝红晕冲光 `text/halation-bloom`；
  - 轻松日常插片：拍立得照片散落入场 `media/photo-polaroid-scatter`；
  - 转场设计：高速甩镜头模糊转场 `transition/whip-pan`、纸飞机飞掠 `transition/paper-plane-messenger`。

---

## 四、CLI 操作指引

1. **多素材联合初始化**：
   ```bash
   npm run forge -- init \
     --input "./assets/narration.mp3" \
     --input "./assets/screenshot-01.png" \
     --input "./assets/product-photo.jpg" \
     --name "product-launch"
   ```
   系统会将所有素材拷贝并记录到 `output/projects/<id>/assets.json`。
2. **编排分镜并呈报 G1 评审**：
   - 在 `design-review.md` 中说明每个分镜对应哪张图片/音频，使用了什么运镜和包装方式；
   - 待用户确认后执行：
     ```bash
     npm run forge -- approve-design --project <id>
     ```
3. **渲染 G2 样板镜（检查图片画质、缩放比例与口播音画对齐）**：
   ```bash
   npm run forge -- render --project <id> --scope sample
   ```
4. **全片合成与交付**：
   ```bash
   npm run forge -- approve-sample --project <id>
   npm run forge -- render --project <id> --scope film
   ```
