import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createReadStream, realpathSync, statSync} from 'node:fs';
import {readFile, rename, writeFile} from 'node:fs/promises';
import type {IncomingMessage, ServerResponse} from 'node:http';
import {defineConfig, type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import {filmSchema, productionStateSchema} from '../core/schema.ts';
import {resetForDesignRevision} from '../core/production-state.ts';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(projectRoot, 'output');
const projectsRoot = path.join(outputRoot, 'projects');

const mimeMap: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

const sendJson = (res: ServerResponse, status: number, value: unknown): void => {
  const body = JSON.stringify(value);
  res.writeHead(status, {'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body)});
  res.end(body);
};

const readJsonBody = async (req: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 2_000_000) throw new Error('Film IR request exceeds 2 MB');
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

const writeJsonAtomic = async (file: string, value: unknown): Promise<void> => {
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporary, file);
};

const projectApiPlugin = (): Plugin => ({
  name: 'motion-forge-project-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      let pathname: string;
      try {
        pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
      } catch {
        sendJson(res, 400, {error: 'Invalid project URL'});
        return;
      }
      const match = pathname.match(/^\/api\/projects\/([a-z0-9-]+)\/film$/);
      if (!match) {
        next();
        return;
      }
      const id = match[1];
      const directory = path.join(projectsRoot, id);
      const filmFile = path.join(directory, 'film.json');
      const stateFile = path.join(directory, 'project.json');
      try {
        if (req.method === 'GET') {
          const film = filmSchema.parse(JSON.parse(await readFile(filmFile, 'utf8')));
          sendJson(res, 200, film);
          return;
        }
        if (req.method === 'PUT') {
          const origin = req.headers.origin;
          if (origin && new URL(origin).host !== req.headers.host) {
            sendJson(res, 403, {error: 'Cross-origin project writes are not allowed'});
            return;
          }
          const film = filmSchema.parse(await readJsonBody(req));
          if (film.id !== id) throw new Error('Film id must match the project id');
          const current = filmSchema.parse(JSON.parse(await readFile(filmFile, 'utf8')));
          if (JSON.stringify(current) === JSON.stringify(film)) {
            sendJson(res, 200, {film, approvalReset: false});
            return;
          }
          const state = productionStateSchema.parse(JSON.parse(await readFile(stateFile, 'utf8')));
          const approvalReset = state.status !== 'design-review';
          const nextState = approvalReset
            ? resetForDesignRevision(state, `Film IR changed in workbench at ${new Date().toISOString()}`)
            : state;
          await writeJsonAtomic(filmFile, film);
          if (approvalReset) await writeJsonAtomic(stateFile, nextState);
          sendJson(res, 200, {film, approvalReset, status: nextState.status});
          return;
        }
        sendJson(res, 405, {error: 'Method not allowed'});
      } catch (error) {
        sendJson(res, 400, {error: error instanceof Error ? error.message : 'Project request failed'});
      }
    });
  },
});

// 只托管 output/ 内的真实文件，拒绝路径穿越与指向项目外的软链接。
const serveOutputPlugin = (): Plugin => ({
  name: 'serve-output-media',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      let pathname: string;
      try {
        pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
      } catch {
        res.writeHead(400);
        res.end('Invalid URL');
        return;
      }
      if (!pathname.startsWith('/output/')) {
        next();
        return;
      }
      const candidate = path.resolve(outputRoot, pathname.slice('/output/'.length));
      const relative = path.relative(outputRoot, candidate);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      try {
        const filePath = realpathSync(candidate);
        const realRelative = path.relative(outputRoot, filePath);
        if (realRelative.startsWith('..') || path.isAbsolute(realRelative)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }
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
          const start = Number(parts[0]);
          const end = parts[1] ? Number(parts[1]) : total - 1;
          if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end >= total) {
            res.writeHead(416, {'Content-Range': `bytes */${total}`});
            res.end();
            return;
          }
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${total}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': end - start + 1,
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
  plugins: [react(), projectApiPlugin(), serveOutputPlugin()],
  server: {
    port: 5178,
    fs: {allow: [projectRoot]},
  },
  build: {
    outDir: path.join(projectRoot, 'output', 'workbench-dist'),
    emptyOutDir: true,
  },
});
