#!/usr/bin/env node
// Validates the SHIP ANYTHING source tree (agents, skills, workflows, registry, links, secrets).
// Usage: node scripts/validate/validate.mjs [--json] [--verbose] [--report <file.json>]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContent } from '../../packages/cli/src/lib/validate.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const r = validateContent(root);

const reportIdx = args.indexOf('--report');
if (reportIdx !== -1) {
  const out = path.resolve(root, args[reportIdx + 1] ?? 'reports/validation.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify({ at: new Date().toISOString(), ...r }, null, 2)}\n`);
}
if (args.includes('--json')) {
  console.log(JSON.stringify(r, null, 2));
} else {
  for (const e of r.errors) console.error(`✖ ${e.where}: ${e.msg}`);
  if (args.includes('--verbose') || !r.errors.length) for (const w of r.warnings) console.warn(`! ${w.where}: ${w.msg}`);
  const s = r.stats;
  console.log(`agents ${s.agents} · skills ${s.skills} · workflows ${s.workflows} · markdown ${s.markdownFiles} · internal links ${s.internalLinks} · secret-scanned files ${s.scannedFiles}`);
  console.log(r.errors.length ? `✖ ${r.errors.length} error(s), ${r.warnings.length} warning(s)` : `✔ valid (${r.warnings.length} warning(s))`);
}
process.exitCode = r.errors.length ? 1 : 0;
