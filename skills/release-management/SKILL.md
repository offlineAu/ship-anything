---
name: release-management
description: >-
  Prepares and coordinates releases: semantic versioning decisions, Keep a Changelog
  entries, release checklists, annotated tags (local only unless pushing is authorized),
  release notes, package publishing gates and a written rollback plan. Use when cutting a
  version, writing a changelog, publishing a package or app build, or asked to "release",
  "bump the version" or "tag v1.2.0".
license: MIT
metadata:
  category: delivery
  version: "0.1.0"
  agents: [release-agent]
---

# Release management

## Purpose

Turn verified work into a named, reproducible version that users and operators can
identify, read about, install and roll back.

## When to use

- Cutting a new version of an app, library, CLI or mobile/desktop build.
- Writing or fixing a changelog and release notes.
- Planning publication to a registry or store.
- Planning a rollback for a release.

Do not use when:
- Only deploying an already-versioned build: use `deployment`.
- Deciding whether the product is ready at all: use `production-readiness`.
- Writing general docs: use `documentation`.

## Inputs

- Commits/PRs since the last release (`git log <last-tag>..HEAD`), task statuses.
- Current version source(s): `package.json`, `Cargo.toml`, `pyproject.toml`, app manifests.
- Distribution channels: registry, store, GitHub release, container registry, hosted app.

## Procedure

1. Confirm every task in the release is VERIFIED (or explicitly descoped). Collect bug and
   feature IDs.
2. Decide the version bump with SemVer 2.0.0 (Decision rules). For pre-1.0 projects, state
   the convention used (breaking changes bump minor).
3. Update the changelog in Keep a Changelog format: a dated section `## [1.4.0] - YYYY-MM-DD`
   with `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security` subsections; move
   items from `## [Unreleased]`. Write for users, not commit messages. Include migration
   steps for breaking changes.
4. Bump the version in every source of truth and lockfile consistently (`npm version
   <x.y.z> --no-git-tag-version`, edit `Cargo.toml` (or `cargo set-version` if cargo-edit is
   already installed), edit `pyproject.toml`). Grep for the
   old version string to catch stragglers.
5. Run the release checklist:
   - Clean checkout builds; full test suite, type check, lint pass on the release commit.
   - Dependency audit and secret scan clean (or findings accepted).
   - Changelog and docs updated; upgrade notes for breaking changes.
   - Artifacts built reproducibly; for packages, `npm pack --dry-run` / `cargo package
     --list` / `python -m build` + `twine check dist/*` show the intended files only.
   - License and notices included.
   - Rollback plan written (step 8).
6. Commit locally with a message like `release: v1.4.0` (pushing and tagging on a remote still need authorization).
7. Create an annotated tag locally: `git tag -a v1.4.0 -m "v1.4.0"`. Pushing tags or
   branches, creating a GitHub release, and publishing to any registry or store each need
   explicit user authorization (`.ship-anything/policies/authorization.md`). Ask with the
   exact commands, e.g. `git push origin v1.4.0`, `npm publish --access public`.
8. Rollback plan: how to restore the previous version per channel (redeploy previous tag;
   `npm deprecate pkg@1.4.0 "<reason>"` and publish a fix, since unpublishing is limited;
   store builds are rolled forward; database migrations need a down path or forward-fix).
9. After authorized publish/deploy, verify: install the published package in a scratch
   directory (`npm view pkg version`, `pip index versions pkg`), or confirm the deployed
   version endpoint; attach evidence to the release report.

## Decision rules

| Change since last release | Bump |
|---|---|
| Incompatible public API/CLI/config/schema change | MAJOR |
| Backward-compatible feature or deprecation | MINOR |
| Backward-compatible bug fix, security fix, docs in package | PATCH |
| Release candidate | `1.4.0-rc.1` (pre-release identifier) |

- Public API = whatever users depend on: exports, CLI flags, HTTP API, config keys, file
  formats, DB schema for self-hosted apps.
- Never reuse or move a published tag; fix forward with a new version.
- Security fixes get a `Security` changelog entry and, if public, an advisory decision for
  the user.
- Conventional Commits, if used, can propose the bump, but a human-readable changelog is
  still reviewed.

## Tools

- `git log --oneline <tag>..HEAD`, `git tag -a`, `git describe --tags`.
- Package tools: npm/pnpm, cargo, `python -m build`, twine, `gh release create` (authorized
  only). Optional automation already in the repo: changesets, release-please,
  semantic-release.

## Quality standards

- Version strings agree across all manifests, tag and changelog.
- Every changelog line is true for this release and traceable to a verified task.
- Tags stay local until the user authorizes pushing.
- Release report lists what was published where, with evidence, or "not published".

## Common failures

- Changelog generated from commit subjects that users cannot understand.
- Breaking change shipped as a minor/patch.
- Tag created on a different commit than the one tested.
- Publishing `.env`, tests or source maps in a package by accident.
- Pushing tags or publishing as "part of the release" without authorization.

## Outputs

- Updated `CHANGELOG.md`, version bumps, local annotated tag.
- Release notes and rollback plan in `reports/release-<version>.md`.
- Authorization requests for push/publish, and their results.

## Done when

- Version, changelog and tag are consistent and point at a verified commit.
- Release checklist complete with evidence.
- Rollback plan written; publish/push either authorized and verified, or pending with the
  exact commands prepared.
