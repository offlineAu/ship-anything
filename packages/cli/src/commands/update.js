import { loadManifest } from '../lib/installer.js';
import { ui } from '../lib/ui.js';
import * as init from './init.js';

/**
 * Re-applies the bundled content of this CLI version to a project, for the agents that were
 * installed before. Same safety rules as init: user-modified files are never overwritten.
 * External skills are never updated here — see .ship-anything/policies/external-skills.md.
 */
export async function run(args, opts) {
  const manifest = loadManifest(opts.cwd ?? process.cwd());
  if (!manifest.agents?.length) { ui.error('No installation found. Run `ship-anything init` first.'); return 1; }
  return init.run(args, { ...opts, agent: opts.agent ?? manifest.agents.join(',') });
}

export const help = `ship-anything update [--dry-run] [--yes] [--force]

Updates SHIP ANYTHING-managed files to the content bundled with this CLI version, for the
agents recorded at install time. Locally modified files are skipped (conflicts are listed).
External skills are never auto-updated; re-review them via \`skills add\` + \`skills approve\`.`;
