# 场景扩展指南：如何添加新的制作 Pipeline (Extending Pipelines)

本指南说明如何为 Motion Forge 扩展全新的视频制作场景与输入适配器（如：表格生视频 Table-to-Video、PDF/PPT 文档生视频 Slide-to-Video、播客对话生视频 Podcast-to-Video 等）。

---

## 一、新增 Pipeline 的三步标准化规范

要新增一个场景 Pipeline，仅需遵循三步规范：

```text
1. 编写场景指南文档 (skill/pipelines/<slug>-to-video.md)
   ↓
2. 扩展输入识别与主时钟适配器 (providers/input.ts)
   ↓
3. 在草稿生成器中注册该场景的分镜生成策略 (providers/draft.ts)
```

---

## 二、第一步：编写场景指南文档

在 `skill/pipelines/` 目录下创建新文件，例如 `podcast-to-video.md`，必须阐明：
1. **场景定位与输入特征**：用户提供什么文件？什么格式？
2. **时钟主轴定义**：该场景以什么作为 Master Clock？（如双人对话交替时间戳）；
3. **视觉翻译策略**：如何将该类输入的信息抽象为视觉画面？
4. **开放式动效灵感**：推荐 3~5 种富有创意的动效参考卡，并鼓励 Agent 自主选型；
5. **CLI 调用方式与 G1/G2 审查重点**。

---

## 三、第二步：扩展输入探测与主时钟绑定 (`providers/input.ts`)

在 `providers/input.ts` 中注册新的输入类型（`InputKind`）并指定主时钟优先级：

```typescript
export type InputKind = 'url' | 'instrumental' | 'song' | 'theme' | 'assets' | 'podcast' | 'table';

export const clockForInput = (kind: InputKind): ClockPriority => {
  switch (kind) {
    case 'podcast': return 'voice-dialogue';
    case 'table': return 'reading-pace';
    // ...
  }
};
```

---

## 四、第三步：注册默认分镜生成策略 (`providers/draft.ts`)

在 `providers/draft.ts` 中为新场景编写草稿生成逻辑 `createDraftForNewKind`：
- 解析输入特有元数据；
- 赋予初始的 3~5 个骨架分镜（涵盖 Hook、Body、Outro）；
- 挂载默认的主题色系和画幅；
- 开放给 Agent 在 `film.json` 中继续二次创作和自定义挑选动效卡。

---

## 五、设计哲学：解耦输入，统一内核

无论前端输入形式如何变化，下游的 **Film IR 协议、261 张动效卡库、Remotion 帧时钟、G1/G2 门禁机制以及本地可视化工作台** 保持 100% 复用与不变。这保证了 Motion Forge 拥有无限扩展新场景的架构弹性。
