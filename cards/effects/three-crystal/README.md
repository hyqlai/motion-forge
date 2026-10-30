---
id: component/three-crystal
title: 三维晶体旋转
kind: component
energy: high
timing: 105f (3.5s @ 30fps)
intents: [高潮, 揭示, 视觉母题, 结尾]
genres: [launch, story, promo]
inputs: [three, text]
renderers: [mixed]
---

## 意图
用于产品发布会高潮、视觉母题记忆点或片尾品牌定格。
二维画面在表现"空间感"与"科技高级感"时有天然天花板。
本卡将 WebGL/Three.js 深度渲染与 HTML 锐利排版进行混合分层（mixed）：
底层是具有物理折射质感的 3D 旋转几何晶体，顶层是精准布局的文字与品牌标语，
既有立体光影的纵深震撼，又保留了文字的排版美感与可编辑性。

## 动效核心
- Three.js 确定性时钟：几何体旋转角以 `frame / fps` 精确换算，禁止使用系统动态 performance.now()
- 材质质感：MeshPhysicalMaterial 带有粗糙度（roughness）、金属度（metalness）与环境反射
- 多光源设计：主方向光打出明暗对比，辅环境光与边缘轮廓点光源勾勒晶体倒角边缘
- 分层混合（Mixed）：Three.js Canvas 作为绝对定位背景层，HTML 标题文字覆于前景，互不干扰

## 参数表
| 参数 | 类型 | 典型值 | 调节手感 |
|------|------|--------|----------|
| `text` | string | "为想法建立空间" | 前景主标语 |
| `subtext` | string | "THREE.JS DIMENSION" | 辅助小字，增加排版层次 |
| `theme` | Theme | demoTheme | 晶体发光色与环境光照反射色 |

## 已知坑
- 晶体模型面数过高：复杂 3D 模型显著增加无头浏览器截图耗时，默认采用低面数多面体晶体。
- 依赖外部 HDR 贴图网络加载：脱网环境下离线渲染失败，必须全部内置纯代码程序化光源。
- 顶层文字对比度不足：晶体旋转到亮面时光照较强，文字底可加轻微放射暗影保障可读性。

## 复用指引
```tsx
<CardRenderer
  cardId="component/three-crystal"
  theme={currentTheme}
  durationInFrames={105}
  params={{
    text: "让每一种想象，都有画面",
  }}
/>
```

## 动效范围
- 属于本卡：Three.js 场景搭建、确定性旋转矩阵变换、物理材质、前景文字合成。
- 不属于本卡：外部 3D 格式模型（glTF/FBX）流式解析器、全功能三维相机漫游。
