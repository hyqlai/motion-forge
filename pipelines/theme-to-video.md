# 场景 Pipeline：纯主题自主规划成片 (Theme-to-Video)

本指南指导 Agent 在用户仅提供一个抽象概念或一句话主题（如：“为什么人类需要睡眠”、“黑洞引力与时空扭曲”、“极简主义生活哲学”）时，完全自主承担**选题拆解、剧本编排、素材自动检索、配音对齐与代码动画渲染**的全流程。

---

## 一、场景定位与适用范围

- **典型输入**：
  - 一句话概念、疑问句或命题（“量子纠缠是如何工作的？”、“Web3 演进史”）
  - 某个名著、哲学格言或经典商业案例
- **常见输出片种**：
  - 深度科普与硬核通识视频（1~3 分钟）
  - 哲学思辨与认知升级短片（1~2 分钟）
  - 商业战略与科技趋势观察（1~3 分钟）

---

## 二、内容策划心法：黄金圈叙事法 (The Golden Circle)

当用户只提供一个主题时，最忌讳平铺直叙、堆砌百科定义。Agent 应使用成熟的视听叙事框架策划 3~5 幕结构：

```text
第 1 幕：Why 破局点 (Hook 黄金3秒)
   └─ 颠覆直觉 / 抛出尖锐反常识疑问 / 制造认知真空
      ↓
第 2 幕：How 机理拆解 (Core Mechanics 递进论证)
   └─ 3 个核心逻辑支撑点，层层剖析本质，用具象图表化解深奥概念
      ↓
第 3 幕：What 终极认知升华 (Synthesis & Golden Takeaway)
   └─ 总结心智模型 / 落地启发金句 / 留白回味
```

---

## 三、资源检索与多模态组装

1. **公版免费资源检索（Zero-Copyright Assets）**：
   - **高清写实画面/纹理**：自动通过 Pexels / Unsplash 免费 API 检索 1080p/4K 无版权素材，并由 `providers/resources.ts` 规范下载落盘至项目本地；
   - **矢量图标与符号**：按需匹配简洁的 SVG 几何图形，保证在各种画幅下矢量无损；
   - **背景垫乐 (BGM)**：根据主题气质匹配无版权背景音乐（科技沉思类选 Minimal Ambient，热血科普类选 Percussion Pulse）。通过 `npm run forge -- bgm --project <id> --query "..."` 从 Pixabay Music 检索并下载到项目 `public/`，未配置 `PIXABAY_API_KEY` 时不发起外部请求。
2. **语音合成与时钟锚定 (TTS Pipeline)**：
   - 将撰写打磨后的文案送入语音模型（如 Fish Audio TTS），生成质感沉稳专业的配音；
   - 提取字级（Word-level）时间戳，作为整个视频的绝对时钟锚点。

---

## 四、动效选型与视觉灵感（开放自由，自主决策）

**Agent 拥有完全的艺术自主权，根据主题的题材自由挑选动效卡。**

以下提供常见题材的设计思路作为灵感参考，**绝不作排他性限制**：

### 1. 硬核科普与自然科学向 (Science & Technology)
- **视觉风格**：深邃蓝黑底色、精密刻度线、发光数据流、矢量几何；
- **动效灵感库**：
  - 开篇解构：高科技字符解码 `text/scramble-decode` 或黑客乱码矩阵；
  - 物理/数学演示：重力沙粒沉降 `component/particle-sand-fill`、动态折线柱状图 `component/chart-live-moves`；
  - 概念演进：几何路径逐步生长 `media/svg-path`、分步卡片层叠 `component/stack-reveal`；
  - 运镜与转场：空间 3D 自由巡游 `camera/space-camera-moves`、色块精准切入 `transition/color-block-step-wipe`。

### 2. 哲学思辨与人文历史向 (Philosophy & Humanities)
- **视觉风格**：大地暖灰、高级黑白高对比、大量呼吸感留白；
- **动效灵感库**：
  - 沉静金句：电影胶卷红晕冲光 `text/halation-bloom`、典雅引用框 `text/quote-card`；
  - 心理张力：希区柯克反向滑动变焦 `camera/dolly-zoom` 产生时空剥离感；
  - 环境氛围：星空与灰尘微粒漂浮 `environment/canvas-particles`；
  - 转场切换：暗色深邃隧道 `transition/dark-tunnel` 或柔和淡变。

### 3. 商业洞察与产品概念向 (Business & Product Vision)
- **视觉风格**：高纯度企业品牌色、玻璃拟态、三维立体构件；
- **动效灵感库**：
  - 核心亮点：Three.js 悬浮多面体自转 `component/three-crystal`；
  - 效率交互：命令面板弹跳 `component/command-palette-summon`；
  - 跨越式增长：数字冲刺狂飙破百并炸裂物理纸屑 `component/counter-confetti`；
  - 转场切换：3D 立方体多面翻转 `transition/cube-rotate`。

---

## 五、CLI 操作指引

完整字段约束与 URL 事实追溯规则见 [`pipelines/content-planning.md`](content-planning.md)。

1. **建立独立工程并生成内容策划工作单**：
   ```bash
   # 在技能/template 目录生成独立工程
   npm run forge -- create --dir /absolute/project --input "为什么人类需要睡眠" --name "sleep-science"
   # 进入 PROJECT_ROOT 后生成结构化策划模板
   npm run forge -- plan --project "sleep-science"
   ```
   Agent 用自身 LLM 填写 `output/projects/sleep-science/content-plan.json`，替换全部 `<填写：…>` 占位符并把 `status` 改为 `ready`。
2. **校验并转换为 Film IR，呈报 G1 评审**：
   ```bash
   npm run forge -- apply-plan --project "sleep-science"
   ```
   命令会校验叙事弧线、时长分配、Film Schema、场景/卡片注册与素材；通过后写入 `film.json` 和 `design-review.md`，项目停留在 `design-review`。
   - 在 `design-review.md` 中向用户呈报文案、上屏金句与动效选型；
   - 待用户确认后执行：
     ```bash
     npm run forge -- approve-design --project <id>
     ```
3. **渲染 G2 样板镜（检查有声配音与画面配合度）**：
   ```bash
   npm run forge -- render --project <id> --scope sample
   ```
4. **全片合成与交付**：
   ```bash
   npm run forge -- approve-sample --project <id>
   npm run forge -- render --project <id> --scope film
   ```
