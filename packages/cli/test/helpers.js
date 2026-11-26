import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const BIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../bin/ship-anything.js');
export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

export function tmpProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ship-anything-test-'));
}

export function cli(args, cwd, env = {}) {
  const r = spawnSync(process.execPath, [BIN, ...args], {
    cwd, encoding: 'utf8',
    // Isolate from the developer's PATH so agent detection is deterministic.
    env: { ...process.env, NO_COLOR: '1', PATH: path.dirname(process.execPath), ...env },
  });
  return { code: r.status, out: r.stdout + r.stderr };
}

export const read = (dir, p) => fs.readFileSync(path.join(dir, p), 'utf8');
export const exists = (dir, p) => fs.existsSync(path.join(dir, p));
