---
name: repository-mapping
description: >-
  Produces a compact, cached map of a repository — layout, languages, entry points,
  build/test commands, module boundaries and hotspots — stored in
  .ship-anything/state/repo-map.md and refreshed incrementally. Use when entering an
  existing or large codebase (roughly 200+ files), before planning work across modules,
  when onboarding agents, or when documentation needs an accurate project structure.
license: MIT
metadata:
  category: efficiency
  version: "0.1.0"
  agents: [orchestrator, documentation-agent]
---

# Repository mapping

## Purpose

Give every agent the same accurate, cheap orientation: where things are, how to build and
test, and which areas are risky — so nobody re-explores the tree from scratch.

## When to use

- DISCOVER step on an existing repo; mandatory-ish above ~200 tracked files.
- Before assigning file ownership for parallel work.
- Before writing architecture or contributor docs.
- After a large refactor or merge that moved directories.

Do not use when:
- The repo is empty or brand new (map it after scaffolding).
- You need deep semantics of one subsystem — use `codebase-intelligence`.
- A current map exists and `git diff --stat <mapped-commit>..HEAD` shows only small changes.

## Inputs

- The working tree and git history.
- Existing `.ship-anything/state/repo-map.md` (with its recorded commit).

## Procedure

1. **Check freshness**: if `repo-map.md` exists, read its `commit:` line and run
   `git diff --stat <commit>..HEAD | tail -n 1`. Few changes → update affected sections only.
2. **Inventory** (tracked files only, ignoring vendored/build output):
   - `git ls-files | wc -l`
   - `git ls-files | awk -F/ 'NF>1{print $1}' | sort | uniq -c | sort -rn | head -n 20`
   - Languages: `git ls-files | sed -n 's/.*\.\([A-Za-z0-9]*\)$/\1/p' | sort | uniq -c | sort -rn | head`
   - Or `tokei` / `cloc --vcs=git` if installed.
3. **Manifests and commands**: read `package.json` scripts, `pyproject.toml`, `Cargo.toml`,
   `go.mod`, `Makefile`, `docker-compose.*`, CI files (`.github/workflows/*`). Record the
   real build, test, lint, dev commands; mark any not yet executed as "not run".
4. **Workspaces**: detect monorepo tools (`pnpm-workspace.yaml`, `turbo.json`, `nx.json`,
   Cargo workspaces, Go workspaces) and list packages with one-line purpose.
5. **Entry points**: server mains, route directories, CLI bins, app roots, workers, cron jobs,
   migrations directory, infra/IaC roots.
6. **Hotspots**: churn `git log --since=6.months --name-only --pretty=format: | sort | uniq -c | sort -rn | head -n 15`;
   largest source files `git ls-files -z | xargs -0 wc -l 2>/dev/null | sort -rn | head -n 15`.
7. **Ownership hints**: map directories to default owners from
   `.ship-anything/policies/file-ownership.md`.
8. **Write `repo-map.md`** (target well under ~150 lines):
   ```
   commit: <sha>   generated: <date>   files: <n>
   ## Stack            languages, frameworks, runtimes (with evidence file)
   ## Commands         install / dev / build / test / lint (run? yes/no)
   ## Layout           top-level dirs → purpose
   ## Packages         (monorepos) name → path → purpose
   ## Entry points     path → what starts there
   ## Data             schema/migrations location, ORM
   ## Hotspots         high-churn / large files
   ## Unknowns         things not yet understood
   ```
9. For a handoff that needs actual code content of a slice, pack it rather than pasting:
   `npx repomix@<pinned> --include "packages/api/**" --compress --style markdown -o .ship-anything/cache/api-pack.md`
   (review output for sensitive content before sharing).

## Decision rules

| Situation | Action |
|---|---|
| < ~200 files | A short Layout + Commands section is enough |
| Monorepo | Map per package; root map links to them |
| Generated/vendored dirs (`dist/`, `vendor/`, `node_modules/`) | Exclude; note their existence |
| Command found in docs but never run | Record as "not run", never "works" |
| Map older than many commits | Regenerate the changed sections |

## Tools

- `git ls-files`, `git log`, `git diff --stat`, `awk`, `sort`, `uniq`, `wc`.
- Optional: `tokei`, `cloc`, `tree -L 2 -I node_modules`.
- Optional upstream: `repomix` (ADOPT, pin version; Secretlint filtering) and
  `understand-anything` (knowledge graph; heavy first run, hooks) — see
  .ship-anything/registry.yaml. Do not install without user approval.

## Quality standards

- Every command and stack claim points at the file it came from.
- The map records the commit it describes.
- No secrets or `.env` contents in the map.
- Short enough that loading it is cheaper than re-exploring.

## Common failures

- Mapping `node_modules` or build output and drowning the signal.
- Listing commands from README as working without running them.
- Never refreshing the map, so agents trust a stale layout.
- Packing the whole repo into context when one package was needed.

## Outputs

- `.ship-anything/state/repo-map.md` with commit stamp.
- Optional packed slices in `.ship-anything/cache/`.

## Done when

- The map exists, is stamped with the current commit, and covers stack, commands, layout,
  entry points, hotspots and unknowns with evidence.
