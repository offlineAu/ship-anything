import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { cli, tmpProject, read, exists } from './helpers.js';

test('init --dry-run writes nothing', () => {
  const dir = tmpProject();
  const r = cli(['init', '--agent', 'claude', '--dry-run'], dir);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /Dry run/);
  assert.deepEqual(fs.readdirSync(dir), []);
});

test('init without --yes in a non-TTY does not apply', () => {
  const dir = tmpProject();
  const r = cli(['init', '--agent', 'generic'], dir);
  assert.equal(r.code, 1, r.out);
  assert.equal(exists(dir, 'AGENTS.md'), false);
});

test('init --agent claude installs agents, skills, instructions', () => {
  const dir = tmpProject();
  const r = cli(['init', '--agent', 'claude', '--yes'], dir);
  assert.equal(r.code, 0, r.out);
  assert.ok(exists(dir, '.claude/agents/orchestrator.md'));
  assert.ok(exists(dir, '.claude/skills/frontend-development/SKILL.md'));
  assert.ok(exists(dir, '.agents/skills/frontend-development/SKILL.md'));
  assert.match(read(dir, 'CLAUDE.md'), /^<!-- ship-anything:begin core -->\n@AGENTS\.md/);
  assert.match(read(dir, 'AGENTS.md'), /SHIP ANYTHING — operating instructions/);
  const agent = read(dir, '.claude/agents/qa-agent.md');
  assert.match(agent, /^---\nname: qa-agent\ndescription: /);
  assert.doesNotMatch(agent.split('---')[1], /required_skills/, 'Claude frontmatter should be minimal');
  assert.match(read(dir, '.ship-anything/config.yaml'), /installed_agents: \[claude\]/);
  assert.match(read(dir, '.gitignore'), /\.ship-anything\/backups\//);
});

test('init is idempotent', () => {
  const dir = tmpProject();
  assert.equal(cli(['init', '--agent', 'codex', '--yes'], dir).code, 0);
  const r = cli(['init', '--agent', 'codex', '--yes'], dir);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /Already up to date/);
});

test('existing user files are preserved; instruction files get a managed block', () => {
  const dir = tmpProject();
  fs.writeFileSync(path.join(dir, 'AGENTS.md'), '# My project rules\n\nUse tabs.\n');
  fs.writeFileSync(path.join(dir, '.gitignore'), 'dist/\n');
  assert.equal(cli(['init', '--agent', 'generic', '--yes'], dir).code, 0);
  const agents = read(dir, 'AGENTS.md');
  assert.ok(agents.startsWith('# My project rules\n\nUse tabs.\n'));
  assert.match(agents, /ship-anything:begin core/);
  assert.ok(read(dir, '.gitignore').startsWith('dist/\n'));
  // re-run does not duplicate the block
  cli(['init', '--agent', 'generic', '--yes'], dir);
  assert.equal(read(dir, 'AGENTS.md').match(/ship-anything:begin core/g).length, 1);
});

test('locally modified managed files are not overwritten without --force', () => {
  const dir = tmpProject();
  cli(['init', '--agent', 'generic', '--yes'], dir);
  const p = path.join(dir, '.ship-anything/config.yaml');
  fs.writeFileSync(p, `${fs.readFileSync(p, 'utf8')}\n# my edit\n`);
  const r = cli(['init', '--agent', 'generic', '--yes'], dir);
  assert.equal(r.code, 2, r.out);
  assert.match(r.out, /conflict/);
  assert.match(read(dir, '.ship-anything/config.yaml'), /# my edit/);
});

test('pre-existing unmanaged file at a managed path is a conflict, --force backs it up', () => {
  const dir = tmpProject();
  fs.mkdirSync(path.join(dir, '.claude/agents'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.claude/agents/qa-agent.md'), 'mine\n');
  const r1 = cli(['init', '--agent', 'claude', '--yes'], dir);
  assert.equal(r1.code, 2, r1.out);
  assert.equal(read(dir, '.claude/agents/qa-agent.md'), 'mine\n');
  const r2 = cli(['init', '--agent', 'claude', '--yes', '--force'], dir);
  assert.equal(r2.code, 0, r2.out);
  assert.notEqual(read(dir, '.claude/agents/qa-agent.md'), 'mine\n');
  const backups = fs.readdirSync(path.join(dir, '.ship-anything/backups'));
  assert.equal(read(dir, path.join('.ship-anything/backups', backups.at(-1), '.claude/agents/qa-agent.md')), 'mine\n');
});

test('--agent all writes native formats for every agent', () => {
  const dir = tmpProject();
  const r = cli(['init', '--agent', 'all', '--yes'], dir);
  assert.equal(r.code, 0, r.out);
  const toml = read(dir, '.codex/agents/security-agent.toml');
  assert.match(toml, /^# Generated/m);
  assert.match(toml, /^name = "security-agent"$/m);
  assert.match(toml, /^description = ".+"$/m);
  assert.match(toml, /^developer_instructions = '''\n/m);
  assert.match(read(dir, '.opencode/agents/qa-agent.md'), /mode: subagent/);
  assert.match(read(dir, '.opencode/agents/orchestrator.md'), /mode: primary/);
  assert.ok(exists(dir, '.gemini/agents/qa-agent.md'));
  assert.match(read(dir, 'GEMINI.md'), /@\.\/AGENTS\.md/);
  assert.equal(exists(dir, '.cursor/agents'), false, 'cursor agents skipped when claude installed (Cursor reads .claude/agents)');
});

test('--agent cursor alone writes .cursor/agents', () => {
  const dir = tmpProject();
  assert.equal(cli(['init', '--agent', 'cursor', '--yes'], dir).code, 0);
  assert.ok(exists(dir, '.cursor/agents/orchestrator.md'));
});

test('rollback restores the pre-install state', () => {
  const dir = tmpProject();
  fs.writeFileSync(path.join(dir, 'AGENTS.md'), 'original\n');
  cli(['init', '--agent', 'claude', '--yes'], dir);
  const r = cli(['rollback', '--yes'], dir);
  assert.equal(r.code, 0, r.out);
  assert.equal(read(dir, 'AGENTS.md'), 'original\n');
  assert.equal(exists(dir, '.claude'), false);
  assert.equal(exists(dir, 'CLAUDE.md'), false);
});

test('unknown agent is rejected with a helpful message', () => {
  const r = cli(['init', '--agent', 'windsurf'], tmpProject());
  assert.equal(r.code, 1);
  assert.match(r.out, /Unknown agent\(s\): windsurf/);
});

test('init --profile web keeps creative skills and agents out of native dirs but on demand', () => {
  const dir = tmpProject();
  const r = cli(['init', '--agent', 'claude', '--profile', 'web', '--yes'], dir);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /profile: web/);
  assert.ok(exists(dir, '.claude/skills/frontend-development/SKILL.md'));
  assert.ok(exists(dir, '.claude/skills/token-optimization/SKILL.md'), 'efficiency skills are always native');
  assert.equal(exists(dir, '.claude/skills/blender-production'), false);
  assert.ok(exists(dir, '.ship-anything/skills/blender-production/SKILL.md'), 'library copy for on-demand reads');
  assert.equal(exists(dir, '.ship-anything/skills/frontend-development'), false, 'no duplicate of native skills');
  assert.ok(exists(dir, '.claude/agents/frontend-agent.md'));
  assert.equal(exists(dir, '.claude/agents/blender-agent.md'), false);
  assert.ok(exists(dir, '.ship-anything/agents/blender-agent.md'), 'canonical agents stay complete');
  assert.match(read(dir, 'AGENTS.md'), /Installed profile: web\./);
  const manifest = JSON.parse(read(dir, '.ship-anything/state/install-manifest.json'));
  assert.deepEqual(manifest.profile, ['web']);
  const u = cli(['update', '--yes'], dir);
  assert.match(u.out, /profile: web/);
  assert.match(u.out, /Already up to date/);
});

test('unknown profile is rejected', () => {
  const r = cli(['init', '--agent', 'generic', '--profile', 'nope', '--dry-run'], tmpProject());
  assert.notEqual(r.code, 0);
  assert.match(r.out, /Unknown profile: nope/);
});
