import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import YAML from 'yaml';
import { ADAPTERS } from '../lib/adapters.js';
import { version, which } from '../lib/detect.js';
import { loadManifest } from '../lib/installer.js';
import { ui } from '../lib/ui.js';

const OPTIONAL_TOOLS = [
  ['docker', 'containers / infrastructure-agent'],
  ['ffmpeg', 'video-editing, sound-design, render verification'],
  ['ffprobe', 'video verification'],
  ['blender', 'blender-production (headless renders)'],
  ['python3', 'helper scripts, some upstream skills'],
  ['gh', 'GitHub research, CI inspection'],
  ['rtk', 'optional terminal-output compression (user-installed)'],
];

export async function run(args, opts) {
  const target = path.resolve(opts.cwd ?? process.cwd());
  const rows = [];
  const add = (group, name, status, detail) => rows.push({ group, name, status, detail });

  const [major] = process.versions.node.split('.').map(Number);
  add('required', 'Node.js', major >= 20 ? 'ok' : 'fail', `v${process.versions.node} (need ≥ 20)`);
  const git = version('git');
  add('required', 'git', git ? 'ok' : 'fail', git ?? 'not found on PATH');
  add('platform', 'OS', 'ok', `${os.platform()} ${os.release()} ${os.arch()}`);

  for (const [id, a] of Object.entries(ADAPTERS)) {
    if (id === 'generic') continue;
    const bin = a.bin.find((b) => which(b));
    const v = bin ? version(bin) : null;
    add('agents', a.label, bin ? 'ok' : 'info', bin ? (v ?? `${bin} (version unknown)`) : 'not installed (optional)');
  }

  const manifest = loadManifest(target);
  const installed = manifest.agents ?? [];
  if (!installed.length) add('project', 'installation', 'info', 'not initialised here — run `ship-anything init`');
  else {
    add('project', 'installation', 'ok', `agents: ${installed.join(', ')} · ${Object.keys(manifest.files).length} managed files`);
    for (const dir of new Set(installed.map((i) => ADAPTERS[i]?.skillsDir).filter(Boolean))) {
      const abs = path.join(target, dir);
      const n = fs.existsSync(abs) ? fs.readdirSync(abs).filter((d) => fs.existsSync(path.join(abs, d, 'SKILL.md'))).length : 0;
      add('project', dir, n ? 'ok' : 'fail', `${n} skills`);
    }
    for (const f of ['.ship-anything/config.yaml', '.ship-anything/registry.yaml']) {
      try { YAML.parse(fs.readFileSync(path.join(target, f), 'utf8')); add('project', f, 'ok', 'valid YAML'); }
      catch (e) { add('project', f, 'fail', e.code === 'ENOENT' ? 'missing' : e.message.split('\n')[0]); }
    }
  }

  for (const [bin, why] of OPTIONAL_TOOLS) {
    const p = which(bin);
    add('optional', bin, p ? 'ok' : 'info', p ? why : `not found — needed only for ${why}`);
  }

  if (opts.json) { console.log(JSON.stringify(rows, null, 2)); }
  else {
    ui.heading('ship-anything doctor');
    let group = '';
    for (const r of rows) {
      if (r.group !== group) { group = r.group; ui.line(`\n${group}`); }
      const mark = { ok: '✔', fail: '✖', info: '·' }[r.status];
      ui.line(`  ${mark} ${r.name.padEnd(28)} ${r.detail}`);
    }
  }
  const failed = rows.filter((r) => r.status === 'fail');
  if (!opts.json) ui.line('');
  if (failed.length) { ui.error(`${failed.length} check(s) failed`); return 1; }
  if (!opts.json) ui.ok('all required checks passed');
  return 0;
}

export const help = `ship-anything doctor [--json] [--cwd <dir>]

Checks Node.js, git, installed coding agents, this project's SHIP ANYTHING installation
(skill directories, config/registry validity) and optional creative/infra tools.
Never installs anything.`;
