---
id: environment/canvas-particles
title: 确定性粒子场
kind: environment
energy: high
timing: 90f (3.0s @ 30fps)
intents: [氛围, 情绪, 纯音乐, 间歇]
genres: [story, philosophy, launch, explainer]
inputs: [canvas, audio, text]
renderers: [canvas]
---

## 意图
为纯音乐、沉思短片、段落间歇或宏大主题提供富有生命力的空间氛围。
很多传统粒子系统使用动态随机数（Math.random），在视频 seek 或并行渲染分块时产生画面跳动闪烁。
本卡采用确定性伪随机数（PRNG + 固定种子），保证任一帧从当前 frame 独立计算均 100% 幂等，
兼顾丰富绚烂的流体漂移感与工业级视频渲染的确定性。

## 动效核心
- 确定性数学场：每个粒子基于 index 与当前 frame，通过正弦与余弦组合场函数计算位置 `(x(t), y(t))`
- 连线与距离感应：近邻粒子间计算欧式距离，小于阈值时动态绘制透明渐变连接线，形成星网结构
- 速度与连贯性：粒子支持从音量能量（RMS/BPM）动态调节漂移速率与散开半径
- Canvas 纯渲染：独立离屏或原生 Canvas 绘制，不污染 DOM 树，帧率稳定 60fps+

## 参数表
| 参数 | 类型 | 典型值 | 调节手感 |
|------|------|--------|----------|
| `text` | string | "代码，也可以有情绪" | 悬浮在粒子深空中央的情绪文字 |
| `count` | number | 60 | 粒子数量；40~80 最佳，超过 120 在连线计算时消耗 CPU |
| `theme` | Theme | demoTheme | 粒子亮色与深邃背景色彩 |

## 已知坑
- 粒子数量过多且开连线：O(N^2) 的距离计算会导致离线渲染降速。
- 在浅色高饱和背景下使用：粒子微光会被浅色背景冲淡，本卡天生适合深色深空基调。
- 滥用为全片底衬：高能量运动粒子全程存在会产生视觉疲劳，应作为重音或氛围间歇分镜。

## 复用指引
```tsx
<CardRenderer
  cardId="environment/canvas-particles"
  theme={currentTheme}
  durationInFrames={90}
  params={{
    text: "代码，也可以有情绪",
  }}
/>
```

## 动效范围
- 属于本卡：确定性 Canvas 粒子运动模拟、网格距离连线、中心文字环境映射。
- 不属于本卡：鼠标交互引力、复杂物理碰撞模拟。
