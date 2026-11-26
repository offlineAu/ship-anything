#!/usr/bin/env node
// Copies canonical content from the repository root into packages/cli/content so the published
// package is self-contained. Runs at `npm pack` / `npm publish` time (prepack). Local dev doesn't need it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pkg = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(pkg, '../..');
const out = path.join(pkg, 'content');
const items = ['agents', 'skills', 'workflows', '.ship-anything/config.yaml', '.ship-anything/registry.yaml',
  '.ship-anything/policies', '.ship-anything/templates', '.ship-anything/adapters', 'LICENSE'];

fs.rmSync(out, { recursive: true, force: true });
for (const item of items) {
  const src = path.join(repo, item);
  if (!fs.existsSync(src)) throw new Error(`missing ${item}`);
  fs.cpSync(src, path.join(out, item), { recursive: true });
}
console.log(`bundled ${items.length} content roots into ${path.relative(repo, out)}`);
