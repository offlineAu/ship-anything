// Skill profiles: install only the agents and skills a kind of project needs into the agent's
// native directories (whose skill descriptions the host loads at every session start). Every
// other skill is still copied to .ship-anything/skills/ as an on-demand library that agents read
// by path only when a task contract names it, so nothing is lost and startup context stays small.
import { listAgents, listSkills, listWorkflows } from './content.js';

// Workflows are not expanded through `composes` on purpose: fullstack-platform composes
// mobile and desktop, which would pull nearly everything into a "web" profile.
export const PROFILES = {
  full: null,
  web: ['website', 'web-app', 'fullstack-platform', 'improve-existing-project'],
  mobile: ['mobile-app', 'web-app', 'improve-existing-project'],
  desktop: ['desktop-app', 'improve-existing-project'],
  creative: ['website', '3d-product', 'video-production'],
  reverse: ['reverse-engineer', 'clone-existing-product', 'legacy-modernization', 'improve-existing-project'],
};
const CORE_WORKFLOWS = ['build-anything', 'product-discovery', 'security-remediation', 'production-release'];
const CORE_AGENTS = ['orchestrator', 'qa-agent', 'security-agent', 'documentation-agent', 'release-agent'];
const CORE_CATEGORIES = ['efficiency'];

export function parseProfiles(value) {
  const names = String(value ?? 'full').split(',').map((s) => s.trim()).filter(Boolean);
  const unknown = names.filter((n) => !(n in PROFILES));
  if (unknown.length) throw new Error(`Unknown profile: ${unknown.join(', ')}. Use one or more of: ${Object.keys(PROFILES).join(', ')}`);
  return names.length ? names : ['full'];
}

/** Returns { full, agents:Set, skills:Set } for the selected profile names. */
export function resolveProfile(root, names) {
  if (names.includes('full')) return { full: true, agents: null, skills: null };
  const workflows = listWorkflows(root).filter((w) => w.data);
  const wanted = new Set([...CORE_WORKFLOWS, ...names.flatMap((n) => PROFILES[n])]);
  const agents = new Set(CORE_AGENTS);
  const skills = new Set();
  for (const w of workflows.filter((x) => wanted.has(x.id))) {
    for (const a of [...(w.data.required_agents ?? []), ...(w.data.optional_agents ?? [])]) agents.add(a);
    for (const s of w.data.required_skills ?? []) skills.add(s);
  }
  for (const a of listAgents(root).filter((x) => x.data && agents.has(x.id))) {
    for (const s of a.data.required_skills ?? []) skills.add(s); // optional skills stay on demand
  }
  for (const s of listSkills(root).filter((x) => x.data)) {
    if (CORE_CATEGORIES.includes(s.data.metadata?.category)) skills.add(s.id);
  }
  return { full: false, agents, skills };
}
