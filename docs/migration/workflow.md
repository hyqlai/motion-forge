# 动效卡迁移与验收流程

## 1. 盘点

```bash
npm run cards:inventory
```

扫描源项目并生成 `cards.json` 与 `inventory.md`。`ready.json` 是人工/视觉验收后的状态记录，重新盘点不会覆盖它。

## 2. 契约改造

每张迁移卡必须包含：

- 新契约 `card.json`，记录来源、参考文档和 `migrating` 状态。
- 独立 Remotion 实现，使用局部帧、外部内容 props 和主题 tokens。
- `preview.tsx` 与使用场景 README。
- 在 `cards/registry.ts` 注册；Root 自动为所有注册卡生成独立 Composition。

文案、主持人、品牌、示例素材和固定退场时间不得继续作为卡片硬依赖。转场的前后场景、多素材卡的图片列表必须从外部注入。

## 3. 渲染

```bash
npm run cards:render
npm run cards:render -- --only=text/quote-card,component/number-counter
```

每张迁移卡输出 `preview.mp4` 和 Manifest 声明的 QA 帧到 `output/card-renders/<card-id>/`。

## 4. 视觉验收与状态回写

实际查看预览和 QA 帧后，才可运行：

```bash
npm run cards:approve -- --only=text/quote-card
npm run cards:inventory
```

批准脚本检查视频和全部 QA 帧是否存在，将 Manifest 改为 `ready`，并把来源 ID、目标 ID、批准时间和证据路径写入 `ready.json`。缺少任何证据文件都会失败，不能只凭类型检查或文件复制标记 ready。
