---
id: interaction/gooey-morph
title: 液态路径形变展开
kind: interaction
energy: medium
timing: 97f（完整制作建议 120f）
intents: [证据裂变, 多项并列, 平台矩阵, 有机展开]
genres: [story, explainer, launch, promo]
inputs: [component, text]
renderers: [html, svg]
source: video-talkcraft/gooey-morph
sourcePath: video-talkcraft/template/cards/gooey-morph.tsx
---

# 液态路径形变展开

同一条闭合 SVG 路径从圆角母体逐帧形变为四瓣曲线，随后四张并列卡片从中心分裂落位。路径使用 `feGaussianBlur + feColorMatrix` 粘连滤镜，避免把普通位移或描边生长误记为几何 morph。

## 何时使用

- 一个概念裂变为 3～4 项证据、平台或交付物。
- 需要明确看见“轮廓本身改变”的 SVG 形变，而不是下划线延长、卡片平移或透明度过渡。
- 不适合任意 Logo 路径互转、超过 4 张卡片，或需要可读长正文的画面。

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 左上标题，默认 `One form, many signals` |
| `steps` | `string[]` | 分裂卡片文字，取前 4 项，默认 `PLAN / PROOF / BUILD / SHIP` |
| `theme` | `Theme` | 背景、文字、母体与描边颜色 |
| `durationInFrames` | `number` | 由 Film 分镜时长传入 |

通过 `scene/svg-journey` 使用时，场景 `props.title` 与 `props.steps` 会传给本卡。主动效声明：

```json
{
  "primary": {
    "cardId": "interaction/gooey-morph",
    "params": {}
  }
}
```

## 几何与时间约束

- 起始和结束轮廓各由 16 个锚点定义；逐帧插值锚点，再以 Catmull-Rom 转换生成 16 段三次贝塞尔曲线。每帧都更新同一个 `<path data-gooey-morph-path>` 的 `d`，路径始终闭合。
- 起始是圆角母体，终点是四瓣曲线。该实现是**固定两类复杂轮廓的形变**，不是接受任意两个 `d` 字符串的通用插值器。
- 形变区间约为分镜时长的 25%～65%，分裂落位约为 55%～85%。manifest 默认 97 帧可预览；完整 Film 建议至少 120 帧，给最终轮廓和卡片留阅读时间。
- 滤镜只作用于路径母体，不模糊标题与卡片文字。路径、滤镜和卡片都由当前帧确定性计算，不依赖自运行时间线。
- `GooeyMorph` 从 Remotion 读取帧与画幅；`GooeyMorphFrame` 是同一张卡的帧级展示组件，供静态 SVG 标记验收和真实渲染共用，不是另一份动效实现。

## 验收

`scripts/fixtures/advanced-scenes/svg.json` 是完整单镜 Film，不是 Gallery 预览。`npm run advanced:verify -- --only svg` 会：

1. 检查 QA 帧的同一路径元素至少包含 8 段三次贝塞尔曲线，且起始、插值中段和末帧的 `d` 至少出现 3 个不同版本。
2. 经过 G1/G2 和 swangle 真实渲染，检查全部帧可解码、画面非空且存在有效时间变化，并输出抽帧接触表。
3. 通过导出 QA，在干净交付副本中独立安装、构建、编辑时长并再次真实渲染。

验收通过不代表支持任意 SVG path 字符串、任意数量分裂卡片或自动 Logo morph；这些仍超出本卡契约。
