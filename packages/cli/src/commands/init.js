import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { ADAPTERS, AGENT_IDS, resolveAgents } from '../lib/adapters.js';
import { findContentRoot, listAgents, listSkills, walk } from '../lib/content.js';
import { plan, apply } from '../lib/installer.js';
import { detectAgents } from '../lib/detect.js';
import { confirm, ui } from '../lib/ui.js';

const SA = '.ship-anything';

export function buildOps(root, target, agentIds) {
  const ops = [];
  const add = (p, content, extra = {}) => ops.push({ path: p, content, kind: 'file', ...extra });
  const copyTree = (srcDir, destDir, filter = () => true) => {
    for (const rel of walk(srcDir).filter(filter)) add(path.posix.join(destDir, rel), fs.readFileSync(path.join(srcDir, rel), 'utf8'));
  };

  // 1. Core: config, registry, policies, templates, workflows, adapter docs, canonical agents.
  const config = fs.readFileSync(path.join(root, SA, 'config.yaml'), 'utf8')
    .replace(/^(\s*installed_agents:).*$/m, `$1 [${agentIds.join(', ')}]`);
  add(`${SA}/config.yaml`, config);
  add(`${SA}/registry.yaml`, fs.readFileSync(path.join(root, SA, 'registry.yaml'), 'utf8'));
  copyTree(path.join(root, SA, 'policies'), `${SA}/policies`);
  copyTree(path.join(root, SA, 'templates'), `${SA}/templates`, (f) => f !== 'project-instructions.md');
  copyTree(path.join(root, 'workflows'), `${SA}/workflows`);
  for (const id of new Set([...agentIds, 'generic'])) {
    const doc = path.join(root, SA, 'adapters', `${adapterDoc(id)}.md`);
    if (fs.existsSync(doc)) add(`${SA}/adapters/${adapterDoc(id)}.md`, fs.readFileSync(doc, 'utf8'));
  }
  const agents = listAgents(root).filter((a) => a.data);
  for (const a of agents) add(`${SA}/agents/${a.id}.md`, a.text);
  add(`${SA}/state/README.md`, STATE_README);

  // 2. Skills: copy each skill folder once per distinct skills directory.
  const disabled = readDisabled(target);
  const skills = listSkills(root).filter((s) => s.data && !disabled.has(s.id));
  const skillDirs = [...new Set([...agentIds.map((id) => ADAPTERS[id].skillsDir), '.agents/skills'])];
  for (const dir of skillDirs) {
    for (const s of skills) copyTree(s.dir, path.posix.join(dir, s.id));
  }

  // 3. Native agent definitions.
  for (const id of agentIds) {
    const spec = ADAPTERS[id].agents;
    if (!spec) continue;
    // Cursor also loads .claude/agents/ — avoid duplicate subagents when both are installed.
    if (id === 'cursor' && agentIds.includes('claude')) continue;
    for (const a of agents) add(path.posix.join(spec.dir, `${a.id}${spec.ext}`), spec.render(a));
  }

  // 4. Root instruction files as managed blocks (never clobbers user content).
  const ctx = {
    skillsDirFor: (id) => ADAPTERS[id].skillsDir,
    shim: (label, skillsDir, delegation) => [
      `## SHIP ANYTHING (${label})`,
      '',
      `Follow the SHIP ANYTHING instructions in AGENTS.md. Skills for ${label} live in \`${skillsDir}/<name>/SKILL.md\`.`,
      delegation,
    ].join('\n'),
  };
  const template = fs.readFileSync(path.join(root, SA, 'templates', 'project-instructions.md'), 'utf8');
  const dirList = skillDirs.map((d) => `\`${d}/\``).join(', ');
  ops.push({ path: 'AGENTS.md', kind: 'block', blockId: 'core', content: template.replaceAll('{{SKILLS_DIRS}}', dirList).replaceAll('{{AGENTS}}', agentIds.join(', ')) });
  for (const id of agentIds) {
    const instr = ADAPTERS[id].instructions;
    if (instr) ops.push({ path: instr.path, kind: 'block', blockId: 'core', content: instr.render(ctx) });
  }
  ops.push({ path: '.gitignore', kind: 'block', blockId: 'local-state', content: GITIGNORE });
  return ops;
}

function readDisabled(target) {
  try { return new Set(YAML.parse(fs.readFileSync(path.join(target, SA, 'registry.yaml'), 'utf8'))?.disabled ?? []); }
  catch { return new Set(); }
}

const adapterDoc = (id) => ({ claude: 'claude-code', gemini: 'gemini-cli' }[id] ?? id);

const GITIGNORE = [
  '# SHIP ANYTHING local state (never commit secrets or session data)',
  '.ship-anything/cache/',
  '.ship-anything/logs/',
  '.ship-anything/backups/',
  '.ship-anything/state/sessions/',
  '.env',
  '.env.*',
  '!.env.example',
].join('\n');

const STATE_README = `# .ship-anything/state

Persistent, structured project state for SHIP ANYTHING agents. Safe to commit except
\`sessions/\` (gitignored). Never store secrets here.

- \`plan.yaml\` — task ownership registry for the active request (template: ../templates/plan.yaml)
- \`decisions.md\` — assumptions and decisions log
- \`repo-map.md\` — cached repository map
- \`tasks/<id>.md\` — agent reports with evidence
- \`sessions/\` — continuation summaries (local only)
- \`install-manifest.json\` — written by the ship-anything CLI; enables safe updates and rollback
`;

export async function run(args, opts) {
  const target = path.resolve(opts.cwd ?? process.cwd());
  const root = findContentRoot();
  let agentIds = resolveAgents(opts.agent);
  if (!agentIds) {
    const detected = detectAgents(target);
    agentIds = detected.length ? detected : ['generic'];
    ui.info(`No --agent given; ${detected.length ? `detected: ${detected.join(', ')}` : 'no agents detected, using generic (AGENTS.md + .agents/skills)'}`);
  }
  const ops = buildOps(root, target, agentIds);
  const result = plan(target, ops, { force: !!opts.force });
  const counts = summarize(result.actions);

  ui.heading(`ship-anything init → ${target}`);
  ui.info(`agents: ${agentIds.map((i) => ADAPTERS[i].label).join(', ')}`);
  printPlan(result.actions, opts.verbose);
  ui.info(`create ${counts.create} · update ${counts.update} · append ${counts.append} · unchanged ${counts.unchanged} · conflicts ${counts.conflict}`);

  if (opts['dry-run']) { ui.info('Dry run — nothing written.'); return counts.conflict ? 2 : 0; }
  const pending = counts.create + counts.update + counts.append;
  if (!pending) { ui.ok('Already up to date.'); return counts.conflict ? 2 : 0; }
  if (!opts.yes) {
    const ok = await confirm('Apply these changes?');
    if (!ok) { ui.warn('Aborted. Re-run with --yes to apply non-interactively, or --dry-run to preview.'); return 1; }
  }
  const tx = apply(target, result, { command: 'init', agents: agentIds, manifest: { agents: agentIds } });
  ui.ok(`Applied transaction ${tx.id}: ${tx.created.length} created, ${tx.updated.length} updated.`);
  if (counts.conflict) ui.warn(`${counts.conflict} file(s) skipped to protect local changes. Review them or re-run with --force (backups are kept).`);
  ui.info('Undo with: ship-anything rollback');
  return counts.conflict ? 2 : 0;
}

export function summarize(actions) {
  const c = { create: 0, update: 0, append: 0, unchanged: 0, conflict: 0 };
  for (const a of actions) c[a.action]++;
  return c;
}

function printPlan(actions, verbose) {
  const groups = new Map();
  for (const a of actions) {
    if (a.action === 'unchanged' && !verbose) continue;
    const top = a.path.split('/').slice(0, a.path.startsWith('.') ? 2 : 1).join('/');
    const key = `${a.action}:${top}`;
    if (!groups.has(key)) groups.set(key, { action: a.action, top, n: 0, reasons: new Set() });
    const g = groups.get(key); g.n++; if (a.reason) g.reasons.add(`${a.path}: ${a.reason}`);
  }
  for (const g of groups.values()) {
    ui.line(`  ${g.action.padEnd(9)} ${g.top}${g.n > 1 ? ` (${g.n} files)` : ''}`);
    for (const r of g.reasons) ui.line(`            ↳ ${r}`);
  }
}

export const help = `ship-anything init [--agent claude|codex|opencode|cursor|gemini|generic|all[,..]] [--dry-run] [--yes] [--force] [--verbose] [--cwd <dir>]

Installs SHIP ANYTHING into the current project. Idempotent: unchanged files are skipped,
files you modified are never overwritten (unless --force, which keeps a backup), and root
instruction files get a marked block instead of being replaced. Undo with \`ship-anything rollback\`.
Agents: ${AGENT_IDS.join(', ')}`;
