import type {FilmSpec} from '../core/schema';

export type DesignReviewFact = {
  id: string;
  statement: string;
  quote: string;
  sourceUrl: string;
};

export type DesignReviewArc = {
  id: string;
  phase: string;
  purpose: string;
  sceneIds: string[];
};

export type DesignReviewOptions = {
  source?: {kind: string; value: string; title: string};
  clock?: string;
  facts?: DesignReviewFact[];
  narrativeArc?: DesignReviewArc[];
};

const cell = (value: string | undefined): string => (value ?? '无')
  .replaceAll('|', '\\|')
  .replaceAll('\n', '<br>');

export const designReviewMarkdown = (
  film: FilmSpec,
  options: DesignReviewOptions = {},
): string => {
  const rows = film.scenes.map((scene) => {
    const visual = typeof scene.layout.options.description === 'string'
      ? scene.layout.options.description
      : '无';
    return `| ${cell(scene.id)} | ${cell(scene.intent)} | ${cell(scene.narration)} | ${cell(scene.onScreenText.join('<br>'))} | ${cell(visual)} | ${cell(scene.layout.kind)} | ${cell(scene.motion.primary?.cardId)} | ${cell(scene.motion.camera?.cardId)} | ${cell(scene.motion.transitionOut?.cardId)} | ${scene.durationInFrames}f |`;
  }).join('\n');

  const sourceSection = options.source
    ? `\n\n## 输入来源\n\n- 类型：${options.source.kind}\n- 来源：${options.source.value}\n- 标题：${options.source.title}\n- 主时钟：${options.clock ?? '未声明'}\n`
    : '';

  const arcSection = options.narrativeArc && options.narrativeArc.length > 0
    ? `\n\n## 叙事弧线\n\n${options.narrativeArc.map((arc) => `- ${arc.id} ${arc.phase}：${arc.purpose}（${arc.sceneIds.join('、')}）`).join('\n')}\n`
    : '';

  const factSection = options.facts && options.facts.length > 0
    ? `\n\n## 来源事实与依据\n\n| 事实 | 陈述 | 原文依据 | 来源 |\n|---|---|---|---|\n${options.facts.map((fact) => `| ${cell(fact.id)} | ${cell(fact.statement)} | ${cell(fact.quote)} | ${cell(fact.sourceUrl)} |`).join('\n')}\n`
    : '';

  return `# 《${film.title}》G1 分镜与视觉设计确认

- 片种：${film.genre}
- 目标：${film.brief.goal}
- 受众：${film.brief.audience}
- 语言：${film.brief.language}
- 画幅：${film.output.width}×${film.output.height} @ ${film.output.fps}fps
- 风格：背景 ${film.theme.background}，前景 ${film.theme.foreground}，强调 ${film.theme.accent}
- 字体：${film.theme.fontFamily}${sourceSection}${arcSection}

| 分镜 | 叙事目的 | 旁白 | 上屏文字 | 画面描述 | 布局 | 主动效 | 运镜 | 转场 | 时长 |
|---|---|---|---|---|---|---|---|---|---|
${rows}
${factSection}
确认设计后运行：

\`\`\`bash
npm run forge -- approve-design --project ${film.id}
\`\`\`
`;
};
