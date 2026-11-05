# QA 与交付包契约

## 1. 导出命令

目标项目必须先完成 G1/G2，并已生成 `output/projects/<id>/film.mp4`：

```bash
npm run forge -- export --project <id>
```

默认交付目录是 `output/deliveries/<id>`。可用 `--out <directory>` 指定新目录；目标目录必须不存在，且不能是源项目数据目录、工程根目录或它们的祖先目录。导出采用临时目录完成后原子重命名，失败不会留下半成品交付目录。

导出前会在原项目的 `output/projects/<id>/qa/` 写入：

- `qa-report.json`：供自动验收读取的检查状态与证据。
- `qa-report.md`：供人工复核的同一份结果。

任何检查失败都会使命令非零退出。报告只有 `passed` 和 `failed`，不把警告计为通过。原项目的 Film、输入和素材事实源不会因导出而改写；新增或更新 QA 报告不属于事实源改写。

## 2. QA 检查

| 检查 ID | 判定内容 |
| --- | --- |
| `film-schema` | `film.json` 通过 Film Schema。 |
| `target-film-validation` | 对目标 Film 执行与渲染一致的完整校验，而不是只校验内置示例。 |
| `scene-card-registry` | 所有场景组件和主动效、运镜、文字、转场卡片均已注册。 |
| `asset-localization` | 所有素材均为 `public/` 内真实普通文件，不允许外部路径和软链接。 |
| `total-frames` | 编译时间线等于分镜帧数之和，记录每镜起点、总帧数、帧率和预期时长。 |
| `audio-tracks` | BGM、Voice、SFX 的本地音源、场景引用、局部帧和全片换算合法。 |
| `video-ffprobe` | 与增量渲染共用最终片校验：最终 MP4 存在且非空；H.264 视频的宽高、FPS（容差 0.001）、精确帧数（容差 0）、时长（容差 0.1 秒）与 Film 一致，音轨存在性与三轨声明一致。 |
| `video-decode` | 与增量渲染共用同一完整解码函数，使用 `ffmpeg -xerror` 解码全片，不只读取封装信息。 |
| `approval-gates` | 状态机允许全片生产，且 G1/G2 审批时间均存在。 |
| `delivery-hygiene` | 交付副本不含密钥、凭据文件、本机绝对路径、外部源码 import、本地 npm 依赖、软链接、依赖目录、版本库和渲染缓存。 |

失败证据写入对应检查项。缺少视频时，ffprobe 与完整解码都会明确失败；解码工具失败不会被 ffprobe 的成功掩盖。

## 3. 交付包结构

```text
<delivery>/
├── video/film.mp4                 # 已验收的交付母版
├── qa/qa-report.json
├── qa/qa-report.md
├── assets-manifest.json           # 素材来源、路径、字节数和 SHA-256
├── README.md                      # 中文独立运行说明
├── motion-forge-project.json
├── package.json / package-lock.json
├── tsconfig.json / remotion.config.ts
├── output/projects/<id>/          # Film IR、输入、审批和分析等可编辑事实源
├── public/                        # 本地素材与全局静态资源
├── core/ cards/ scenes/ providers/
├── scripts/ workbench/ examples/
└── .gitignore
```

`video/film.mp4` 是交付母版。接收方重新渲染的结果仍写入 `output/projects/<id>/film.mp4`，不会覆盖母版。

## 4. 脱敏与安全边界

- 只对 `output/projects/<id>/` 中的 JSON、Markdown、文本、CSV 和字幕等事实源/说明做副本脱敏。`assets.source`、输入元数据和复核说明中的本机路径替换为 `[local-file:basename]`，合法 HTTP/HTTPS 来源 URL 保留。
- 运行时代码、配置和锁文件原样复制后接受扫描。绝对路径 import 和规范化后逃出交付根目录的相对 import 都必须拒绝，不能先改写成无害字符串再放行。
- 不读取 `.env`、私钥或凭据文件内容；复制阶段按文件名和扩展名排除。硬编码密钥、私钥文本、敏感环境变量赋值会阻止导出，错误证据不记录密钥值。
- 排除 `node_modules`、`.git`、`build`、`dist`、`.render-cache`、`.vite`、`.cache` 等目录；源树中的软链接会阻止导出。
- `package.json` 与锁文件中的 `file:`/`link:` 依赖会阻止导出。渲染、校验和工作台都从交付目录内解析代码、素材和运行时路径。

## 5. 接收方独立运行

在交付目录执行：

```bash
npm ci
npm run validate -- --project <id>
npm run build
npm run forge -- render --project <id> --scope film --gl swangle --bundle-cache=false
```

需要 Node.js、npm、ffmpeg 和 ffprobe。首次渲染可能由 Remotion 下载 Chrome Headless Shell；该浏览器安装在交付项目自己的依赖目录中，不依赖原制作环境。编辑 Film 后必须重新通过目标校验和 G1/G2，再渲染与导出。

## 6. 端到端验证

```bash
npm run export:verify
```

验证脚本沿用 `tsx`、CLI、ffprobe/ffmpeg 和真实 Remotion 渲染，不引入测试框架。它使用 320×180、24 帧的三轨 fixture，覆盖：

- 正常导出及 JSON/Markdown QA、素材哈希和包结构。
- 未批准、缺少视频、仅少 1 帧、完整解码失败的非零拒绝。
- 密钥拒绝、本机路径副本脱敏、原事实源不变，以及绝对/越界相对源码 import 拒绝。
- 干净副本独立 `npm ci`、目标 Film 校验、TypeScript/工作台构建和 swangle 真实渲染，最后再次检查帧数、音轨与完整解码。
