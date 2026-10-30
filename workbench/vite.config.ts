import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createReadStream, statSync} from 'node:fs';
import {defineConfig, type Plugin} from 'vite';
import react from '@vitejs/plugin-react';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const mimeMap: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

// 托管 output/ 目录供工作台加载渲染产物、预览视频与 QA 帧图片
const serveOutputPlugin = (): Plugin => ({
  name: 'serve-output-media',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = decodeURIComponent(req.url ?? '');
      if (!url.startsWith('/output/')) {
        next();
        return;
      }
      const filePath = path.join(projectRoot, url);
      try {
        const stat = statSync(filePath);
        if (!stat.isFile()) {
          next();
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeMap[ext] ?? 'application/octet-stream';
        const total = stat.size;

        const range = req.headers.range;
        if (range && ext === '.mp4') {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
          const chunksize = (end - start) + 1;
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${total}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType,
          });
          createReadStream(filePath, {start, end}).pipe(res);
        } else {
          res.writeHead(200, {
            'Content-Length': total,
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes',
          });
          createReadStream(filePath).pipe(res);
        }
      } catch {
        next();
      }
    });
  },
});

export default defineConfig({
  root: path.join(projectRoot, 'workbench'),
  plugins: [react(), serveOutputPlugin()],
  server: {
    port: 5178,
    fs: {allow: [projectRoot]},
  },
  build: {
    outDir: path.join(projectRoot, 'output', 'workbench-dist'),
    emptyOutDir: true,
  },
});
