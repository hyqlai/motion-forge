import {lstat, mkdir, realpath} from 'node:fs/promises';
import path from 'node:path';

const isInside = (root: string, target: string): boolean => {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
};

const assertInside = (root: string, target: string, label: string): void => {
  if (!isInside(root, target)) throw new Error(`${label} escapes the project public directory: ${target}`);
};

const assertExistingAncestor = async (publicRoot: string, directory: string): Promise<void> => {
  let current = directory;
  while (true) {
    try {
      const info = await lstat(current);
      if (!info.isDirectory() && !info.isSymbolicLink()) {
        throw new Error(`Asset destination parent is not a directory: ${current}`);
      }
      assertInside(publicRoot, await realpath(current), 'Asset destination');
      return;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      const parent = path.dirname(current);
      if (parent === current) throw error;
      current = parent;
    }
  }
};

export const preparePublicAssetDestination = async (options: {
  projectRoot: string;
  publicRoot: string;
  relativePath: string;
}): Promise<string> => {
  const projectRoot = path.resolve(options.projectRoot);
  const publicRoot = path.resolve(options.publicRoot);
  if (publicRoot !== path.join(projectRoot, 'public')) {
    throw new Error(`Asset public root must be the project public directory: ${publicRoot}`);
  }

  // public/ 自身也不能是指向别处的软链，否则以其 realpath 为边界仍会把外部写入判成合法。
  const realProjectRoot = await realpath(projectRoot);
  const realPublicRoot = await realpath(publicRoot);
  if (realPublicRoot !== path.join(realProjectRoot, 'public')) {
    throw new Error(`Asset public root escapes the project public directory: ${publicRoot}`);
  }

  const normalized = path.posix.normalize(options.relativePath.replace(/\\/g, '/'));
  if (path.isAbsolute(options.relativePath)
    || /^[a-z][a-z\d+.-]*:/i.test(options.relativePath)
    || normalized.startsWith('/')
    || normalized === '.'
    || normalized === '..'
    || normalized.startsWith('../')) {
    throw new Error(`Asset destination escapes the project public directory: ${options.relativePath}`);
  }
  const destination = path.resolve(realPublicRoot, ...normalized.split('/'));
  assertInside(realPublicRoot, destination, 'Asset destination');

  const parent = path.dirname(destination);
  await assertExistingAncestor(realPublicRoot, parent);
  await mkdir(parent, {recursive: true});
  assertInside(realPublicRoot, await realpath(parent), 'Asset destination');

  const existing = await lstat(destination).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
  if (existing?.isSymbolicLink()) throw new Error(`Asset destination must not be a symbolic link: ${destination}`);
  if (existing) assertInside(realPublicRoot, await realpath(destination), 'Asset destination');
  return destination;
};
