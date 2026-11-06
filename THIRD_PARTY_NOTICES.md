# Third-party notices

本仓库包含按上游许可证分发的第三方代码。本文件为 Apache License 2.0 第 4(d) 条要求的归属声明，并列出各来源的许可条件。

## video-shotcraft

- 上游：https://github.com/Vincentwei1021/video-shotcraft
- 版权：Copyright 2026 Wei Yihao
- 许可：Apache License 2.0（全文见 `third_party/LICENSE-Apache-2.0.txt`）
- 本项目中的位置：
  - `cards/_shared/shotcraft/`（含 `_fixtures/`、`_textures/`）
  - `cards/` 下 `source: video-shotcraft/...` 的 128 张动效卡
- 改动说明：目录结构重组、props 与时间契约适配、示例内容解耦、部分组件改写为原生 Remotion 实现。

## brewreel（精酿 BrewReel）

- 上游：https://github.com/Finderchangchang/brewreel
- 版权：Copyright 2026 柳伟杰 Liu Weijie (GitHub: Finderchangchang) and contributors
- 许可：Apache License 2.0（全文见 `third_party/LICENSE-Apache-2.0.txt`）
- 本项目中的位置：
  - `cards/_shared/brewreel/`（含 `styles/quiz/`）
  - `cards/` 下 `source: brewreel/...` 的 19 张动效卡
- 上游要求保留的署名：**基于柳伟杰（Finderchangchang）的 精酿 BrewReel**
- 改动说明：目录结构重组、示例内容解耦、部分样式与组件改写。

## video-talkcraft

- 上游：https://github.com/Vincentwei1021/video-talkcraft
- 版权：Copyright (c) 2026 Vincent Wei
- 许可：PolyForm Noncommercial License 1.0.0（与项目整体许可一致，全文见 `LICENSE`）
- 本项目中的位置：`cards/` 下 `source: video-talkcraft/...` 的 107 张动效卡
- 改动说明：卡片契约重构、props 与场景说明重写、示例内容与业务样式解耦。

上游许可禁止商业使用；本项目因此对整个仓库采用同样的非商业许可。

## deepseek-opus-motion-skill

- 上游：https://github.com/8533502-dev/deepseek-opus-motion-skill
- 许可：MIT
- 本项目中的使用方式：迁移运动原语与组件设计思路，未整套复制，仓库内无逐字对应文件。

## 其他说明

- 本项目依赖 Remotion。Remotion 源码可见但并非开源软件，有独立的商业许可条款，见 https://www.remotion.dev/license 。仅使用本仓库不构成对 Remotion 的授权。
- `public/audio/` 下的示例音效与音乐、`public/textures/` 下的示例纹理仅用于演示与测试，不随本许可授予再分发权；对外使用请替换为自有或已获授权素材。
- 由本项目渲染输出的视频作品，其版权归创作者所有，不受本仓库代码许可限制。
