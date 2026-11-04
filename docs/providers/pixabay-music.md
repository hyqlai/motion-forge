# Pixabay Music BGM Provider

Pixabay Music 是 `ResourceProvider` 的音频实现，负责按关键词搜索 BGM，并把选中的曲目下载到当前项目的 `public/` 目录。Film IR 不登记远程音频 URL，渲染只读取项目内相对路径。

## 启用与密钥

密钥只从环境变量读取，不写入代码、Film IR、`assets.json`、日志或提交记录。

| 环境变量 | 必填 | 作用 |
|---|---|---|
| `PIXABAY_API_KEY` | 是 | Pixabay API 密钥；缺失时 provider 直接报 `not-configured`，不会发起任何 HTTP 请求。 |
| `PIXABAY_MUSIC_ENABLED` | 否 | `true`/`1`/`yes`/`on` 显式启用；`false` 等值显式禁用。未设置时以是否提供 `PIXABAY_API_KEY` 作为启用条件。 |
| `PIXABAY_API_BASE_URL` | 否 | API 根地址，默认 `https://pixabay.com`；用于代理、镜像或本地 mock。 |
| `PIXABAY_MUSIC_SEARCH_PATH` | 否 | 搜索路径，默认 `/api/music/`；Pixabay 调整音乐接口路径时可覆盖。 |

未配置密钥或显式禁用时，`search` 和 `download` 都在本地失败，不产生外部调用。

## 命令

在独立项目根目录执行：

```bash
PIXABAY_API_KEY=... npm run forge -- bgm \
  --project gravity \
  --query "calm cinematic piano" \
  --volume 0.2 \
  --loop
```

参数：

- `--project <id>`：必填，`output/projects/<id>/` 下的项目。
- `--query "<terms>"`：必填，Pixabay Music 搜索词。
- `--candidate <id>`：多条结果时指定曲目 ID，可使用完整 candidate id 或 Pixabay 数字 ID。没有指定且返回多条结果时命令报错并列出候选，不会擅自选择。
- `--volume <0..1>`：BGM 音量，默认 `0.2`，写入 `audio.bgm.volume`。
- `--loop` / `--no-loop`：是否循环，默认 `--loop`。
- `--search-only`：只搜索并打印候选，不下载、不修改 `film.json`。

成功后的行为：

1. 下载到 `public/assets/<project-id>/bgm-<pixabay-id>.<ext>`。
2. 用 `ffprobe` 验证下载文件确实是可解码音频；验证失败会删除文件并报错。
3. 登记 `assets.json`：`kind: audio`、`role: bgm`，保留 `source`、`pixabayId`、作者、时长、`license: Pixabay Content License`、许可证地址和 probe 结果。
4. 写回 `audio.bgm = {src, volume, loop}`，`src` 是 `public/` 下的项目相对路径；已有 `audio.voice` 与 `audio.sfx` 三轨内容保持不变。
5. 若项目此前已通过 G1/G2，状态退回 `design-review`，旧审批失效。

## 错误

所有失败都显式返回非零退出码，不生成占位音频：

| 场景 | provider 错误码 |
|---|---|
| 未配置密钥或未启用 | `not-configured` |
| 搜索无结果 | 命令报 `Pixabay Music returned no results ...`，不修改 Film |
| 认证失败（HTTP 401/403） | `auth` |
| 触发限流（HTTP 429） | `rate-limit` |
| 其他搜索 HTTP 失败 | `http` |
| 网络错误或超时 | `network` |
| 响应不是预期 JSON / 缺少音频 URL | `invalid-response` |
| 下载失败、下载响应非 2xx 或写入失败 | `download-failed` |

## 验证

本地 mock HTTP 验收不依赖真实密钥或网络：

```bash
npx tsx scripts/verify-pixabay-provider.ts
```

该脚本覆盖：缺密钥/禁用时不发请求、搜索成功与空结果、401、429、下载落盘字节一致、下载失败不留残文件、CLI 搜索并接入 `audio.bgm`。

真实渲染验收使用项目内音频 fixture 作为 mock 下载内容，启动本地 mock 服务后在独立项目中执行 `forge bgm`，再渲染样板镜；用 `ffprobe` 确认 MP4 同时包含 H.264 视频流和 AAC 音频流，且 `ffmpeg volumedetect` 不是静音。

## 已知限制

- Pixabay 官方 API 文档主要覆盖图片和视频，音乐接口可能随官方调整而变化；因此保留 `PIXABAY_API_BASE_URL` 与 `PIXABAY_MUSIC_SEARCH_PATH` 注入点，并用响应字段的多种命名兼容实际返回。
- 当前只下载单曲 BGM，不处理曲目片段裁剪或多首串接。
- 真实 Pixabay 线上接口尚未在本机用真实密钥验证；mock 验收只证明接口适配、落盘、接入和渲染链路。
