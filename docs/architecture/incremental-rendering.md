# 增量渲染

增量渲染是 `forge render --scope film --incremental` 的显式模式：按**场景内容哈希**识别变化的分镜，仅重渲变化分镜和必要的**转场边界**，未变化分镜复用内容版本匹配的**帧缓存**，最后重新合成并校验完整 `film.mp4`。不传 `--incremental` 时仍执行全量渲染。

## 使用

```bash
# G1/G2 已通过、目标 Film 校验通过后使用
npm run forge -- render --project <id> --scope film --incremental
# 保持原有全量渲染
npm run forge -- render --project <id> --scope film
# 端到端验证
npm run incremental:verify
```

`--incremental` 只接受 `--scope film`。CLI 日志会逐镜列出 `重渲分镜` / `复用分镜` 及原因（内容变化、转场边界、缓存失效、音频引用变化），并列出音频轨道是复用还是重渲。

## 门禁与校验

增量模式沿用 `assertRenderAllowed` 和 `validateFilm`：G1/G2 状态、场景注册、动效卡、本地素材、三轨音频引用和目标 Film 校验都不会被跳过。缓存命中只影响是否需要重新渲染帧，不影响校验结果。最终 MP4 与导出共用 `scripts/final-media-validation.ts`：ffprobe 必须确认 H.264、画幅、FPS、精确帧数（容差 0）、时长（容差 0.1 秒）和音视频流，ffmpeg `-xerror` 必须完整解码全片。

## 场景内容哈希

每个分镜计算两个哈希：

- `videoHash`：分镜结构、动效槽位、公开 props、关联素材文件哈希、相邻转场关系、全局主题、输出规格、渲染设置和渲染器内容版本。
- `sceneHash`：在 `videoHash` 输入上追加 BGM、Voice、SFX 三轨音频引用（路径、音量、循环、局部帧、文本和音源文件哈希）。

哈希输入统一按键名排序，只剔除 `downloadedAt`、生成时间、时间戳、临时路径等明确不稳定字段；`props.metadata` 及其他可能影响画面的字段全部保留，视觉 metadata 变化必须触发重渲。若剔除后只剩空容器，则省略该容器，避免新增一个仅含 `downloadedAt` 的 metadata 被误判为视觉变化。渲染设置只保留 `--gl`、并发值和浏览器可执行文件名，浏览器绝对路径不进入哈希。`from`、`end` 等全片绝对帧不进入分镜视觉哈希，避免前一镜时长变化导致后续所有画面无谓重渲。三轨音频的绝对帧换算进入独立的音频轨道哈希。

## 缓存与渲染基线

成功渲染后，项目内的 `.render-cache/` 保存：

- `video/<videoHash>.mp4`：静音的单镜 H.264 段，帧数等于该分镜局部时长。
- `audio/<audioHash>.wav`：完整三轨音频。
- `manifest.json`：**渲染基线**，包含缓存版本、哈希版本、项目 ID、Film ID、输出规格、渲染器内容版本、每镜 `sceneHash` / `videoHash` / 文件哈希 / 渲染时间、音频轨道哈希和完成时间。

基线只在最终 MP4 拼接和全片完整性校验全部通过后原子写入。任一分镜渲染、音频渲染、拼接或校验失败，都保留上一次成功基线，且不会替换上一版 `film.mp4`。失败时可能留下未被基线引用的临时缓存段，下一次成功渲染会覆盖同名内容版本文件。

复用缓存必须同时满足：缓存版本与哈希版本匹配、项目与 Film ID 匹配、输出画幅与帧率匹配、渲染器内容版本匹配、分镜 `videoHash` 与缓存文件名匹配、缓存文件哈希与基线记录一致、ffprobe 帧数与分镜时长一致。仅凭分镜 ID 或文件存在不能复用旧帧。

## 转场边界

`motion.transitionOut` 声明的分镜可能引用后继分镜的画面，因此边界关系进入 `videoHash`。当某个分镜的视觉内容版本变化时：

- 若前一镜声明 `transitionOut`，前一镜作为入向转场边界一起重渲；
- 若变化分镜自身声明 `transitionOut`，其后继分镜作为出向转场边界一起重渲；
- 其他未变化且无转场依赖的分镜继续复用缓存。

仅音频引用变化时不重渲画面，只按音频轨道哈希重渲整轨音频；画面日志会标明「音频引用变化」。

## 渲染器内容版本

渲染器内容版本覆盖 `core/`、`cards/`、`scenes/` 的运行时代码与资源、`public/textures`、`public/legacy-textures`、`public/audio`、`public/photos` 等全局静态素材，以及 `remotion.config.ts`、`package.json`、`package-lock.json`、`scripts/incremental-render.ts`、`scripts/final-media-validation.ts` 和 `scripts/motion-forge.ts`。版本变化会使全部帧缓存失效。`public/assets/<project-id>/` 是项目自有素材，由 Film 素材哈希和音频哈希精确覆盖，不进入全局渲染器指纹，避免一镜素材变化让整片缓存失效。

## 合成策略

每镜用 Remotion 渲染对应绝对帧区间并静音，单独渲染整轨 WAV 音频；随后按当前分镜顺序用 ffmpeg concat 拼接视频段，再与音频轨道复用。这样避免逐段 AAC 拼接带来的累计偏移，也不会输出「只渲单镜视频」冒充完整全片。视频段拼接时丢弃可能存在的静音音轨，最终音频只来自三轨渲染结果。

## 验证与限制

`scripts/verify-incremental-render.ts` 在临时项目中通过 CLI 验证：G1/G2 与目标 Film 校验、首次建立缓存、视觉 `props.metadata` 变化触发重渲、`downloadedAt` 不触发重渲、必要转场边界、失败不更新基线、恢复后基线更新、全量渲染仍可用，以及最终 MP4 的 FPS、精确帧数、时长、编码和完整解码。

增量缓存属于项目本地渲染中间件，不纳入交付包，也不依赖技能目录。当前实现按分镜顺序拼接，不跨项目共享缓存；若手动删除或篡改 `.render-cache/` 中的文件，下一次增量渲染会按缓存失效策略重新渲染受影响分镜。
