import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import YAML from 'yaml';
import { ADAPTERS } from '../lib/adapters.js';
import { findContentRoot, listSkills, walk } from '../lib/content.js';
import { loadManifest, writeManifest, sha256 } from '../lib/installer.js';
import { reviewSkill, formatReview } from '../lib/review.js';
import { which } from '../lib/detect.js';
import { ui } from '../lib/ui.js';

const QUARANTINE = '.ship-anything/quarantine';
const REGISTRY = '.ship-anything/registry.yaml';

export async function run(args, opts) {
  const [sub, ...rest] = args;
  const target = path.resolve(opts.cwd ?? process.cwd());
  switch (sub) {
    case 'list': case 'ls': return list(target, opts);
    case 'add': return add(target, rest[0], opts);
    case 'approve': return approve(target, rest[0], opts);
    case 'remove': case 'rm': return remove(target, rest[0], opts);
    default: console.log(help); return sub ? 1 : 0;
  }
}

function loadRegistryDoc(target) {
  const p = path.join(target, REGISTRY);
  const src = fs.existsSync(p) ? p : path.join(findContentRoot(), REGISTRY);
  return { doc: YAML.parseDocument(fs.readFileSync(src, 'utf8')), path: p, installed: src === p };
}

function list(target, opts) {
  const { doc, installed } = loadRegistryDoc(target);
  const reg = doc.toJS();
  const disabled = new Set(reg.disabled ?? []);
  const rows = [];
  for (const [name, e] of Object.entries(reg.skills?.internal ?? {})) {
    if (opts.category && e.category !== opts.category) continue;
    rows.push({ name, source: 'internal', category: e.category, status: disabled.has(name) ? 'disabled' : 'enabled' });
  }
  for (const [name, e] of Object.entries(reg.skills?.external ?? {})) {
    if (opts.category && e.category !== opts.category) continue;
    rows.push({ name, source: e.source, category: e.category ?? '-', status: `${e.enabled ? 'enabled' : 'disabled'} · ${e.classification} · ${e.security?.status ?? 'needs-review'}` });
  }
  if (opts.json) { console.log(JSON.stringify(rows, null, 2)); return 0; }
  ui.heading(`skills (${installed ? 'this project' : 'bundled registry'}) — ${rows.length}`);
  for (const r of rows) ui.line(`  ${r.name.padEnd(34)} ${String(r.category).padEnd(22)} ${r.source === 'internal' ? r.status : `${r.status}  ← ${r.source}`}`);
  return 0;
}

/** Fetch a skill source into quarantine (never executes it), then print a static review. */
async function add(target, source, opts) {
  if (!source) { ui.error('usage: ship-anything skills add <path|owner/repo[@ref]|git-url> [--skill <name>]'); return 1; }
  if (!loadManifest(target).agents) { ui.error('Run `ship-anything init` in this project first.'); return 1; }
  let srcRoot; let pin; let origin = source;
  const local = path.resolve(target, source);
  if (fs.existsSync(local)) {
    srcRoot = local;
    pin = `sha256:${sha256(walk(local).map((f) => `${f}:${sha256(fs.readFileSync(path.join(local, f)))}`).join('\n'))}`;
  } else {
    const m = /^([\w.-]+\/[\w.-]+)(?:@([\w./-]+))?$/.exec(source);
    const url = m ? `https://github.com/${m[1]}.git` : source;
    if (!/^(https:\/\/|git@)/.test(url)) { ui.error(`Not a local path, owner/repo or git URL: ${source}`); return 1; }
    if (!which('git')) { ui.error('git is required to fetch remote skills'); return 1; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ship-anything-src-'));
    const cloneArgs = ['clone', '--depth', '1', '--no-tags', ...(m?.[2] ? ['--branch', m[2]] : []), '--', url, tmp];
    ui.info(`git ${cloneArgs.slice(0, -1).join(' ')} <tmp>`);
    // Hooks never run on clone of an untrusted repo: core.hooksPath=/dev/null, no submodules, no LFS smudge.
    const r = spawnSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'filter.lfs.smudge=', '-c', 'filter.lfs.process=', ...cloneArgs], { encoding: 'utf8', env: { ...process.env, GIT_LFS_SKIP_SMUDGE: '1', GIT_TERMINAL_PROMPT: '0' } });
    if (r.status !== 0) { ui.error(`git clone failed: ${(r.stderr || '').trim().split('\n').pop()}`); return 1; }
    const sha = spawnSync('git', ['-C', tmp, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
    srcRoot = tmp; pin = sha; origin = m ? m[1] : url;
  }
  const candidates = findSkillDirs(srcRoot).filter((d) => !opts.skill || path.basename(d) === opts.skill);
  if (!candidates.length) { ui.error('No SKILL.md found in source' + (opts.skill ? ` matching --skill ${opts.skill}` : '')); return 1; }
  const { doc, path: regPath } = loadRegistryDoc(target);
  for (const dir of candidates) {
    const review = reviewSkill(dir);
    const name = review.name ?? path.basename(dir);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) { ui.error(`skipping ${dir}: invalid skill name "${name}"`); continue; }
    if (doc.hasIn(['skills', 'internal', name])) { ui.error(`skipping ${name}: name collides with an internal skill`); continue; }
    const q = path.join(target, QUARANTINE, name);
    fs.rmSync(q, { recursive: true, force: true });
    fs.cpSync(dir, q, { recursive: true, filter: (s) => !s.split(path.sep).includes('.git') });
    doc.setIn(['skills', 'external', name], doc.createNode({
      source: origin, path: path.relative(srcRoot, dir).split(path.sep).join('/') || '.', pin,
      license: review.license ?? 'UNKNOWN', classification: 'OPTIONAL', enabled: false,
      security: { status: 'needs-review', executables: review.executables, static_findings: [...new Set(review.findings.map((f) => f.rule))], reviewed_at: null },
    }));
    ui.heading(`\n${name} → quarantined at ${QUARANTINE}/${name}`);
    ui.line(formatReview(review));
  }
  fs.writeFileSync(regPath, doc.toString());
  ui.warn('\nNothing was enabled. Read every file in quarantine, complete .ship-anything/policies/external-skills.md,');
  ui.warn('then run: ship-anything skills approve <name>');
  return 0;
}

function findSkillDirs(root) {
  return walk(root).filter((f) => f.endsWith('SKILL.md') && !f.includes('node_modules/') && f.split('/').length <= 5)
    .map((f) => path.join(root, path.dirname(f)));
}

/** Copy a reviewed skill from quarantine into every installed agent skills directory. */
function approve(target, name, opts) {
  if (!name) { ui.error('usage: ship-anything skills approve <name>'); return 1; }
  const q = path.join(target, QUARANTINE, name);
  if (!fs.existsSync(q)) { ui.error(`${name} is not in quarantine. Add it first with \`skills add\`.`); return 1; }
  const { doc, path: regPath } = loadRegistryDoc(target);
  const entry = doc.toJS().skills?.external?.[name];
  if (!entry) { ui.error(`${name} has no registry entry`); return 1; }
  if (!entry.license || entry.license === 'UNKNOWN') { ui.error('License is UNKNOWN — set skills.external.<name>.license in registry.yaml after checking it.'); return 1; }
  const review = reviewSkill(q);
  if (review.executables.length && !opts['allow-scripts']) {
    ui.error(`${name} bundles executables (${review.executables.join(', ')}). Re-run with --allow-scripts after reviewing them, or keep it instructions-only by deleting them from quarantine.`);
    return 1;
  }
  const agents = loadManifest(target).agents ?? ['generic'];
  const dirs = [...new Set([...agents.map((a) => ADAPTERS[a]?.skillsDir).filter(Boolean), '.agents/skills'])];
  for (const d of dirs) {
    const dest = path.join(target, d, name);
    if (fs.existsSync(dest) && !opts.force) { ui.error(`${d}/${name} already exists (use --force to replace)`); return 1; }
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(q, dest, { recursive: true });
    ui.ok(`installed ${d}/${name}`);
  }
  doc.setIn(['skills', 'external', name, 'enabled'], true);
  doc.setIn(['skills', 'external', name, 'security', 'status'], review.executables.length ? 'approved' : 'approved-instructions-only');
  doc.setIn(['skills', 'external', name, 'security', 'reviewed_at'], new Date().toISOString().slice(0, 10));
  fs.writeFileSync(regPath, doc.toString());
  return 0;
}

function remove(target, name, opts) {
  if (!name) { ui.error('usage: ship-anything skills remove <name>'); return 1; }
  const { doc, path: regPath } = loadRegistryDoc(target);
  const isInternal = doc.hasIn(['skills', 'internal', name]);
  const isExternal = doc.hasIn(['skills', 'external', name]);
  if (!isInternal && !isExternal) { ui.error(`unknown skill: ${name}`); return 1; }
  const agents = loadManifest(target).agents ?? [];
  const dirs = [...new Set([...agents.map((a) => ADAPTERS[a]?.skillsDir).filter(Boolean), '.agents/skills'])];
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  for (const d of dirs) {
    const abs = path.join(target, d, name);
    if (!fs.existsSync(abs)) continue;
    const backup = path.join(target, '.ship-anything/backups', stamp, d, name);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.renameSync(abs, backup);
    ui.ok(`removed ${d}/${name} (backup: ${path.relative(target, backup)})`);
  }
  const manifest = loadManifest(target);
  for (const d of dirs) for (const k of Object.keys(manifest.files)) if (k.startsWith(`${d}/${name}/`)) delete manifest.files[k];
  writeManifest(target, manifest);
  if (isExternal) doc.setIn(['skills', 'external', name, 'enabled'], false);
  if (isInternal) {
    const disabled = new Set(doc.toJS().disabled ?? []); disabled.add(name);
    doc.set('disabled', [...disabled].sort());
    ui.info('Internal skill disabled; `ship-anything update` will not reinstall it.');
  }
  fs.writeFileSync(regPath, doc.toString());
  return 0;
}

export const help = `ship-anything skills <command>

  list [--category <c>] [--json]   List internal and external skills with status
  add <source> [--skill <name>]    Fetch a skill (local path, owner/repo[@ref], git URL) into
                                   quarantine and print a static security review. Never executes it.
  approve <name> [--allow-scripts] Install a reviewed skill into this project's skill directories
  remove <name>                    Remove from skill directories (backup kept) and disable

External skills are untrusted until reviewed — see .ship-anything/policies/external-skills.md.
For installing well-known public skills you can also use the Agent Skills CLI directly:
  npx skills add <owner/repo>   (vercel-labs/skills)`;
