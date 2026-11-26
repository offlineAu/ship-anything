import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ADAPTERS } from './adapters.js';

/** Locate an executable on PATH without running it. Cross-platform (PATHEXT on Windows). */
export function which(bin) {
  const exts = process.platform === 'win32' ? (process.env.PATHEXT ?? '.EXE;.CMD;.BAT').split(';') : [''];
  for (const dir of (process.env.PATH ?? '').split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      const p = path.join(dir, bin + ext);
      try { if (fs.statSync(p).isFile()) return p; } catch { /* not here */ }
    }
  }
  return null;
}

/** Run `<bin> --version` with a short timeout; returns first line or null. */
export function version(bin, args = ['--version']) {
  const p = which(bin);
  if (!p) return null;
  const r = spawnSync(p, args, { encoding: 'utf8', timeout: 5000, shell: process.platform === 'win32' });
  if (r.status !== 0) return null;
  return (r.stdout || r.stderr).trim().split('\n')[0] || null;
}

/** Agents present in the project (config dirs) or on PATH. Generic is never auto-detected. */
export function detectAgents(target) {
  const found = [];
  for (const [id, a] of Object.entries(ADAPTERS)) {
    if (id === 'generic') continue;
    const inProject = a.detect.some((d) => fs.existsSync(path.join(target, d)));
    const onPath = a.bin.some((b) => which(b));
    if (inProject || onPath) found.push(id);
  }
  return found;
}
