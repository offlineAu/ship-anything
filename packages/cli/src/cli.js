import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { ui } from './lib/ui.js';

const COMMANDS = {
  init: () => import('./commands/init.js'),
  update: () => import('./commands/update.js'),
  rollback: () => import('./commands/rollback.js'),
  doctor: () => import('./commands/doctor.js'),
  validate: () => import('./commands/validate.js'),
  skills: () => import('./commands/skills.js'),
  agents: () => import('./commands/agents.js'),
};

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const USAGE = `ship-anything ${pkg.version} — Build Anything. Ship Everything.

Usage: ship-anything <command> [options]

Commands:
  init        Install agents, skills, workflows and policies into this project
  update      Re-apply bundled content (safe; never overwrites your edits)
  rollback    Undo the last init/update
  doctor      Check environment, agents and installation health
  validate    Validate content (source repo) or installation (project)
  skills      list | add <source> | approve <name> | remove <name>
  agents      list | show <name>

Global options: --cwd <dir>  --json  --verbose  --help  --version
Run \`ship-anything <command> --help\` for details.`;

const OPTIONS = {
  agent: { type: 'string', short: 'a' },
  'dry-run': { type: 'boolean' },
  yes: { type: 'boolean', short: 'y' },
  force: { type: 'boolean' },
  verbose: { type: 'boolean' },
  json: { type: 'boolean' },
  cwd: { type: 'string' },
  skill: { type: 'string', short: 's' },
  profile: { type: 'string', short: 'p' },
  category: { type: 'string' },
  content: { type: 'boolean' },
  'allow-scripts': { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' },
};

export async function main(argv) {
  let parsed;
  try {
    parsed = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true, strict: true });
  } catch (err) {
    ui.error(err.message);
    console.log(USAGE);
    return 1;
  }
  const { values: opts, positionals } = parsed;
  if (opts.version) { console.log(pkg.version); return 0; }
  const [cmd, ...rest] = positionals;
  if (!cmd) { console.log(USAGE); return opts.help ? 0 : 1; }
  const load = COMMANDS[cmd];
  if (!load) { ui.error(`Unknown command: ${cmd}`); console.log(USAGE); return 1; }
  const mod = await load();
  if (opts.help) { console.log(mod.help); return 0; }
  try {
    return await mod.run(rest, opts);
  } catch (err) {
    ui.error(err.message);
    if (opts.verbose) console.error(err.stack);
    return 1;
  }
}
