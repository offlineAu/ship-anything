import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { listAgents, listSkills, listWorkflows, walk } from './content.js';
import { h2Headings } from './frontmatter.js';

export const AGENT_HEADINGS = [
  'Role', 'Mission', 'Scope', 'Responsibilities', 'Exclusions', 'Required skills', 'Optional skills',
  'Required tools', 'Input contract', 'Output contract', 'Operating procedure', 'Decision authority',
  'Delegation rules', 'Collaboration', 'File ownership', 'Integration requirements', 'Quality standards',
  'Security requirements', 'Error handling', 'Escalation', 'Completion criteria',
];
export const SKILL_HEADINGS = [
  'Purpose', 'When to use', 'Inputs', 'Procedure', 'Decision rules', 'Tools', 'Quality standards',
  'Common failures', 'Outputs', 'Done when',
];
export const WORKFLOW_HEADINGS = [
  'Purpose', 'When to use', 'Inputs', 'Agents', 'Skills and tools', 'Task graph', 'Parallel opportunities',
  'Sequential requirements', 'Acceptance criteria', 'Quality gates', 'Deliverables', 'Completion conditions',
  'Failure recovery',
];
export const REQUIRED_AGENTS = [
  'orchestrator', 'product-director', 'research-agent', 'architecture-agent', 'ux-agent', 'frontend-agent',
  'backend-agent', 'mobile-agent', 'desktop-agent', 'database-agent', 'integration-agent', 'threejs-agent',
  'blender-agent', 'motion-agent', 'video-agent', 'infrastructure-agent', 'monitoring-agent', 'security-agent',
  'performance-agent', 'qa-agent', 'release-agent', 'documentation-agent',
];
export const REQUIRED_WORKFLOWS = [
  'build-anything', 'product-discovery', 'website', 'web-app', 'mobile-app', 'desktop-app', 'fullstack-platform',
  '3d-product', 'video-production', 'clone-existing-product', 'reverse-engineer', 'improve-existing-project',
  'legacy-modernization', 'security-remediation', 'production-release',
];
export const CATEGORIES = ['product-intelligence', 'software-engineering', 'design', 'creative-production', 'quality', 'delivery', 'efficiency'];
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// High-signal secret patterns. Placeholders like sk_live_xxx / <...> are ignored.
const SECRET_PATTERNS = [
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ['Stripe live key', /\b(sk|rk)_live_[A-Za-z0-9]{20,}\b/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
  ['Private key block', /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/],
  ['Anthropic/OpenAI key', /\bsk-(ant-)?[A-Za-z0-9_-]{32,}\b/],
];

function orderedSubset(expected, actual) {
  const missing = expected.filter((h) => !actual.includes(h));
  const idx = expected.filter((h) => actual.includes(h)).map((h) => actual.indexOf(h));
  const ordered = idx.every((v, i) => i === 0 || v > idx[i - 1]);
  return { missing, ordered };
}

/**
 * Validate a SHIP ANYTHING content root. Returns { errors, warnings, stats }.
 * Pure function of the filesystem; used by `ship-anything validate` and scripts/validate.
 */
export function validateContent(root) {
  const errors = []; const warnings = [];
  const err = (where, msg) => errors.push({ where, msg });
  const warn = (where, msg) => warnings.push({ where, msg });
  const rel = (p) => path.relative(root, p).split(path.sep).join('/');

  const agents = listAgents(root);
  const skills = listSkills(root);
  const workflows = listWorkflows(root);
  const agentIds = new Set(agents.map((a) => a.id));
  const skillIds = new Set(skills.map((s) => s.id));
  const workflowIds = new Set(workflows.map((w) => w.id));
  const skillUsers = new Map([...skillIds].map((s) => [s, []]));

  // Agents
  for (const id of REQUIRED_AGENTS) if (!agentIds.has(id)) err('agents/', `required agent missing: ${id}`);
  for (const a of agents) {
    const where = rel(a.file);
    if (a.error) { err(where, a.error); continue; }
    const d = a.data;
    if (d.name !== a.id) err(where, `frontmatter name "${d.name}" must equal filename "${a.id}"`);
    if (typeof d.description !== 'string' || !d.description.trim()) err(where, 'description is required');
    else if (d.description.length > 400) warn(where, `description is ${d.description.length} chars (> 400)`);
    if (!d.role) err(where, 'role is required');
    for (const key of ['required_skills', 'optional_skills']) {
      if (!Array.isArray(d[key])) { err(where, `${key} must be a list`); continue; }
      for (const s of d[key]) {
        if (!skillIds.has(s)) err(where, `${key} references unknown skill "${s}"`);
        else skillUsers.get(s).push(a.id);
      }
    }
    if (!Array.isArray(d.capabilities)) err(where, 'capabilities must be a list');
    const { missing, ordered } = orderedSubset(AGENT_HEADINGS, h2Headings(a.body));
    if (missing.length) err(where, `missing sections: ${missing.join(', ')}`);
    else if (!ordered) err(where, 'sections are out of order');
    const lines = a.text.split('\n').length;
    if (lines < 60) warn(where, `only ${lines} lines — likely too thin`);
  }

  // Skills
  for (const s of skills) {
    const where = rel(s.file);
    if (s.error) { err(where, s.error); continue; }
    const d = s.data;
    if (d.name !== s.id) err(where, `name "${d.name}" must equal directory "${s.id}"`);
    if (!NAME_RE.test(String(d.name)) || String(d.name).length > 64) err(where, 'name must be lowercase [a-z0-9-], ≤ 64 chars');
    if (typeof d.description !== 'string' || d.description.trim().length < 40) err(where, 'description missing or too short (< 40 chars)');
    else if (d.description.length > 1024) err(where, `description is ${d.description.length} chars (> 1024)`);
    const m = d.metadata ?? {};
    if (!CATEGORIES.includes(m.category)) err(where, `metadata.category must be one of ${CATEGORIES.join('|')}`);
    if (!m.version) err(where, 'metadata.version is required');
    for (const ag of m.agents ?? []) if (!agentIds.has(ag)) err(where, `metadata.agents references unknown agent "${ag}"`);
    const { missing, ordered } = orderedSubset(SKILL_HEADINGS, h2Headings(s.body));
    if (missing.length) err(where, `missing sections: ${missing.join(', ')}`);
    else if (!ordered) err(where, 'sections are out of order');
    const lines = s.text.split('\n').length;
    if (lines < 50) warn(where, `only ${lines} lines — possible placeholder`);
    if (/\b(TODO|TBD|lorem ipsum)\b/i.test(s.body)) warn(where, 'contains TODO/TBD/lorem ipsum');
    for (const f of walk(s.dir)) {
      const m2 = /references\/[\w.-]+\.md|scripts\/[\w.-]+/.exec(f);
      if (m2 && !s.text.includes(f)) warn(where, `bundled file ${f} is not referenced from SKILL.md`);
    }
    for (const ref of s.text.matchAll(/\b(references|scripts)\/[\w.-]+\.\w+/g)) {
      if (!fs.existsSync(path.join(s.dir, ref[0]))) err(where, `references missing bundled file ${ref[0]}`);
    }
  }
  for (const [s, users] of skillUsers) if (!users.length) warn(`skills/${s}`, 'not referenced by any agent');

  // Workflows
  for (const id of REQUIRED_WORKFLOWS) if (!workflowIds.has(id)) err('workflows/', `required workflow missing: ${id}`);
  for (const w of workflows) {
    const where = rel(w.file);
    if (w.error) { err(where, w.error); continue; }
    const d = w.data;
    if (d.name !== w.id) err(where, `name "${d.name}" must equal filename "${w.id}"`);
    if (!d.description) err(where, 'description is required');
    if (!Array.isArray(d.level) || !d.level.every((l) => /^L[1-4]$/.test(l))) err(where, 'level must be a list of L1..L4');
    for (const k of ['required_agents', 'optional_agents']) for (const ag of d[k] ?? []) if (!agentIds.has(ag)) err(where, `${k} references unknown agent "${ag}"`);
    for (const sk of d.required_skills ?? []) if (!skillIds.has(sk)) err(where, `required_skills references unknown skill "${sk}"`);
    for (const c of d.composes ?? []) if (!workflowIds.has(c)) err(where, `composes unknown workflow "${c}"`);
    if (!Array.isArray(d.required_agents) || !d.required_agents.length) err(where, 'required_agents must be a non-empty list');
    const { missing, ordered } = orderedSubset(WORKFLOW_HEADINGS, h2Headings(w.body));
    if (missing.length) err(where, `missing sections: ${missing.join(', ')}`);
    else if (!ordered) err(where, 'sections are out of order');
  }

  // Registry + config
  const regPath = path.join(root, '.ship-anything', 'registry.yaml');
  let registry = null;
  try { registry = YAML.parse(fs.readFileSync(regPath, 'utf8')); } catch (e) { err('.ship-anything/registry.yaml', `unreadable: ${e.message.split('\n')[0]}`); }
  if (registry) {
    const internal = registry.skills?.internal ?? {};
    for (const s of skillIds) if (!internal[s]) err('.ship-anything/registry.yaml', `internal skill "${s}" not registered`);
    for (const [name, e] of Object.entries(internal)) {
      if (!skillIds.has(name)) err('.ship-anything/registry.yaml', `registered internal skill "${name}" has no skills/${name}/SKILL.md`);
      for (const ag of e.agents ?? []) if (!agentIds.has(ag)) err('.ship-anything/registry.yaml', `skill ${name}: unknown agent "${ag}"`);
      for (const wf of e.workflows ?? []) if (!workflowIds.has(wf)) err('.ship-anything/registry.yaml', `skill ${name}: unknown workflow "${wf}"`);
    }
    for (const [name, e] of Object.entries(registry.skills?.external ?? {})) {
      const w = `.ship-anything/registry.yaml#external.${name}`;
      if (!e.source) err(w, 'source is required');
      if (!e.license) err(w, 'license is required');
      if (!e.classification) err(w, 'classification is required');
      if (e.enabled && e.security?.status !== 'approved' && e.security?.status !== 'approved-instructions-only') err(w, 'enabled external skill must have security.status approved');
      if (e.enabled && !e.pin) err(w, 'enabled external skill must be pinned (pin: <sha|tag>)');
    }
  }
  try { YAML.parse(fs.readFileSync(path.join(root, '.ship-anything', 'config.yaml'), 'utf8')); } catch (e) { err('.ship-anything/config.yaml', `invalid: ${e.message.split('\n')[0]}`); }

  // Internal links in Markdown (relative paths only)
  const mdFiles = walk(root).filter((f) => f.endsWith('.md') && !/(^|\/)(node_modules|content|\.git)\//.test(f) && !f.startsWith('packages/cli/content/'));
  let linkCount = 0;
  for (const f of mdFiles) {
    const text = fs.readFileSync(path.join(root, f), 'utf8').replace(/```[\s\S]*?```/g, '');
    for (const m of text.matchAll(/\]\(([^)\s#]+)(#[^)]*)?\)/g)) {
      const target = m[1];
      if (/^(https?:|mailto:|data:)/.test(target)) continue;
      linkCount++;
      const abs = path.resolve(root, path.dirname(f), decodeURI(target));
      if (!fs.existsSync(abs)) err(f, `broken link → ${target}`);
    }
  }

  // Secrets scan (text files, excluding node_modules)
  const scan = walk(root).filter((f) => !/(^|\/)(node_modules|\.git|backups)\//.test(f) && /\.(md|ya?ml|json|js|mjs|ts|toml|txt|sh|env\w*)$/.test(f));
  for (const f of scan) {
    const text = fs.readFileSync(path.join(root, f), 'utf8');
    for (const [label, re] of SECRET_PATTERNS) if (re.test(text)) err(f, `possible secret: ${label}`);
  }

  return {
    errors, warnings,
    stats: { agents: agents.length, skills: skills.length, workflows: workflows.length, markdownFiles: mdFiles.length, internalLinks: linkCount, scannedFiles: scan.length },
  };
}
