import path from 'node:path';
import { rollback } from '../lib/installer.js';
import { confirm, ui } from '../lib/ui.js';

export async function run(args, opts) {
  const target = path.resolve(opts.cwd ?? process.cwd());
  if (!opts.yes && !(await confirm('Undo the most recent ship-anything init/update in this project?'))) {
    ui.warn('Aborted (use --yes in non-interactive shells).');
    return 1;
  }
  const r = rollback(target);
  if (!r.tx) { ui.info('Nothing to roll back.'); return 0; }
  ui.ok(`Rolled back ${r.tx.id}: removed ${r.removed.length}, restored ${r.restored.length}.`);
  if (r.kept.length) ui.warn(`Kept ${r.kept.length} file(s) changed after install: ${r.kept.slice(0, 5).join(', ')}${r.kept.length > 5 ? ', …' : ''}`);
  return 0;
}

export const help = `ship-anything rollback [--yes]

Undoes the most recent init/update transaction: removes files it created (only if unchanged
since) and restores files it modified from .ship-anything/backups/.`;
