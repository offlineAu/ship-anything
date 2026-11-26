# Changelog

All notable changes are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning: [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-11-26

### Added
- Initial foundation (bootstrap 2026-11-25/26): 22 specialist agent definitions, 57 internal Agent Skills,
  15 composable workflows, policies (authorization, secrets, external skills, file ownership, status model),
  coordination templates, skill registry with 25 researched upstream candidates.
- `ship-anything` CLI 0.1.0, the first npm release: `init`, `update`, `rollback`, `doctor`, `validate`,
  `skills list|add|approve|remove`, `agents list|show`; adapters for Claude Code, Codex, OpenCode, Cursor,
  Gemini CLI and generic AGENTS.md agents.
- Content validator, registry generator, CI workflow.
