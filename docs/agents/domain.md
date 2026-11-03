# Domain Docs

工程 skill 在探索代码库时应如何消费本仓库的领域文档。

## 探索前先读

- 仓库根目录的 **`GLOSSARY.md`**，或
- 根目录的 **`GLOSSARY-MAP.md`**（如存在）：它指向每个 context 的 `GLOSSARY.md`，按需读取
- **`docs/adr/`**：阅读涉及即将修改区域的 ADR。多 context 仓库还需检查 `src/<context>/docs/adr/` 中的上下文决策

如果这些文件不存在，**静默继续**。不要标记缺失，不要建议预先创建。`/domain-modeling` skill（通过 `/grill-with-docs` 和 `/improve-codebase-architecture` 触发）会在术语或决策实际产生时惰性创建。

## 文件结构

单 context 仓库（大多数仓库）：

```
/
├── GLOSSARY.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

多 context 仓库（根目录存在 `GLOSSARY-MAP.md`）：

```
/
├── GLOSSARY-MAP.md
├── docs/adr/                          ← 系统级决策
└── src/
    ├── ordering/
    │   ├── GLOSSARY.md
    │   └── docs/adr/                  ← 上下文特定决策
    └── billing/
        ├── GLOSSARY.md
        └── docs/adr/
```

## 使用术语表的词汇

当输出涉及领域概念（issue 标题、重构提案、假设、测试名）时，使用 `GLOSSARY.md` 中定义的术语。不要漂移到术语表明确避免的同义词。

如果需要的概念不在术语表中，这是一个信号：要么你在发明项目不使用的语言（重新考虑），要么确实存在缺口（记下来交给 `/domain-modeling`）。

## 标记 ADR 冲突

如果输出与现有 ADR 矛盾，显式提出而非静默覆盖：

> _与 ADR-0007（event-sourced orders）矛盾，但值得重新讨论，因为……_
