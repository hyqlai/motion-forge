---
id: text/keyword-reveal
title: 关键词揭示
kind: text
energy: low
timing: 90f (3.0s @ 30fps)
intents: [钩子, 揭示, 金句]
genres: [story, explainer, launch, philosophy, promo]
inputs: [text]
renderers: [html]
---

## 意图
用于开场第一击、强观点建立、关键数据或金句定锤。
很多视频的标题是一整句机械出现，观众阅读视线没有焦点。
关键词揭示通过多行错峰升起 + 关键核心词独立赋予主题高亮色（`accentWord`），
在 0.5 秒内建立视觉层级：先看到主张，再锁定核心词。

## 动效核心
- 逐行向上弹入：各行按 8 帧错峰（stagger），`y: 54px → 0` 结合 `opacity: 0 → 1`
- 弹簧曲线：Remotion `spring({damping: 18, stiffness: 130, mass: 0.8})`，落定平稳无冗余反弹
- 局部裁剪：每行包裹在 `overflow: hidden` 容器内，文字从隐形底边穿出，构图干净
- 关键词着色：文本拆分为普通词组与 `accentWord`，注入全局 `theme.accent` 色彩，兼顾主题动态切换

## 参数表
| 参数 | 类型 | 典型值 | 调节手感 |
|------|------|--------|----------|
| `text` | string | "一个清晰的观点\n值得被看见" | 建议 1~3 行，每行 ≤12 字；超过 3 行阅读负担过重 |
| `eyebrow` | string | "TEXT MOTION" | 顶部眉题大写字母或分类标签，留空则不渲染 |
| `accentWord` | string | "看见" | 核心抓眼词，必须是 text 里的子串，自动上主题强调色 |
| `theme` | Theme | demoTheme | 由内核注入全局背景、前景、强调色与字体 |

## 已知坑
- 文本行数过多（>4行）：多行错峰会拉长总入场时间，导致镜头过长、节奏拖沓。
- 强调词不在文本中：强调词未匹配时会降级为全单色展示，失去视觉重心。
- 与高能量粒子或快节奏画面同场：标题需要极干净的阅读视线，不可与强运动背景抢夺注意力。

## 复用指引
```tsx
<CardRenderer
  cardId="text/keyword-reveal"
  theme={currentTheme}
  durationInFrames={90}
  params={{
    text: "一个清晰的观点\n值得被看见",
    eyebrow: "MOTION FORGE",
    accentWord: "看见",
  }}
/>
```

## 动效范围
- 属于本卡：行级错峰向上穿出、Remotion 弹簧位移与透明度、关键词自动拆分染色。
- 不属于本卡：相机的缓慢推拉（应由外层 camera 运镜卡包裹）、全屏背景层、音效触发。
