import { findContentRoot, listAgents } from '../lib/content.js';
import { ui } from '../lib/ui.js';

export async function run(args, opts) {
  const [sub = 'list', name] = args;
  const agents = listAgents(findContentRoot()).filter((a) => a.data);
  if (sub === 'list' || sub === 'ls') {
    if (opts.json) { console.log(JSON.stringify(agents.map((a) => ({ name: a.id, role: a.data.role, description: a.data.description, required_skills: a.data.required_skills, optional_skills: a.data.optional_skills })), null, 2)); return 0; }
    ui.heading(`agents — ${agents.length}`);
    for (const a of agents) ui.line(`  ${a.id.padEnd(22)} ${String(a.data.role).padEnd(34)} skills: ${a.data.required_skills.join(', ')}`);
    return 0;
  }
  if (sub === 'show') {
    const a = agents.find((x) => x.id === name);
    if (!a) { ui.error(`unknown agent: ${name}`); return 1; }
    console.log(a.text);
    return 0;
  }
  console.log(help);
  return 1;
}

export const help = `ship-anything agents list [--json]   List specialist agents, roles and required skills
ship-anything agents show <name>     Print an agent definition`;
