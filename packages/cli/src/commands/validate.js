import fs from 'node:fs';
import path from 'node:path';
import { findContentRoot } from '../lib/content.js';
import { validateContent } from '../lib/validate.js';
import { loadManifest, sha256 } from '../lib/installer.js';
import { ui } from '../lib/ui.js';
import YAML from 'yaml';

/**
 * Two modes:
 *  - inside a SHIP ANYTHING source repo (agents/ + skills/ present): validate content.
 *  - inside a project where `init` ran: verify installed files against the manifest.
 */
export async function run(args, opts) {
  const target = path.resolve(opts.cwd ?? process.cwd());
  const isSource = fs.existsSync(path.join(target, 'agents', 'orchestrator.md')) && fs.existsSync(path.join(target, 'skills'));
  if (isSource || opts.content) {
    const root = isSource ? target : findContentRoot();
    const r = validateContent(root);
    return report(r, opts);
  }
  const manifest = loadManifest(target);
  const entries = Object.entries(manifest.files);
  if (!entries.length) { ui.warn('No SHIP ANYTHING installation found here. Run `ship-anything init` first.'); return 1; }
  let missing = 0; let modified = 0;
  for (const [p, rec] of entries) {
    const abs = path.join(target, p);
    if (!fs.existsSync(abs)) { missing++; ui.error(`missing: ${p}`); continue; }
    if (rec.kind === 'file' && sha256(fs.readFileSync(abs, 'utf8')) !== rec.sha256) { modified++; if (opts.verbose) ui.warn(`modified locally: ${p}`); }
  }
  ui.info(`${entries.length} managed files · ${missing} missing · ${modified} modified locally (allowed; init will not overwrite them)`);
  // Also validate the installed content (config/registry YAML) for syntax.
  const r = validateInstalled(target);
  return report(r, opts) || (missing ? 1 : 0);
}

function validateInstalled(target) {
  const errors = []; const warnings = [];
  for (const f of ['.ship-anything/config.yaml', '.ship-anything/registry.yaml']) {
    try { YAML.parse(fs.readFileSync(path.join(target, f), 'utf8')); } catch (e) { errors.push({ where: f, msg: e.message.split('\n')[0] }); }
  }
  return { errors, warnings, stats: {} };
}

function report(r, opts) {
  if (opts.json) { console.log(JSON.stringify(r, null, 2)); return r.errors.length ? 1 : 0; }
  for (const e of r.errors) ui.error(`${e.where}: ${e.msg}`);
  if (opts.verbose || r.errors.length === 0) for (const w of r.warnings) ui.warn(`${w.where}: ${w.msg}`);
  const s = r.stats;
  if (s.agents !== undefined) ui.info(`agents ${s.agents} · skills ${s.skills} · workflows ${s.workflows} · markdown ${s.markdownFiles} · links ${s.internalLinks} · secret-scanned ${s.scannedFiles}`);
  if (r.errors.length) { ui.error(`${r.errors.length} error(s), ${r.warnings.length} warning(s)`); return 1; }
  ui.ok(`valid (${r.warnings.length} warning(s))`);
  return 0;
}

export const help = `ship-anything validate [--json] [--verbose] [--content] [--cwd <dir>]

In a SHIP ANYTHING source checkout: validates agents, skills, workflows, registry, links and
scans for secrets. In a project: checks installed files against the install manifest.
--content forces validation of the bundled content.`;
