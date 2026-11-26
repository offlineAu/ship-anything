import fs from 'node:fs';
import path from 'node:path';
import { walk } from './content.js';
import { parseFrontmatter } from './frontmatter.js';

/**
 * Static review of an external skill folder. Reports facts for a human/agent reviewer;
 * it does not and cannot prove a skill is safe. See .ship-anything/policies/external-skills.md.
 */
const RULES = [
  ['network', /\b(curl|wget|fetch\(|axios|requests\.(get|post)|urllib|http\.request|https?:\/\/(?!github\.com\/[\w.-]+\/[\w.-]+\/?\)|example\.)[\w.-]+)/i],
  ['shell-exec', /\b(child_process|execSync|spawnSync|subprocess|os\.system|eval\(|exec\()/],
  ['pipe-to-shell', /(curl|wget)[^\n|]*\|\s*(ba|z)?sh\b/],
  ['secrets-access', /\b(process\.env|os\.environ|getenv)\b|(_TOKEN|_API_KEY|_SECRET)\b/],
  ['agent-config', /(settings\.json|hooks\.json|\.mcp\.json|mcp_servers|config\.toml|\.bashrc|\.zshrc|PostToolUse|PreToolUse|SessionStart)/],
  ['permission-bypass', /(dangerously|bypassPermissions|--yolo|skip-permissions|auto-?approve|ignore (all )?(previous|prior) instructions)/i],
  ['destructive', /\brm\s+-rf\b|DROP\s+TABLE|git\s+push\s+--force|mkfs\b/i],
];

export function reviewSkill(dir) {
  const files = walk(dir);
  const skillMd = path.join(dir, 'SKILL.md');
  const fm = fs.existsSync(skillMd) ? parseFrontmatter(fs.readFileSync(skillMd, 'utf8')) : { data: null, error: 'SKILL.md missing' };
  const executables = files.filter((f) => /^scripts\/|\.(sh|py|js|mjs|cjs|ts|ps1|bat|exe|bin)$/.test(f));
  const findings = [];
  for (const f of files) {
    const abs = path.join(dir, f);
    const stat = fs.statSync(abs);
    if (stat.size > 2_000_000) { findings.push({ file: f, rule: 'large-file', line: 0, text: `${stat.size} bytes` }); continue; }
    const buf = fs.readFileSync(abs);
    if (buf.includes(0)) { findings.push({ file: f, rule: 'binary', line: 0, text: 'binary file' }); continue; }
    buf.toString('utf8').split('\n').forEach((line, i) => {
      for (const [rule, re] of RULES) if (re.test(line)) findings.push({ file: f, rule, line: i + 1, text: line.trim().slice(0, 160) });
    });
  }
  return {
    name: fm.data?.name ?? null,
    description: fm.data?.description ?? null,
    license: fm.data?.license ?? (files.find((f) => /^LICEN[CS]E/i.test(f)) ? 'see LICENSE file' : null),
    frontmatterError: fm.error,
    files, executables, findings,
  };
}

export function formatReview(r) {
  const out = [];
  out.push(`name: ${r.name ?? '(missing)'}   license: ${r.license ?? 'UNKNOWN — must be resolved before approval'}`);
  if (r.frontmatterError) out.push(`frontmatter: ${r.frontmatterError}`);
  out.push(`files: ${r.files.length}   executables/scripts: ${r.executables.length ? r.executables.join(', ') : 'none'}`);
  const byRule = new Map();
  for (const f of r.findings) { if (!byRule.has(f.rule)) byRule.set(f.rule, []); byRule.get(f.rule).push(f); }
  if (!byRule.size) out.push('static findings: none (this is not proof of safety — read every file)');
  for (const [rule, list] of byRule) {
    out.push(`[${rule}] ${list.length} hit(s)`);
    for (const f of list.slice(0, 5)) out.push(`    ${f.file}:${f.line}  ${f.text}`);
    if (list.length > 5) out.push(`    … ${list.length - 5} more`);
  }
  return out.join('\n');
}
