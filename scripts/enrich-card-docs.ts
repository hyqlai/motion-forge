import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {cardDefinitions} from '../cards/registry';

// 扩充每张动效卡的 README.md 为完整参考文档（参照 video-talkcraft/references/cards 结构）
// 包含：Frontmatter 元数据 / 意图 / 动效核心 / 参数表 / 已知坑 / 复用指引 / 动效范围

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcesRoot = path.resolve(projectRoot, '..');

// 5 张原创代表卡的标准文档定义
const nativeCardDocs: Record<string, string> = {
  'text/keyword-reveal': `---
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
关键词揭示通过多行错峰升起 + 关键核心词独立赋予主题高亮色（\`accentWord\`），
在 0.5 秒内建立视觉层级：先看到主张，再锁定核心词。

## 动效核心
- 逐行向上弹入：各行按 8 帧错峰（stagger），\`y: 54px → 0\` 结合 \`opacity: 0 → 1\`
- 弹簧曲线：Remotion \`spring({damping: 18, stiffness: 130, mass: 0.8})\`，落定平稳无冗余反弹
- 局部裁剪：每行包裹在 \`overflow: hidden\` 容器内，文字从隐形底边穿出，构图干净
- 关键词着色：文本拆分为普通词组与 \`accentWord\`，注入全局 \`theme.accent\` 色彩，兼顾主题动态切换

## 参数表
| 参数 | 类型 | 典型值 | 调节手感 |
|------|------|--------|----------|
| \`text\` | string | "一个清晰的观点\\n值得被看见" | 建议 1~3 行，每行 ≤12 字；超过 3 行阅读负担过重 |
| \`eyebrow\` | string | "TEXT MOTION" | 顶部眉题大写字母或分类标签，留空则不渲染 |
| \`accentWord\` | string | "看见" | 核心抓眼词，必须是 text 里的子串，自动上主题强调色 |
| \`theme\` | Theme | demoTheme | 由内核注入全局背景、前景、强调色与字体 |

## 已知坑
- 文本行数过多（>4行）：多行错峰会拉长总入场时间，导致镜头过长、节奏拖沓。
- 强调词不在文本中：强调词未匹配时会降级为全单色展示，失去视觉重心。
- 与高能量粒子或快节奏画面同场：标题需要极干净的阅读视线，不可与强运动背景抢夺注意力。

## 复用指引
\`\`\`tsx
<CardRenderer
  cardId="text/keyword-reveal"
  theme={currentTheme}
  durationInFrames={90}
  params={{
    text: "一个清晰的观点\\n值得被看见",
    eyebrow: "MOTION FORGE",
    accentWord: "看见",
  }}
/>
\`\`\`

## 动效范围
- 属于本卡：行级错峰向上穿出、Remotion 弹簧位移与透明度、关键词自动拆分染色。
- 不属于本卡：相机的缓慢推拉（应由外层 camera 运镜卡包裹）、全屏背景层、音效触发。
`,

  'component/stack-reveal': `---
id: component/stack-reveal
title: 条目错峰堆叠
kind: component
energy: medium
timing: 90f (3.0s @ 30fps)
intents: [列举, 步骤, 观点递进]
genres: [explainer, story, promo, launch]
inputs: [component, text]
renderers: [html]
---

## 意图
用于科普步骤、产品三大卖点、决策三要素等并列或递进清单的建立。
避免"一大段列表一次性贴脸"造成的阅读压迫感，通过自右向左的节奏性落位，
引导观众一条一条接收，最后一条自动施加强调色作为收尾重音。

## 动效核心
- 错峰横移：条目以 10 帧等差错峰，从右侧 70px 处横滑入场（\`x: 70px → 0\`）
- 弹簧阻尼：\`spring({damping: 20, stiffness: 150})\`，强干脆感，入场后迅速静止供阅读
- 序号引导：左侧自动补零生成两位数序号（01, 02...），建立秩序感
- 终项高亮：列表最后一项反转为 \`theme.accent\` 实底暗字，形成"这就是结论"的收束心理

## 参数表
| 参数 | 类型 | 典型值 | 调节手感 |
|------|------|--------|----------|
| \`title\` | string | "用秩序建立理解" | 顶部大标题，25~38px，定下列表分类 |
| \`items\` | string[] | ["第一点", "第二点", "第三点"] | 最佳项数为 3~4 项；少于 2 项无须成堆，多于 5 项拥挤 |
| \`theme\` | Theme | demoTheme | 决定前几项的灰白质感与末项的强调色 |

## 已知坑
- 超过 5 项内容：在 540p/1080p 画幅上字号被迫缩小，且入场时间拖长，信息超载。
- 每项文字长短差异悬殊：单项超长会破坏胶囊卡片的一致整齐度，建议单项控制在 15 字内。
- 最后一项不是重音：如果业务逻辑上全列表完全平权，末项的高亮会造成误导。

## 复用指引
\`\`\`tsx
<CardRenderer
  cardId="component/stack-reveal"
  theme={currentTheme}
  durationInFrames={90}
  params={{
    title: "一个内核，三种自由",
    items: ["独立分镜", "可插拔动效", "确定性渲染"],
  }}
/>
\`\`\`

## 动效范围
- 属于本卡：卡片胶囊布局、双位数编号生成、自右向左弹性错峰入场、末项强调着色。
- 不属于本卡：条目内部展开图表、单项点击交互、背景氛围。
`,

  'media/svg-path': `---
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
- 描边生长动画：利用 SVG \`strokeDasharray\` 与 \`strokeDashoffset\`，随当前帧自左向右线性展开
- 节点触发时差：沿路径等比计算各 step 所在里程碑（progress），当路径到达节点时刻，节点半径从 0 弹起
- 光环涟漪：当前已点亮且处于活跃阶段的节点持续扩散半透明光晕（pulse ring）
- 矢量无损：纯 SVG 矢量描述，无惧任何画幅缩放与高 DPI 渲染

## 参数表
| 参数 | 类型 | 典型值 | 调节手感 |
|------|------|--------|----------|
| \`title\` | string | "每一步都有清晰的来路" | 流程总标题，位于左上角 |
| \`steps\` | string[] | ["构想", "分镜", "动效", "成片"] | 节点数组，建议 3~5 个节点均匀排布 |
| \`theme\` | Theme | demoTheme | 路径底色（muted）、生长色（accent）与节点发光色 |

## 已知坑
- 节点数量超过 6 个：连线曲率过大，节点文字互相重叠拥挤。
- 时长过短（<60f）：生长过快导致观众视线无法跟随路径阅读各节点文字。
- 步骤逻辑无前后因果：本卡专为"有先后次序的演进"设计，非时间/逻辑序列请用 stack-reveal。

## 复用指引
\`\`\`tsx
<CardRenderer
  cardId="media/svg-path"
  theme={currentTheme}
  durationInFrames={105}
  params={{
    title: "从构想到成片",
    steps: ["构想", "分镜", "动效", "成片"],
  }}
/>
\`\`\`

## 动效范围
- 属于本卡：平滑贝塞尔曲线生成、SVG strokeDashoffset 动画、节点落位与延迟点亮光环。
- 不属于本卡：节点展开的二级弹窗、分支流程树图。
`,

  'environment/canvas-particles': `---
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
- 确定性数学场：每个粒子基于 index 与当前 frame，通过正弦与余弦组合场函数计算位置 \`(x(t), y(t))\`
- 连线与距离感应：近邻粒子间计算欧式距离，小于阈值时动态绘制透明渐变连接线，形成星网结构
- 速度与连贯性：粒子支持从音量能量（RMS/BPM）动态调节漂移速率与散开半径
- Canvas 纯渲染：独立离屏或原生 Canvas 绘制，不污染 DOM 树，帧率稳定 60fps+

## 参数表
| 参数 | 类型 | 典型值 | 调节手感 |
|------|------|--------|----------|
| \`text\` | string | "代码，也可以有情绪" | 悬浮在粒子深空中央的情绪文字 |
| \`count\` | number | 60 | 粒子数量；40~80 最佳，超过 120 在连线计算时消耗 CPU |
| \`theme\` | Theme | demoTheme | 粒子亮色与深邃背景色彩 |

## 已知坑
- 粒子数量过多且开连线：O(N^2) 的距离计算会导致离线渲染降速。
- 在浅色高饱和背景下使用：粒子微光会被浅色背景冲淡，本卡天生适合深色深空基调。
- 滥用为全片底衬：高能量运动粒子全程存在会产生视觉疲劳，应作为重音或氛围间歇分镜。

## 复用指引
\`\`\`tsx
<CardRenderer
  cardId="environment/canvas-particles"
  theme={currentTheme}
  durationInFrames={90}
  params={{
    text: "代码，也可以有情绪",
  }}
/>
\`\`\`

## 动效范围
- 属于本卡：确定性 Canvas 粒子运动模拟、网格距离连线、中心文字环境映射。
- 不属于本卡：鼠标交互引力、复杂物理碰撞模拟。
`,

  'component/three-crystal': `---
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
- Three.js 确定性时钟：几何体旋转角以 \`frame / fps\` 精确换算，禁止使用系统动态 performance.now()
- 材质质感：MeshPhysicalMaterial 带有粗糙度（roughness）、金属度（metalness）与环境反射
- 多光源设计：主方向光打出明暗对比，辅环境光与边缘轮廓点光源勾勒晶体倒角边缘
- 分层混合（Mixed）：Three.js Canvas 作为绝对定位背景层，HTML 标题文字覆于前景，互不干扰

## 参数表
| 参数 | 类型 | 典型值 | 调节手感 |
|------|------|--------|----------|
| \`text\` | string | "为想法建立空间" | 前景主标语 |
| \`subtext\` | string | "THREE.JS DIMENSION" | 辅助小字，增加排版层次 |
| \`theme\` | Theme | demoTheme | 晶体发光色与环境光照反射色 |

## 已知坑
- 晶体模型面数过高：复杂 3D 模型显著增加无头浏览器截图耗时，默认采用低面数多面体晶体。
- 依赖外部 HDR 贴图网络加载：脱网环境下离线渲染失败，必须全部内置纯代码程序化光源。
- 顶层文字对比度不足：晶体旋转到亮面时光照较强，文字底可加轻微放射暗影保障可读性。

## 复用指引
\`\`\`tsx
<CardRenderer
  cardId="component/three-crystal"
  theme={currentTheme}
  durationInFrames={105}
  params={{
    text: "让每一种想象，都有画面",
  }}
/>
\`\`\`

## 动效范围
- 属于本卡：Three.js 场景搭建、确定性旋转矩阵变换、物理材质、前景文字合成。
- 不属于本卡：外部 3D 格式模型（glTF/FBX）流式解析器、全功能三维相机漫游。
`,
};

// 提取来源 md 的主体内容（去掉原 frontmatter，转换成统一格式）
const parseSourceMarkdown = (raw: string): {frontmatter: string; body: string} => {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return {frontmatter: '', body: raw};
  return {frontmatter: match[1], body: match[2]};
};

let enriched = 0;

for (const card of cardDefinitions) {
  const {manifest} = card;
  const cardDir = path.join(projectRoot, 'cards', manifest.kind, manifest.id.split('/')[1]);
  const readmePath = path.join(cardDir, 'README.md');

  if (!manifest.migration) {
    const doc = nativeCardDocs[manifest.id];
    if (doc) {
      await writeFile(readmePath, doc);
      enriched += 1;
      console.log(`Enriched native doc: ${manifest.id}`);
    }
    continue;
  }

  // 迁移卡：读取来源 reference md
  const refPath = path.join(sourcesRoot, manifest.migration.reference);
  let refContent = '';
  try {
    refContent = await readFile(refPath, 'utf8');
  } catch (err) {
    console.warn(`Missing source reference for ${manifest.id}: ${refPath}`);
    continue;
  }

  const {body} = parseSourceMarkdown(refContent);

  // 构建统一的 Frontmatter
  const frontmatter = `---
id: ${manifest.id}
title: ${manifest.title}
kind: ${manifest.kind}
energy: ${manifest.energy}
timing: ${manifest.timing.defaultInFrames}f (${(manifest.timing.defaultInFrames / 30).toFixed(1)}s @ 30fps)
intents: [${manifest.intents.join(', ')}]
genres: [${manifest.genres.join(', ')}]
inputs: [${manifest.inputs.join(', ')}]
renderers: [${manifest.renderers.join(', ')}]
source: ${manifest.migration.source}
sourcePath: ${manifest.migration.sourcePath}
---
`;

  // 拼接规范文档：统一标题为当前卡名，保留完整的专业分析段落
  const finalDoc = `${frontmatter}\n# ${manifest.title}\n\n> 迁移自 \`${manifest.migration.source}\`。${manifest.summary}\n\n${body.trim()}\n`;
  await writeFile(readmePath, finalDoc);
  enriched += 1;
  console.log(`Enriched migrated doc: ${manifest.id} ← ${manifest.migration.reference}`);
}

console.log(`\nEnriched ${enriched}/${cardDefinitions.length} card READMEs.`);
