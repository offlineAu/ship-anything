#!/usr/bin/env node
// Regenerates skills.internal in .ship-anything/registry.yaml from skills/*/SKILL.md and
// workflows/*.md. Preserves comments and the hand-curated skills.external section.
// Usage: node scripts/generate/registry.mjs [--check]   (--check exits 1 if the file is stale)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { listSkills, listWorkflows } from '../../packages/cli/src/lib/content.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const regPath = path.join(root, '.ship-anything/registry.yaml');
const original = fs.readFileSync(regPath, 'utf8');
const doc = YAML.parseDocument(original);

const workflows = listWorkflows(root).filter((w) => w.data);
const internal = {};
for (const s of listSkills(root)) {
  if (!s.data) continue;
  const m = s.data.metadata ?? {};
  const files = fs.readdirSync(s.dir, { recursive: true }).map(String);
  internal[s.id] = {
    category: m.category ?? null,
    version: m.version ?? null,
    agents: m.agents ?? [],
    workflows: workflows.filter((w) => (w.data.required_skills ?? []).includes(s.id)).map((w) => w.id),
    path: `skills/${s.id}/SKILL.md`,
    license: s.data.license ?? 'MIT',
    has_scripts: files.some((f) => f.startsWith('scripts')),
    has_references: files.some((f) => f.startsWith('references')),
    compatibility: [ 'claude', 'codex', 'opencode', 'cursor', 'gemini', 'generic' ],
    security: { status: 'approved', notes: 'internal, reviewed in-repo' },
    maintenance: 'active',
    enabled: true,
  };
}
doc.setIn(['skills', 'internal'], doc.createNode(internal));
const next = doc.toString({ lineWidth: 0 });
if (process.argv.includes('--check')) {
  if (next !== original) { console.error('registry.yaml is stale — run: node scripts/generate/registry.mjs'); process.exit(1); }
  console.log('registry.yaml is up to date');
} else {
  fs.writeFileSync(regPath, next);
  console.log(`registry.yaml: ${Object.keys(internal).length} internal skills written`);
}
