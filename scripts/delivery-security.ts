import {createHash} from 'node:crypto';
import {copyFile, mkdir, readFile, readdir, lstat, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import type {FilmSpec} from '../core/schema';

const runtimeDirectories = ['core', 'cards', 'providers', 'scenes', 'scripts', 'workbench', 'public', 'examples'];
const runtimeFiles = ['package.json', 'package-lock.json', 'tsconfig.json', 'remotion.config.ts', '.gitignore'];
const blockedDirectories = new Set(['node_modules', '.git', 'build', 'dist', '.render-cache', '.vite', '.cache', '.venv', '__pycache__']);
const textExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt', '.html', '.css', '.yaml', '.yml', '.xml', '.svg', '.csv', '.srt', '.vtt']);
const localPathPattern = /(?:file:\/\/[^\s"'<>|]+|(?<![\w}])[A-Za-z]:[\\/][^\s"'<>|]+|(?<![\w\\])\\\\[A-Za-z0-9_.$-]+\\[A-Za-z0-9_.$-]+(?:\\[A-Za-z0-9_.$ -]+)*|(?<![\w@+.-])\/(?:home|Users|mnt|media|root|tmp|var|opt|private|etc|srv|data|workspace|workspaces)(?:\/[^\s"'<>|()]*)+)/g;

export const sensitiveFilename = (value: string): boolean => {
  const name = path.basename(value).toLowerCase();
  return name === '.env'
    || name.startsWith('.env.')
    || name === '.npmrc'
    || name === '.netrc'
    || name === '.pypirc'
    || name.startsWith('id_rsa')
    || name.startsWith('id_ed25519')
    || name.startsWith('credentials')
    || name.startsWith('secrets')
    || ['.pem', '.key', '.p12', '.pfx', '.jks', '.keystore'].includes(path.extname(name));
};

const localMarker = (value: string): string => {
  const match = value.match(/^(.*?)([),.;:]*)$/);
  const body = (match?.[1] ?? value).replace(/\\/g, '/').replace(/\/+$/, '');
  const suffix = match?.[2] ?? '';
  const basename = path.posix.basename(body) || 'redacted';
  return `[local-file:${basename}]${suffix}`;
};

// HTTP 来源 URL 是合法元数据；只替换本机路径，避免把 URL 的路径段误当成本机目录。
export const sanitizeDeliveryText = (value: string): string => {
  const urls: string[] = [];
  const protectedText = value.replace(/https?:\/\/[^\s"'<>|]+/gi, (url) => {
    const token = `__MOTION_FORGE_URL_${urls.length}__`;
    urls.push(url);
    return token;
  });
  return protectedText.replace(localPathPattern, (match) => localMarker(match)).replace(
    /__MOTION_FORGE_URL_(\d+)__/g,
    (_, index: string) => urls[Number(index)],
  );
};

const isAbsoluteLocalValue = (value: string): boolean => {
  if (/^https?:\/\//i.test(value)) return false;
  return value.startsWith('/') || value.startsWith('file://') || /^[A-Za-z]:[\\/]/.test(value) || value.startsWith('\\\\');
};

const sanitizeJsonValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return isAbsoluteLocalValue(value) ? localMarker(value) : sanitizeDeliveryText(value);
  }
  if (Array.isArray(value)) return value.map(sanitizeJsonValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, sanitizeJsonValue(item)]));
  }
  return value;
};

const copyTree = async (source: string, destination: string, relative = ''): Promise<void> => {
  const info = await lstat(source);
  if (info.isSymbolicLink()) throw new Error(`Delivery source contains a symbolic link: ${relative || source}`);
  if (info.isDirectory()) {
    await mkdir(destination, {recursive: true});
    for (const entry of await readdir(source, {withFileTypes: true})) {
      const childRelative = path.posix.join(relative.replace(/\\/g, '/'), entry.name);
      if (blockedDirectories.has(entry.name) || sensitiveFilename(entry.name)) continue;
      if (relative.startsWith('output/projects/') && (childRelative.endsWith('/qa') || childRelative.includes('/qa/'))) continue;
      if (relative.startsWith('output/projects/') && path.extname(entry.name).toLowerCase() === '.mp4') continue;
      await copyTree(path.join(source, entry.name), path.join(destination, entry.name), childRelative);
    }
    return;
  }
  if (!info.isFile()) throw new Error(`Delivery source is not a regular file: ${relative}`);
  await mkdir(path.dirname(destination), {recursive: true});
  // 只脱敏项目事实源与说明；运行时代码必须原样扫描，避免绝对依赖被改写后漏检。
  if (relative.startsWith('output/projects/')
    && ['.json', '.md', '.txt', '.csv', '.srt', '.vtt'].includes(path.extname(source).toLowerCase())) {
    const text = await readFile(source, 'utf8');
    if (path.extname(source).toLowerCase() === '.json') {
      try {
        const sanitized = sanitizeJsonValue(JSON.parse(text));
        await writeFile(destination, `${JSON.stringify(sanitized, null, 2)}\n`);
        return;
      } catch {
        // 非标准 JSON 仍按文本脱敏，最终扫描会阻止遗漏的本机路径进入包内。
      }
    }
    await writeFile(destination, sanitizeDeliveryText(text));
    return;
  }
  await copyFile(source, destination);
};

const copyRuntimeFile = async (projectRoot: string, stagingDirectory: string, relative: string): Promise<void> => {
  const source = path.join(projectRoot, relative);
  const info = await lstat(source);
  if (info.isSymbolicLink() || !info.isFile()) throw new Error(`Runtime file must be a regular project file: ${relative}`);
  const destination = path.join(stagingDirectory, relative);
  await mkdir(path.dirname(destination), {recursive: true});
  await copyFile(source, destination);
};

const hashFile = async (file: string): Promise<string> => createHash('sha256').update(await readFile(file)).digest('hex');

const writeAssetManifest = async (projectRoot: string, stagingDirectory: string, film: FilmSpec): Promise<void> => {
  const assets = [];
  for (const asset of film.assets) {
    if (sensitiveFilename(asset.path)) throw new Error(`Film references a sensitive asset filename: ${asset.id}`);
    const file = path.join(projectRoot, 'public', ...asset.path.split('/'));
    const info = await stat(file);
    assets.push({
      id: asset.id,
      kind: asset.kind,
      role: asset.role,
      path: asset.path,
      ...(asset.source ? {source: sanitizeJsonValue(asset.source)} : {}),
      metadata: sanitizeJsonValue(asset.metadata),
      bytes: info.size,
      sha256: await hashFile(file),
    });
  }
  const manifest = sanitizeJsonValue({
    schemaVersion: '1.0.0',
    projectId: film.id,
    assets,
    audio: {
      bgm: film.audio.bgm ?? null,
      voiceSegments: film.audio.voice.segments,
      sfxEvents: film.audio.sfx.events,
    },
  });
  await writeFile(path.join(stagingDirectory, 'assets-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
};

const chineseReadme = (projectId: string): string => `# Motion Forge 项目交付包：${projectId}

本目录是完整、可编辑、可独立运行的视频工程，不需要访问原制作环境或 Motion Forge 技能目录。

## 交付内容

- \`video/film.mp4\`：已通过 ffprobe 与 ffmpeg 完整解码检查的最终视频。
- \`output/projects/${projectId}/\`：Film IR、输入与审批记录等可编辑项目事实源。
- \`public/\`、\`core/\`、\`cards/\`、\`scenes/\`、\`providers/\`：本地素材与完整运行时代码。
- \`qa/qa-report.json\`、\`qa/qa-report.md\`：机器可读与人工可读 QA 报告。
- \`assets-manifest.json\`：素材路径、来源、大小与 SHA-256 清单。

原工程中的本机绝对路径仅在本交付副本的来源/输入元数据中替换为 \`[local-file:文件名]\`；原始素材内容、Film 分镜与审批事实未改写。

## 独立运行

需要 Node.js、npm、ffmpeg 和 ffprobe。在本目录执行：

\`\`\`bash
npm ci
npm run validate -- --project ${projectId}
npm run build
npm run forge -- render --project ${projectId} --scope film --gl swangle --bundle-cache=false
\`\`\`

重新渲染的结果写入 \`output/projects/${projectId}/film.mp4\`，不会覆盖 \`video/film.mp4\` 中的交付母版。Three.js 默认使用 \`swangle\` 软件渲染；如本机浏览器尚未安装，Remotion 会在项目依赖目录内准备浏览器。\`--bundle-cache=false\` 只关闭 webpack 打包缓存，避免 tmpfs 上的缓存写入兼容性问题，不影响画面、音频或增量帧缓存。

## 继续编辑

编辑 \`output/projects/${projectId}/film.json\` 后重新执行目标项目校验。也可启动工作台：

\`\`\`bash
npm run workbench -- --host 0.0.0.0
\`\`\`

浏览器打开 \`http://127.0.0.1:5178/?project=${projectId}\`。已审批内容发生变化时必须重新通过 G1/G2，再渲染和导出。交付包不携带密钥；确需在线 Provider 时，由接收方在自己的环境中临时配置，切勿写入工程文件。
`;

export const createDeliveryCopy = async (options: {
  projectRoot: string;
  projectId: string;
  projectDirectory: string;
  stagingDirectory: string;
  film: FilmSpec;
}): Promise<void> => {
  const {projectRoot, projectId, projectDirectory, stagingDirectory, film} = options;
  for (const relative of runtimeDirectories) {
    await copyTree(path.join(projectRoot, relative), path.join(stagingDirectory, relative), relative);
  }
  for (const relative of runtimeFiles) await copyRuntimeFile(projectRoot, stagingDirectory, relative);
  const projectRelative = path.posix.join('output/projects', projectId);
  await copyTree(projectDirectory, path.join(stagingDirectory, projectRelative), projectRelative);
  await mkdir(path.join(stagingDirectory, 'video'), {recursive: true});
  await copyFile(path.join(projectDirectory, 'film.mp4'), path.join(stagingDirectory, 'video', 'film.mp4'));
  await writeFile(path.join(stagingDirectory, 'motion-forge-project.json'), '{"schemaVersion":"1.0.0"}\n');
  await writeFile(path.join(stagingDirectory, 'README.md'), chineseReadme(projectId));
  await writeAssetManifest(projectRoot, stagingDirectory, film);
};

const placeholderCredential = (value: string): boolean => {
  return !value.trim()
    || /^(?:\.\.\.|<.*>|\$\{.*\}|.*(?:example|fixture|demo|dummy|test|your[-_]|xxxx).*)$/i.test(value.trim());
};

const scanText = (relative: string, text: string, violations: string[]): void => {
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(text)) violations.push(`${relative}: private key material`);
  const credentialPattern = /["']?(?:[a-z0-9_]*(?:api[_-]?key|access[_-]?token|secret|password))["']?\s*[:=]\s*["']([^"'\n]+)["']/gi;
  for (const match of text.matchAll(credentialPattern)) {
    if (!placeholderCredential(match[1])) violations.push(`${relative}: hard-coded credential`);
  }
  const environmentPattern = /^\s*(?:export\s+)?[A-Z0-9_]*(?:API_KEY|TOKEN|SECRET|PASSWORD)\s*=\s*([^\s#]+)/gim;
  for (const match of text.matchAll(environmentPattern)) {
    const value = match[1].replace(/^["']|["']$/g, '');
    if (!placeholderCredential(value)) violations.push(`${relative}: credential assignment`);
  }
  const withoutUrls = text.replace(/https?:\/\/[^\s"'<>|]+/gi, '');
  const localPath = withoutUrls.match(localPathPattern);
  if (localPath) violations.push(`${relative}: local absolute path (${localMarker(localPath[0])})`);
  if (/\.[cm]?[jt]sx?$/.test(relative)) {
    // 模块路径必须留在交付根目录内，避免干净副本通过绝对路径或多层 .. 意外解析回原技能目录。
    const importPatterns = [
      /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)["']([^"']+)["']/g,
      /\bimport\s*["']([^"']+)["']/g,
    ];
    for (const pattern of importPatterns) {
      for (const match of text.matchAll(pattern)) {
        const specifier = match[1];
        if (specifier.startsWith('/')
          || specifier.startsWith('file://')
          || /^[A-Za-z]:[\\/]/.test(specifier)
          || specifier.startsWith('\\\\')) {
          violations.push(`${relative}: absolute source import`);
          continue;
        }
        if (!specifier.startsWith('.')) continue;
        const resolved = path.posix.normalize(path.posix.join(
          path.posix.dirname(relative),
          specifier.replace(/\\/g, '/'),
        ));
        if (resolved === '..' || resolved.startsWith('../')) {
          violations.push(`${relative}: relative source import escapes delivery root`);
        }
      }
    }
  }
};

export const scanDelivery = async (root: string): Promise<{files: number; violations: string[]}> => {
  const violations: string[] = [];
  let files = 0;
  const walk = async (directory: string, relative = ''): Promise<void> => {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const childRelative = path.posix.join(relative, entry.name);
      const absolute = path.join(directory, entry.name);
      const info = await lstat(absolute);
      if (info.isSymbolicLink()) {
        violations.push(`${childRelative}: symbolic link`);
        continue;
      }
      if (info.isDirectory()) {
        if (blockedDirectories.has(entry.name)) violations.push(`${childRelative}: excluded directory`);
        else if (['.ssh', '.aws'].includes(entry.name)) violations.push(`${childRelative}: credential directory`);
        else await walk(absolute, childRelative);
        continue;
      }
      files += 1;
      if (sensitiveFilename(entry.name)) violations.push(`${childRelative}: sensitive filename`);
      if (relative === '' && ['package.json', 'package-lock.json'].includes(entry.name)) {
        const packageText = await readFile(absolute, 'utf8');
        if (/"(?:file|link):/.test(packageText)) violations.push(`${childRelative}: local npm dependency`);
      }
      if (textExtensions.has(path.extname(entry.name).toLowerCase()) || entry.name === '.gitignore') {
        scanText(childRelative, await readFile(absolute, 'utf8'), violations);
      }
    }
  };
  await walk(root);
  return {files, violations};
};
