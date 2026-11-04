# Resource Provider 契约：Pexels 图片

## 1. 接口边界

外部素材统一实现 `providers/resources.ts` 中的 `ResourceProvider`：

```ts
type ResourceQuery = {
  kind: ResourceKind;
  query: string;
  sceneId: string;
  aspect?: string;
  count?: number;
  minimumDurationSeconds?: number;
  style?: string;
};
```

- `search()` 只负责检索，返回 `ResourceCandidate`，不写入 Film IR。
- `download(candidate, destination)` 只负责把远程文件写到调用方指定的本地路径。
- 调用方负责项目路径、素材登记、场景引用、审批重置和目标 Film 校验。
- 渲染阶段不得读取 `previewUrl`、`downloadUrl` 或任何远程 URL；它们只作为检索与来源元数据保留。

Pexels 的首个实现位于 `providers/pexels.ts`，通过 `createPexelsResourceProvider()` 创建，`id` 为 `pexels`，仅支持 `image`。检索结果保留标题、预览图、来源页、摄影者、尺寸、主色和 Pexels License 元数据。

## 2. 启用边界

- 只有显式执行 `search-images` 或 `fetch-image` 子命令才会访问 Pexels。
- `create`、`init`、`validate`、`render` 和常规本地素材流程永不访问外部服务。
- 未设置 `PEXELS_API_KEY`（或只有空白字符）时，Provider 在创建阶段即抛出 `unconfigured`，不会发出任何 HTTP 请求。
- 密钥只从环境变量读取，不写入命令参数、代码、Film IR、日志或项目文件。
- 搜索记录和素材元数据不包含密钥；`fetch-image` 下载图片时不向图片 CDN 发送 Authorization 头。

## 3. 环境变量

| 变量 | 必需 | 说明 |
|---|---|---|
| `PEXELS_API_KEY` | 是 | Pexels API 密钥，仅从环境变量读取 |
| `PEXELS_BASE_URL` | 否 | 覆盖 API 基地址，默认 `https://api.pexels.com`；仅用于本地 mock 或代理，不影响图片 CDN URL |

## 4. CLI

在独立项目根目录执行：

```bash
# 检索候选，结果写入 output/projects/<id>/image-search.json
npm run forge -- search-images --project <id> --query "mountain lake" \
  [--scene S01-opening] [--count 15] [--aspect 16:9]

# 从检索记录中选择一张，下载并登记到 Film IR
npm run forge -- fetch-image --project <id> --candidate <pexels-photo-id> \
  [--scene S01-opening] [--role reference] [--asset-id pexels-<id>]
```

- `--count` 取值 1–80，默认 15。
- `--aspect` 支持 `16:9`、`9:16`、`1:1` 及 `landscape`、`portrait`、`square`，映射到 Pexels `orientation`。
- `--scene` 省略时使用 Film 的第一个场景；传入未知场景会显式报错。
- `--candidate` 使用 Pexels 图片 ID，必须在当前 `image-search.json` 中存在。

`image-search.json` 结构：

```json
{
  "schemaVersion": "1.0.0",
  "provider": "pexels",
  "query": "mountain lake",
  "sceneId": "S01-opening",
  "aspect": "16:9",
  "searchedAt": "2026-11-04T00:00:00.000Z",
  "candidates": [
    {
      "id": "101",
      "kind": "image",
      "title": "Mountain lake at dawn",
      "previewUrl": "https://images.pexels.com/...",
      "downloadUrl": "https://images.pexels.com/...",
      "sourceUrl": "https://www.pexels.com/photo/...",
      "provider": "pexels",
      "metadata": {
        "photographer": "Ada",
        "photographerUrl": "https://www.pexels.com/@ada",
        "width": 1920,
        "height": 1080,
        "license": "Pexels License",
        "licenseUrl": "https://www.pexels.com/license/"
      }
    }
  ]
}
```

## 5. 本地化与 Film IR

`fetch-image` 的落盘与登记规则：

1. 下载到 `public/assets/<project-id>/<asset-id><extension>`；扩展名从下载 URL 推断，未知时使用 `.jpg`。
2. `film.assets` 新增条目：`path` 为 `assets/<project-id>/<asset-id><ext>` 相对路径，`source` 保存 Pexels 来源页，`metadata` 保存标题、摄影者、License、预览 URL、检索时间等来源信息。
3. 指定 `--scene` 时把 `assetId` 追加到该场景的 `assetIds`。
4. 写入前调用目标 Film 校验，确认文件存在且路径不是远程 URL、绝对路径或 `..` 越界；校验失败会删除刚下载的文件。
5. 同步更新 `assets.json`，保持与 `film.assets` 一致。
6. 素材变化属于设计变更：若项目已过 G1/G2，状态退回 `design-review` 并记录原因，必须重新确认。

不存在的候选、重复素材 ID、已存在的本地文件、未知场景、越界路径均直接报错，不回退到无关占位图。

## 6. 错误分类

| `code` | 触发条件 | 处理 |
|---|---|---|
| `unconfigured` | 未配置 `PEXELS_API_KEY` | 保持纯本地流程，不发起请求 |
| `invalid-config` | `PEXELS_BASE_URL` 不是合法 http(s) URL | 修正环境变量 |
| `auth` | 搜索返回 401/403 | 检查密钥，不重试、不切换来源 |
| `rate-limit` | 返回 429 | 读取 `Retry-After`（秒），等待后手动重试 |
| `no-results` | 搜索成功但 `photos` 为空 | 修改查询词，不生成占位图 |
| `http` | 其他搜索 HTTP 错误或网络错误 | 报告状态码/原因 |
| `invalid-response` | 响应缺少 `photos` 或图片源字段 | 报告并停止 |
| `download` | 图片下载非 2xx、非图片内容、空文件或写入失败 | 报告并删除未完成的本地文件 |

## 7. 验证

不依赖真实密钥或外网，使用本地 mock HTTP 覆盖搜索、元数据、无结果、401、429、下载成功、下载失败和 CLI 端到端：

```bash
npm run test:pexels
```

该检查会在临时目录运行 `forge create` 生成独立工程，再执行 `search-images`、`fetch-image` 和 `validate --project`，确认素材落盘、Film IR 相对路径、审批重置与错误报告。
