# 场景 Pipeline：歌曲带人声成片 (Song-to-Video)

本指南指导 Agent 基于用户提供的一首完整歌曲（含歌手演唱人声与伴奏），创作兼具音乐节拍与歌词情感张力的故事短片或动态歌词 MV。

---

## 一、场景定位与适用范围

- **典型输入**：
  - 流行音乐 / 独立民谣 / 摇滚歌曲 / 电子人声曲目
  - 品牌主题曲 / 活动纪念曲 / 故事叙事歌曲
- **常见输出片种**：
  - 动态排印歌词大片 (Kinetic Typography MV)
  - 音乐故事短片 (Music Story Short Film)
  - 情感共鸣短片 / 时代情绪混剪

---

## 二、双层时钟驱动机制 (Dual-Clock Engine)

歌曲做视频的精髓在于**双层时钟解耦协作**：
1. **宏观曲式时钟 (Macro Song Structure Clock)**：
   - 识别乐段演进：`Intro (前奏)` $\to$ `Verse 1 (主歌平缓叙事)` $\to$ `Pre-Chorus (预备铺垫)` $\to$ `Chorus (副歌核心情感爆发)` $\to$ `Bridge (间奏/转折)` $\to$ `Chorus 2` $\to$ `Outro (尾奏余音)`；
   - 宏观时钟决定**分镜画面的景别轮换、主色调明暗与运镜速率**。
2. **微观歌词时钟 (Micro Lyric Timestamp Clock)**：
   - 提取歌词字级/句级时间戳（Word/Phrase Timestamps）；
   - 微观时钟决定**文字动效的精准入场、字词高亮、字体变形与音画咬合**。

---

## 三、叙事构思与动效选型（开放自由，自主决策）

**Agent 可自主选择偏重“画面叙事故事”还是偏重“歌词视觉艺术”，自由调度动效卡库。**

以下提供常见灵感设计思路，**绝不作排他性限制**：

### 1. 动态歌词排印风 (Kinetic Typography MV)
- **核心理念**：文字不仅仅是字幕，文字本身就是画面的视觉主角，字形大小和动效直接映射歌手声线的撕裂、低语或高亢。
- **动效灵感库**：
  - 主歌低吟：采用字级平滑浮现 `text/type-rhythm-sync`，文字排版内敛、字间距适中；
  - 关键词或高亮处：用划线高亮 `text/highlighter-sweep`，如同用马克笔在歌词上划过痕迹；
  - 副歌高潮爆发：文字放大占据整个画面核心，配合定格重击 `text/cel-flash-stomp` 或胶卷过曝冲光 `text/halation-bloom`；
  - 背景烘托：背景叠加柔和的空间粒子流 `environment/canvas-particles`，给纯文字画面提供空气流动感。

### 2. 意象故事与情绪散文风 (Narrative Music Story)
- **核心理念**：以视觉画面隐喻歌曲传达的故事，歌词退后作为辅助信息条，画面镜头语言丰富。
- **动效灵感库**：
  - 人物/场景回忆：画面采用复古胶片感，照片以剪贴簿风格拍贴固定 `component/masking-tape-slap`；
  - 心理时空交错：运用希区柯克滑动变焦 `camera/dolly-zoom` 营造恍惚或顿悟感；
  - 乐器 Solo 间奏：镜头进行缓慢大跨度空间巡游 `camera/space-camera-moves`；
  - 转场切换：段落之间多用高速甩镜头 `transition/whip-pan`、多维翻转 `transition/cube-rotate` 或暗调隧道穿梭 `transition/dark-tunnel`。

---

## 四、CLI 操作指引

1. **草稿初始化**：
   ```bash
   npm run forge -- create --dir /absolute/song-visual \
     --input "/path/to/song.mp3" --audio-kind song --name "song-visual"
   cd /absolute/song-visual
   ```
   系统会分析歌曲音频信息，并生成待确认的初始草案。
2. **ASR 转写与歌词分析**：
   ```bash
   export FISH_API_KEY="<fish-audio-api-key>"
   npm run forge -- transcribe --project song-visual --language zh
   ```
   - 读取项目内已本地化的歌曲，调用 Fish Audio ASR（默认模型 `transcribe-1-pro`，默认请求词级时间戳）；
   - 逐行歌词按停顿、行时长/字数和文本边界从词级 segments 分组；
   - 结果写入 `output/projects/song-visual/analysis/lyrics.json`，后续可复用，无需重复转写；
   - 未配置密钥、转写失败或时间戳缺失时命令失败退出，不会生成占位歌词。
3. **生成歌词分镜草案并呈递 G1 评审**：
   ```bash
   npm run forge -- lyrics-draft --project song-visual
   ```
   - 从 `lyrics.json` 生成逐行歌词镜头，`props.lyric` 保留每行起止时间；间奏与尾奏用留白镜头补齐时间线；
   - 草案写回后项目退回 `design-review`，不会自动通过 G1；
   - 在 `design-review.md` 中重点向用户汇报副歌与高潮镜头的视听设计，确认后执行：
     ```bash
     npm run forge -- approve-design --project song-visual
     ```
4. **渲染 G2 样板镜（重点检查歌词音画咬合度）**：
   - 挑选副歌第一句或最激昂的一句作为 sample 渲染：
     ```bash
     npm run forge -- render --project song-visual --scope sample
     ```
   - 检查文字是在发音前 1 帧启动，还是声音结束后才出来（确保绝无延迟）。
5. **全片合成与交付**：
   ```bash
   npm run forge -- approve-sample --project song-visual
   npm run forge -- render --project song-visual --scope film
   ```
