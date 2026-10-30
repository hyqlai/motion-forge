---
id: media/svg-path
title: 路径生长叙事
kind: media
energy: medium
timing: 105f (3.5s @ 30fps)
intents: [步骤, 流程, 旅程, 因果]
genres: [explainer, story, launch]
inputs: [svg, text]
renderers: [svg]
---

## 意图
用于展示从 A 到 B 的进化过程、产品落地流程、时间旅程或因果链条。
将抽象逻辑具象化为一条连续平滑的贝塞尔曲线，随着时间流动生长，
并在经过关键里程碑时依次点亮节点光环与说明文字。

## 动效核心
- 描边生长动画：利用 SVG `strokeDasharray` 与 `strokeDashoffset`，随当前帧自左向右线性展开
- 节点触发时差：沿路径等比计算各 step 所在里程碑（progress），当路径到达节点时刻，节点半径从 0 弹起
- 光环涟漪：当前已点亮且处于活跃阶段的节点持续扩散半透明光晕（pulse ring）
- 矢量无损：纯 SVG 矢量描述，无惧任何画幅缩放与高 DPI 渲染

## 参数表
| 参数 | 类型 | 典型值 | 调节手感 |
|------|------|--------|----------|
| `title` | string | "每一步都有清晰的来路" | 流程总标题，位于左上角 |
| `steps` | string[] | ["构想", "分镜", "动效", "成片"] | 节点数组，建议 3~5 个节点均匀排布 |
| `theme` | Theme | demoTheme | 路径底色（muted）、生长色（accent）与节点发光色 |

## 已知坑
- 节点数量超过 6 个：连线曲率过大，节点文字互相重叠拥挤。
- 时长过短（<60f）：生长过快导致观众视线无法跟随路径阅读各节点文字。
- 步骤逻辑无前后因果：本卡专为"有先后次序的演进"设计，非时间/逻辑序列请用 stack-reveal。

## 复用指引
```tsx
<CardRenderer
  cardId="media/svg-path"
  theme={currentTheme}
  durationInFrames={105}
  params={{
    title: "从构想到成片",
    steps: ["构想", "分镜", "动效", "成片"],
  }}
/>
```

## 动效范围
- 属于本卡：平滑贝塞尔曲线生成、SVG strokeDashoffset 动画、节点落位与延迟点亮光环。
- 不属于本卡：节点展开的二级弹窗、分支流程树图。
