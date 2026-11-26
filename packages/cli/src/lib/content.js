import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { parseFrontmatter } from './frontmatter.js';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Locate the SHIP ANYTHING content root.
 * - Published package: <pkg>/content (created by scripts/bundle-content.mjs at prepack time).
 * - Local development: walk up from the package to the repository root.
 * - Override: SHIP_ANYTHING_CONTENT env var.
 */
export function findContentRoot() {
  const candidates = [];
  if (process.env.SHIP_ANYTHING_CONTENT) candidates.push(path.resolve(process.env.SHIP_ANYTHING_CONTENT));
  candidates.push(path.resolve(here, '../../content'));
  let dir = path.resolve(here, '..');
  for (let i = 0; i < 6; i++) {
    candidates.push(dir);
    dir = path.dirname(dir);
  }
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'agents', 'orchestrator.md')) && fs.existsSync(path.join(c, 'skills'))) return c;
  }
  throw new Error('SHIP ANYTHING content not found (expected agents/ and skills/). Set SHIP_ANYTHING_CONTENT to the repository root.');
}

function readMd(file) {
  const text = fs.readFileSync(file, 'utf8');
  return { file, text, ...parseFrontmatter(text) };
}

export function listAgents(root) {
  const dir = path.join(root, 'agents');
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => ({ id: f.slice(0, -3), ...readMd(path.join(dir, f)) }));
}

export function listSkills(root) {
  const dir = path.join(root, 'skills');
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .map((name) => {
      const skillDir = path.join(dir, name);
      const file = path.join(skillDir, 'SKILL.md');
      if (!fs.existsSync(file)) return { id: name, dir: skillDir, file, text: '', data: null, body: '', error: 'SKILL.md missing' };
      return { id: name, dir: skillDir, ...readMd(file) };
    });
}

export function listWorkflows(root) {
  const dir = path.join(root, 'workflows');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .sort()
    .map((f) => ({ id: f.slice(0, -3), ...readMd(path.join(dir, f)) }));
}

export function readYaml(file) {
  return YAML.parse(fs.readFileSync(file, 'utf8'));
}

/** Recursively list files under dir (relative paths, posix separators). */
export function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, base));
    else if (e.isFile()) out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out.sort();
}
