#!/usr/bin/env node
// Static context-budget benchmark for progressive disclosure.
// Measures (in bytes and ESTIMATED tokens, bytes/4 heuristic — not a tokenizer) how much
// SHIP ANYTHING text an agent must load:
//   baseline  = naive approach: every agent definition + every SKILL.md + every workflow in context
//   startup   = what is always loaded: AGENTS.md block + skill name/description metadata
//   per-task  = startup + orchestrator + 1 agent + its required skills + 1 workflow (typical L2 task)
// This measures instruction volume only. It does NOT measure model token usage, tool output,
// or cost; those require host-reported usage (see skills/token-optimization/SKILL.md).
// Usage: node scripts/benchmark/context-budget.mjs [--json] [--agent frontend-agent] [--workflow web-app]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listAgents, listSkills, listWorkflows } from '../../packages/cli/src/lib/content.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const agentName = opt('--agent', 'frontend-agent');
const workflowName = opt('--workflow', 'web-app');

const bytes = (s) => Buffer.byteLength(s, 'utf8');
const est = (b) => Math.round(b / 4);

const agents = listAgents(root).filter((a) => a.data);
const skills = listSkills(root).filter((s) => s.data);
const workflows = listWorkflows(root).filter((w) => w.data);
const block = fs.readFileSync(path.join(root, '.ship-anything/templates/project-instructions.md'), 'utf8');
const meta = skills.map((s) => `${s.data.name}: ${s.data.description}`).join('\n');

const baseline = [...agents, ...skills, ...workflows].reduce((n, x) => n + bytes(x.text), 0) + bytes(block);
const startup = bytes(block) + bytes(meta);
const agent = agents.find((a) => a.id === agentName);
const orch = agents.find((a) => a.id === 'orchestrator');
const wf = workflows.find((w) => w.id === workflowName);
if (!agent || !wf) { console.error(`unknown agent/workflow: ${agentName} / ${workflowName}`); process.exit(1); }
const req = skills.filter((s) => agent.data.required_skills.includes(s.id));
const perTask = startup + bytes(orch.text) + bytes(agent.text) + req.reduce((n, s) => n + bytes(s.text), 0) + bytes(wf.text);

const result = {
  method: 'static instruction volume; tokens estimated as bytes/4',
  counts: { agents: agents.length, skills: skills.length, workflows: workflows.length },
  baseline: { bytes: baseline, est_tokens: est(baseline) },
  startup: { bytes: startup, est_tokens: est(startup), pct_of_baseline: +(100 * startup / baseline).toFixed(1) },
  per_task: { agent: agentName, workflow: workflowName, required_skills: req.map((s) => s.id), bytes: perTask, est_tokens: est(perTask), pct_of_baseline: +(100 * perTask / baseline).toFixed(1) },
};
if (args.includes('--json')) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`Context budget (static, est. tokens = bytes/4) — ${result.counts.agents} agents, ${result.counts.skills} skills, ${result.counts.workflows} workflows`);
  console.log(`  baseline (load everything):   ${result.baseline.est_tokens.toLocaleString()} est. tokens`);
  console.log(`  startup (metadata only):      ${result.startup.est_tokens.toLocaleString()} est. tokens (${result.startup.pct_of_baseline}% of baseline)`);
  console.log(`  typical task (${agentName} + ${workflowName}): ${result.per_task.est_tokens.toLocaleString()} est. tokens (${result.per_task.pct_of_baseline}% of baseline)`);
}
