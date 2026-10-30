---
id: text/type-entrance-moves
title: type-entrance-moves
kind: text
energy: medium
timing: 150f (5.0s @ 30fps)
intents: [typography, 视觉呈现, 动态设计]
genres: [story, explainer, launch, promo]
inputs: [component, text, image]
renderers: [html]
source: video-shotcraft/type-entrance-moves
sourcePath: video-shotcraft/demos/typography/type-entrance-moves/LetterDropPhysics.tsx
---

# type-entrance-moves

> 迁移自 `video-shotcraft/type-entrance-moves`。标题文字入场一式——letter-drop-physics 字符坠落（重力砸落、弹跳、歪斜站定，最后一拍集体立正归位）

## 意图
标题入场库内已有打字机（沉稳文档感）和集结系（字从别处汇聚），本卡补
物理喜剧感——字符从天而降、砸地弹跳、歪歪扭扭站定，最后一拍
集体立正归位，适合轻松调性的开场破冰（demo 让品牌名「Shotcraft」砸落站定，
副标题「Every shot lands on the beat.」随归位一拍浮出）。标题入场同片 ≤2 种（P4）。

## 做法
| 式 | 做法 | 适用 |
|----|------|------|
| A letter-drop-physics 字符坠落 | 字符错峰从顶砸落，重力加速+两次衰减弹跳+落地歪斜站定，最后一拍全体齐整回正 | 轻松调性开场；"活物感"的标题破冰 |

## 参数表
| 参数 | 典型值 | 调节手感 |
|------|--------|----------|
| 坠落 | 第 i 字符帧 4+36·(1−(1−i/(n−1))^1.5) 起跳（首末字固定在 4f / 40f，间隔越来越密；demo 9 字符 6.5→1.6f）；y = −DROP + DROP·(t/24)²（重力）→ 4u(1−u) 抛物线弹跳 30% → 二跳 9% | 弹跳衰减比 30%/9% 是"有弹性但不闹"的甜点；三跳以上读作果冻 |
| 歪斜 | 落地瞬间 rotate 到 seed hash ±6° 并保持 | 歪角是"物理感"的一半；全体笔直落地读作普通位移入场 |
| 归位一拍 | 全员落定后（如帧 110）6f ease-out 集体 rotate→0 + scale 1.06→1 | 集体归位是句号——错峰归位会把"立正"的仪式感拆散 |
| 收尾 | 动作完毕真静止 ≥20f | R1：静止期所有属性锁死（含歪角归零后） |

## 已知坑
- demo 在灰阶/占位素材上调校通过——参数是调校起点非实战定稿，
  首次实战须以真实素材回验
- 落地砸声是声音强依赖候选位（sound-design §4.5）：逐字钉帧会让重量感翻倍，
  无声版也成立但少一半劲
- 字符间不做真实碰撞（demo 为各字符独立轨迹）——字距排开即可；
  想要"互相撞歪"需预烘焙轨迹，成本高收益薄
- 选词避开带下行笔画的字母（g/j/p/q/y）或按字形单独校地面——demo 按基线贴地，
  下行笔画会"插进"地面
- 标题入场自带高注意力——别和其他高能量入场同帧抢戏

## 参考实现
demos/typography/type-entrance-moves/
（LetterDropPhysics.tsx）
