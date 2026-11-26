import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const MANIFEST = '.ship-anything/state/install-manifest.json';
const BEGIN = (id) => `<!-- ship-anything:begin ${id} -->`;
const END = (id) => `<!-- ship-anything:end ${id} -->`;
const HASH_BEGIN = (id) => `# ship-anything:begin ${id}`;
const HASH_END = (id) => `# ship-anything:end ${id}`;

export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

export function loadManifest(target) {
  const p = path.join(target, MANIFEST);
  if (!fs.existsSync(p)) return { version: 1, files: {}, transactions: [] };
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function markers(relPath, id) {
  const hashStyle = /(^|\/)\.gitignore$|\.(ya?ml|toml|sh)$/.test(relPath);
  return hashStyle ? [HASH_BEGIN(id), HASH_END(id)] : [BEGIN(id), END(id)];
}

/** Insert or replace a managed block in existing text. Returns the new text. */
export function upsertBlock(existing, relPath, id, content) {
  const [b, e] = markers(relPath, id);
  const block = `${b}\n${content.trimEnd()}\n${e}`;
  if (existing == null) return `${block}\n`;
  const start = existing.indexOf(b);
  const end = existing.indexOf(e);
  if (start !== -1 && end > start) {
    return existing.slice(0, start) + block + existing.slice(end + e.length);
  }
  const sep = existing.length === 0 ? '' : existing.endsWith('\n\n') ? '' : existing.endsWith('\n') ? '\n' : '\n\n';
  return `${existing}${sep}${block}\n`;
}

/**
 * Compute what an install would do, without touching disk.
 * ops: [{ path, content, kind: 'file' } | { path, content, kind: 'block', blockId }]
 * Returns actions: { path, action: create|update|unchanged|conflict|append, next, reason }
 */
export function plan(target, ops, { force = false } = {}) {
  const manifest = loadManifest(target);
  const seen = new Set();
  const actions = [];
  for (const op of ops) {
    if (seen.has(op.path)) throw new Error(`internal: duplicate install path ${op.path}`);
    seen.add(op.path);
    const abs = path.join(target, op.path);
    const exists = fs.existsSync(abs);
    const current = exists ? fs.readFileSync(abs, 'utf8') : null;
    if (op.kind === 'block') {
      const next = upsertBlock(current, op.path, op.blockId, op.content);
      const [b] = markers(op.path, op.blockId);
      let action = 'create';
      if (exists) action = next === current ? 'unchanged' : current.includes(b) ? 'update' : 'append';
      actions.push({ ...op, action, next });
      continue;
    }
    if (!exists) { actions.push({ ...op, action: 'create', next: op.content }); continue; }
    if (current === op.content) { actions.push({ ...op, action: 'unchanged', next: op.content }); continue; }
    const rec = manifest.files[op.path];
    if (rec && rec.sha256 === sha256(current)) {
      actions.push({ ...op, action: 'update', next: op.content });
    } else if (force) {
      actions.push({ ...op, action: 'update', next: op.content, reason: 'forced overwrite (backup kept)' });
    } else {
      actions.push({ ...op, action: 'conflict', next: op.content, reason: rec ? 'modified locally since last install' : 'file exists and is not managed by ship-anything' });
    }
  }
  return { actions, manifest };
}

/** Apply a plan. Conflicts are skipped. Every overwritten file is backed up first. */
export function apply(target, { actions, manifest }, meta = {}) {
  const txId = new Date().toISOString().replace(/[:.]/g, '-');
  const tx = { id: txId, at: new Date().toISOString(), meta, created: [], updated: [] };
  for (const a of actions) {
    if (a.action === 'unchanged' || a.action === 'conflict') continue;
    const abs = path.join(target, a.path);
    const prevRecord = manifest.files[a.path] ?? null;
    if (a.action === 'create') {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, a.next);
      tx.created.push({ path: a.path, sha256: sha256(a.next), prevRecord });
    } else {
      const backupRel = path.posix.join('.ship-anything/backups', txId, a.path);
      const backupAbs = path.join(target, backupRel);
      fs.mkdirSync(path.dirname(backupAbs), { recursive: true });
      fs.copyFileSync(abs, backupAbs);
      fs.writeFileSync(abs, a.next);
      tx.updated.push({ path: a.path, backup: backupRel, sha256: sha256(a.next), prevRecord });
    }
    manifest.files[a.path] = { sha256: sha256(a.next), kind: a.kind, ...(a.blockId ? { blockId: a.blockId } : {}) };
  }
  if (tx.created.length || tx.updated.length) {
    manifest.transactions.push(tx);
    manifest.updatedAt = tx.at;
    Object.assign(manifest, meta.manifest ?? {});
  }
  writeManifest(target, manifest);
  return tx;
}

export function writeManifest(target, manifest) {
  const p = path.join(target, MANIFEST);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(manifest, null, 2)}\n`);
}

/** Undo the most recent transaction. Files changed after install are kept and reported. */
export function rollback(target) {
  const manifest = loadManifest(target);
  const tx = manifest.transactions.pop();
  if (!tx) return { tx: null, restored: [], removed: [], kept: [] };
  const restored = []; const removed = []; const kept = [];
  for (const c of tx.created) {
    const abs = path.join(target, c.path);
    if (!fs.existsSync(abs)) { removed.push(c.path); }
    else if (sha256(fs.readFileSync(abs, 'utf8')) === c.sha256) { fs.rmSync(abs); removed.push(c.path); pruneEmptyDirs(target, path.dirname(abs)); }
    else { kept.push(c.path); continue; }
    if (c.prevRecord) manifest.files[c.path] = c.prevRecord; else delete manifest.files[c.path];
  }
  for (const u of tx.updated) {
    const abs = path.join(target, u.path);
    const current = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
    if (current !== null && sha256(current) !== u.sha256) { kept.push(u.path); continue; }
    fs.copyFileSync(path.join(target, u.backup), abs);
    restored.push(u.path);
    if (u.prevRecord) manifest.files[u.path] = u.prevRecord; else delete manifest.files[u.path];
  }
  writeManifest(target, manifest);
  return { tx, restored, removed, kept };
}

function pruneEmptyDirs(target, dir) {
  const stop = path.resolve(target);
  let d = path.resolve(dir);
  while (d.startsWith(stop) && d !== stop) {
    try {
      if (fs.readdirSync(d).length) return;
      fs.rmdirSync(d);
    } catch { return; }
    d = path.dirname(d);
  }
}
