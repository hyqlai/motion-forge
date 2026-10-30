# 场景 Pipeline：纯音乐音频成片 (Instrumental-to-Video)

本指南指导 Agent 基于用户提供的一段纯音乐音频（WAV / MP3，无歌词、无人声），将其转化为视听同频、情绪共振的代码驱动视频。

---

## 一、场景定位与适用范围

- **典型输入**：
  - 纯器乐演奏（钢琴、管弦、原声吉他）
  - 电子音乐 / 氛围音效（Ambient / Lo-Fi / Synthwave）
  - 史诗感配乐 / 商业广告垫乐（Cinematic / Corporate Trailer）
- **常见输出片种**：
  - 哲理短片 / 人生思辨视觉散文
  - 快节奏卡点快闪 / 品牌态度宣言
  - 抽象艺术短片 / 空间意境视觉流

---

## 二、端到端工作流水线

```text
[用户提供纯音频]
   ↓
1. 音频特征工程 (probeAudio 获取总时长、BPM、能量波峰)
   ↓
2. 划分段落情绪与时间节拍网格 (Beat Grid)
   ↓
3. 策划视觉隐喻与叙事母题 (文字主题或纯视觉意象)
   ↓
4. 自由装配分镜与动效组合 (编写 Film IR)
   ↓
5. 【G1 门禁】提交分镜节拍与视觉方案，等待用户确认
   ↓
6. 【G2 门禁】渲染鼓点对齐的高潮样板镜，检验视听卡点
   ↓
7. 全片批量渲染与可交互交付
```

---

## 三、核心技术纪律：视听同步 (Audio-Visual Synesthesia)

在没有口播人声的场景下，**音乐的物理声学特征就是全片不可动摇的主时钟 (Master Clock)**：
1. **严格卡拍（Beat-Grid Locking）**：
   - 每个分镜的持续帧数必须精准对应音乐的节拍小节（例如 4 拍、8 拍、16 拍）。绝对禁止将转场切在重拍之前或半拍的荒诞位置；
   - 换算公式参考：若音频为 $BPM$，帧率为 $30 fps$，则一拍的帧数为 $FramesPerBeat = \frac{60 \times 30}{BPM}$。4 拍小节时长为 $4 \times FramesPerBeat$；
2. **能量曲线共振（Energy Mapping）**：
   - 视觉运动的激烈程度必须与音乐的物理分贝/声学能量波峰同步变化：音乐轻柔平缓时视觉微动克制；音乐进入 Drop/重音时视觉产生强烈冲击。

---

## 四、叙事构思与动效选型（开放自由，自主决策）

**Agent 拥有完全的自主权，根据音乐给人的通感体验自由选择表现手法与动效组合。**

以下提供常见风格的设计思路作为灵感参考，**绝不作排他性限制**：

### 1. 哲理思考 / 氛围叙事向 (Contemplative & Minimal)
- **音乐特征**：慢速钢琴、弦乐长音、Ambient、静谧水声；
- **视觉主题**：时间流逝、存在主义、认知迭代、自然规律；
- **动效灵感库**：
  - 文字表现：选用具有呼吸感、高光冲光的 `text/halation-bloom`，或优雅悬浮的 `text/quote-card`；
  - 运镜表现：选用缓慢深沉的纵深运镜 `camera/slow-push`，或具有戏剧性透视剥离感的反向变焦 `camera/dolly-zoom`；
  - 环境背景：底层搭配微弱的粒子空间浮动 `environment/canvas-particles`；
  - 转场设计：多用柔和渐隐、深隧暗道 `transition/dark-tunnel` 或自然切镜。

### 2. 动感快闪 / 科技节拍向 (Dynamic Kinetic & Upbeat)
- **音乐特征**：强劲鼓点、电子合成器、高 BPM（120~140+）、节奏重音明显；
- **视觉主题**：效率革命、突破边界、极限冲击、数字浪潮；
- **动效灵感库**：
  - 核心爆发：重音敲击帧选用瞬时变焦冲击 `camera/shot-crash-zoom-punch`；
  - 文字踩点：文字随节拍定格跳跃 `text/cel-flash-stomp`、字符高频闪现；
  - 组件活力：数据狂飙突破定格炸开彩带 `component/counter-confetti`；
  - 极限转场：高速甩镜头 `transition/whip-pan`、黑白单帧频闪或 3D 空间速翻 `transition/cube-rotate`。

### 3. 复古工控 / 工业机械向 (Industrial & Mechanical)
- **音乐特征**：齿轮敲击、Lo-Fi 律动、具有工控采样音效；
- **动效灵感库**：
  - 信息展示：机场复古机械翻牌 `text/split-flap-flip`；
  - 实体感：胶带斜向拍贴 `component/masking-tape-slap`、图纸折叠升起 `component/popup-book-rise`。

---

## 五、CLI 操作指引

1. **草稿初始化**：
   ```bash
   npm run forge -- init --input "/path/to/music.mp3" --audio-kind instrumental --name "mind-journey"
   ```
   该命令会自动 probe 音频，生成基础时长对齐草稿。
2. **细化 Film IR 并呈递 G1 评审**：
   - 打开 `output/projects/<id>/film.json`，根据音频节拍细化每个分镜；
   - 将 `design-review.md` 呈现给用户，等待确认并批复：
     ```bash
     npm run forge -- approve-design --project <id>
     ```
3. **渲染 G2 样板镜（重点检查重拍切点）**：
   ```bash
   npm run forge -- render --project <id> --scope sample
   ```
4. **全片合成与交付**：
   ```bash
   npm run forge -- approve-sample --project <id>
   npm run forge -- render --project <id> --scope film
   ```
