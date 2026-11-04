import type {ClassifiedInput} from './input';
import type {WebpageSnapshot} from './url';

const placeholder = (label: string): string => `<填写：${label}>`;

type TemplateScene = {
  id: string;
  title: string;
  intent: string;
  semantic: string;
  arcId: string;
  durationSeconds: number;
  narration: string;
  onScreenText: string[];
  visual: {description: string; layoutKind: string; options: Record<string, unknown>};
  renderer: string;
  sceneComponent: string;
  motion: Record<string, unknown>;
  props: Record<string, unknown>;
  assetIds: string[];
  factIds: string[];
  qa: {frames: number[]; checkpoints: string[]};
};

const sceneSkeleton = (index: number, durationSeconds: number): TemplateScene => {
  const id = `S0${index + 1}`;
  const arcId = `A0${index + 1}`;
  const templates: Omit<TemplateScene, 'id' | 'arcId' | 'durationSeconds' | 'factIds'>[] = [
    {
      title: placeholder('镜头名称，例如：反常识开场'),
      intent: placeholder('这一镜要完成的叙事任务'),
      semantic: '钩子',
      narration: placeholder('这一镜的旁白，必须是可以直接朗读的完整句子'),
      onScreenText: [placeholder('实际上屏文字，不是内容摘要'), placeholder('副标题或强调句')],
      visual: {
        description: placeholder('画面描述：主体、构图、色彩、留白和文字层级'),
        layoutKind: 'hero',
        options: {},
      },
      renderer: 'html',
      sceneComponent: 'scene/kinetic-title',
      motion: {
        primary: {cardId: 'typography/keyword-reveal', params: {}},
        camera: {cardId: 'camera/slow-push', params: {zoomTo: 1.04}},
        transitionOut: {cardId: 'transition/wipe-transitions', params: {}},
      },
      props: {
        text: placeholder('传给 scene/kinetic-title 的文本'),
        eyebrow: placeholder('顶部小标题'),
      },
      assetIds: [],
      qa: {frames: [0, 30], checkpoints: [placeholder('必须人工确认的画面检查点')]},
    },
    {
      title: placeholder('镜头名称，例如：机理拆解'),
      intent: placeholder('这一镜如何推进论证'),
      semantic: '论据',
      narration: placeholder('这一镜的旁白，必须是可以直接朗读的完整句子'),
      onScreenText: [placeholder('第一条上屏信息'), placeholder('第二条上屏信息'), placeholder('第三条上屏信息')],
      visual: {
        description: placeholder('画面描述：主体、构图、色彩、留白和文字层级'),
        layoutKind: 'stack',
        options: {},
      },
      renderer: 'html',
      sceneComponent: 'scene/stack-explainer',
      motion: {
        primary: {cardId: 'interaction/stack-reveal', params: {}},
        transitionOut: {cardId: 'transition/whip-pan', params: {}},
      },
      props: {
        title: placeholder('分镜标题'),
        items: [placeholder('条目一'), placeholder('条目二'), placeholder('条目三')],
      },
      assetIds: [],
      qa: {frames: [0, 45], checkpoints: [placeholder('必须人工确认的画面检查点')]},
    },
    {
      title: placeholder('镜头名称，例如：收束与记忆点'),
      intent: placeholder('这一镜如何完成叙事收束'),
      semantic: '结尾',
      narration: placeholder('这一镜的旁白，必须是可以直接朗读的完整句子'),
      onScreenText: [placeholder('结尾金句或行动号召')],
      visual: {
        description: placeholder('画面描述：主体、构图、色彩、留白和文字层级'),
        layoutKind: 'hero-3d',
        options: {},
      },
      renderer: 'mixed',
      sceneComponent: 'scene/three-launch',
      motion: {
        primary: {cardId: 'effects/three-crystal', params: {}},
        camera: {cardId: 'camera/orbit-drift', params: {}},
        transitionOut: {cardId: 'transition/cube-rotate', params: {}},
      },
      props: {text: placeholder('传给 scene/three-launch 的收束文本')},
      assetIds: [],
      qa: {frames: [0, 60], checkpoints: [placeholder('必须人工确认的画面检查点')]},
    },
  ];
  return {...templates[index], id, arcId, durationSeconds, factIds: []};
};

export const buildContentPlanTemplate = (options: {
  input: ClassifiedInput;
  title: string;
  snapshot?: WebpageSnapshot;
}): Record<string, unknown> => {
  const {input, title, snapshot} = options;
  const scenes = [sceneSkeleton(0, 8), sceneSkeleton(1, 8), sceneSkeleton(2, 8)];
  const facts = input.kind === 'url' && snapshot
    ? [{
        id: 'F01',
        statement: placeholder('来源支持的具体事实或数字'),
        quote: placeholder('从 source.json 正文逐字摘录的原文'),
        sourceUrl: snapshot.finalUrl,
        sceneIds: scenes.map((scene) => scene.id),
      }]
    : [];
  if (facts.length > 0) {
    for (const scene of scenes) scene.factIds = ['F01'];
  }

  return {
    schemaVersion: '1.0.0',
    status: 'draft',
    source: {
      kind: input.kind,
      value: input.value,
      title,
    },
    title,
    genre: input.kind === 'url' ? 'promo' : 'explainer',
    brief: {
      goal: placeholder('一句话说明这部片子要达到的传播或认知目标'),
      audience: placeholder('目标受众'),
      language: 'zh-CN',
    },
    clock: 'reading',
    output: {width: 960, height: 540, fps: 30},
    theme: {
      background: '#0c111b',
      foreground: '#f4f0e8',
      accent: '#ffb703',
      muted: '#8291a7',
      fontFamily: 'Noto Sans SC, Microsoft YaHei, sans-serif',
    },
    totalDurationSeconds: 24,
    narrativeArc: [
      {id: 'A01', phase: 'hook', purpose: placeholder('开场如何在 3 秒内制造认知缺口'), sceneIds: ['S01']},
      {id: 'A02', phase: 'development', purpose: placeholder('中段如何递进论证'), sceneIds: ['S02']},
      {id: 'A03', phase: 'resolution', purpose: placeholder('结尾如何收束并留下记忆点'), sceneIds: ['S03']},
    ],
    scenes,
    facts,
    assets: [],
  };
};

const sceneComponentCatalog = [
  'scene/kinetic-title：标题与金句，适合开场和收束',
  'scene/stack-explainer：条目层叠论证，适合分点解释',
  'scene/svg-journey：路径与流程，适合步骤和演进',
  'scene/canvas-music：Canvas 程序化氛围，适合音乐和情绪段落',
  'scene/three-launch：Three.js 三维主体，适合产品与终章',
];

const motionCatalog = [
  'typography/*：标题入场、关键词、引用卡、字符解码',
  'interaction/*：卡片层叠、命令面板、毛玻璃面板',
  'data/*：图表生长、数字计数、仪表与落砂',
  'media/*：图片入场、分屏对比、SVG 路径',
  'effects/*：三维晶体、粒子、扫光与 HUD',
  'camera/*：推拉、环绕、甩镜、滑动变焦',
  'transition/*：色块擦除、立方体翻转、暗色隧道',
];

export const buildContentPlanGuide = (options: {
  input: ClassifiedInput;
  title: string;
  projectId: string;
  snapshot?: WebpageSnapshot;
}): string => {
  const {input, title, projectId, snapshot} = options;
  const sourceBlock = input.kind === 'url' && snapshot
    ? `- 来源 URL：${snapshot.finalUrl}
- 来源标题：${snapshot.title}
- 已抓取正文：\`source.json\`（约 ${snapshot.text.length} 字符）

### 来源事实可追溯

URL 输入的每一条事实都必须写入 \`facts\`：

- \`quote\` 必须是 \`source.json\` 正文中逐字出现的片段，不得改写、拼接或编造；
- \`sourceUrl\` 必须是已抓取的 \`url\` 或 \`finalUrl\`；
- \`sceneIds\` 与分镜的 \`factIds\` 必须双向一致；
- 每个分镜至少引用一条事实，\`apply-plan\` 会逐条核对原文。

来源正文摘录：

\`\`\`text
${snapshot.text.slice(0, 3000)}
\`\`\`
`
    : `- 来源类型：纯主题
- 主题：${input.value}

纯主题策划不得声明 \`facts\`；事实性数据必须来自用户输入或已登记素材，不得编造。
`;

  return `# 《${title}》内容策划工作单

项目：\`${projectId}\`
来源类型：\`${input.kind}\`

${sourceBlock}

## 1. 工作流

1. 复制 \`content-plan.template.json\` 为 \`content-plan.json\`；
2. 用你自己的 LLM 能力填写全部 \`<填写：…>\` 占位符，并把 \`status\` 改为 \`ready\`；
3. 运行 \`npm run forge -- apply-plan --project ${projectId}\`；
4. 命令会执行 Film Schema、场景/卡片注册、素材与来源追溯校验，通过后写入 \`film.json\` 与 \`design-review.md\`；
5. 把 \`design-review.md\` 呈报用户，停留在 G1，等待用户明确批准后才可执行 \`approve-design\`。

本流程不调用任何外部 LLM API；策划内容由 Agent 自身 LLM 完成（ADR-0002）。

## 2. 叙事弧线约束

- 至少 3 幕、最多 6 幕，第一幕必须是 \`hook\`，最后一幕必须是 \`resolution\`；
- 可用 phase：\`hook\`、\`setup\`、\`development\`、\`turn\`、\`resolution\`；
- 每个分镜必须且只能属于一幕，\`narrativeArc[].sceneIds\` 的顺序必须与 \`scenes\` 顺序一致；
- 每镜的 \`arcId\` 必须指向所在幕；
- \`totalDurationSeconds\` 必须等于所有 \`durationSeconds\` 之和，且每镜至少一帧。

## 3. 每镜必填内容

| 字段 | 约束 |
| :--- | :--- |
| \`narration\` | 可直接朗读的完整旁白，不允许摘要式占位 |
| \`onScreenText\` | 真的会出现在画面上的文字，不是内容摘要 |
| \`visual.description\` | 主体、构图、色彩、留白、文字层级 |
| \`motion.primary\` | 主动效卡，必填；可选 camera/text/transitionOut |
| \`durationSeconds\` | 与旁白语速和阅读停留匹配的时长 |
| \`props\` | 必须与所选 \`sceneComponent\` 的公开参数一致 |
| \`qa\` | 至少一个检查帧和人工检查点 |

可用分镜组件：

${sceneComponentCatalog.map((line) => `- ${line}`).join('\n')}

动效卡类别（完整 ID 与参数以 \`cards/\` 注册表为准）：

${motionCatalog.map((line) => `- ${line}`).join('\n')}

## 4. 质量红线

- 横屏单行上屏文字建议不超过 22 个汉字，竖屏不超过 14 个；
- 动效展开后保留至少 45~90 帧稳定停留；
- 一个分镜只保留一个视觉焦点，避免强运镜与强组件动效同时出现；
- 不得编造数据、引文或素材；缺少素材时显式报告，不要静默占位。

## 5. 应用命令

\`\`\`bash
npm run forge -- apply-plan --project ${projectId}
\`\`\`
`;
};
