---
name: craft-anything-analysis
description: >-
  Drives the optional craft-anything engine (CLI and MCP server) for analysis of software the
  user owns or may examine: Clean room or Deep inspection with evidence records, and, for
  software the user owns or may recreate, its Study → Build → Check → Ready rebuild loop.
  Covers the one-line authorization, safety snapshot, per-project MCP setup, mode choice,
  unsafe adapters and hard limits. Use when reverse-engineering or re-platforming a target
  with craft-anything installed; not for products the user does not own.
license: MIT
metadata:
  category: product-intelligence
  version: "0.1.0"
  agents: [research-agent, security-agent, qa-agent]
---

# Craft Anything analysis

## Purpose

Use craft-anything inside `reverse-engineering` and the `reverse-engineer` workflow:
inspect a target with its evidence-producing tools, map the records onto our ledger, and,
for software the user owns or may recreate, let its rebuild loop produce a new version
that QA verifies independently. This skill sets the guard rails.

## When to use

- craft-anything is installed (or the user agrees to install it) and the target is an
  app, site, game, file format or capture the user owns or may examine.
- Re-platforming the user's own product with a build-and-compare loop.
- RE-01/RE-02 in `workflows/reverse-engineer.md` on large binaries, packages or bundles.

Do not use when:
- Source code is available: use `codebase-intelligence`.
- The user wants something "like" a product they do not own: use `clone-existing-product`
  with original branding, copy and assets, never the rebuild loop against that product.
- The goal involves DRM, logins, licence checks or anti-cheat. Refuse that part.
- `file`, `strings` or an unzip would answer it: use `reverse-engineering`.

## Inputs

- A one-line authorization from the user, for example "I own this app" or "I'm allowed to
  analyse it (vendor contract, interoperability)".
- The target: URL of the user's site, app bundle, package, binary, game files or capture.
- What the user wants: questions to answer (analysis) or a request to build (rebuild).
- Install state: `craft-anything-cli doctor` output, run by the user or with their OK.

## Procedure

1. **Record authorization.** Append one line to `.ship-anything/state/decisions.md`:
   `<date> craft-anything: <target> — "<user's words>" — mode: clean-room|deep — rebuild: yes|no`.
   A new target needs a new line.
2. **Snapshot first.** Commit the working tree and work on a copy of the target. A VM is
   not required; recommend a VM or disk snapshot if the user has one.
3. **Install check.** The user installs a signed release (verify against the release's
   `SHA256SUMS.txt`) or builds the CLI from source. Never install it for them unasked.
   Run `craft-anything-cli doctor` to confirm the install, engines and coding agents.
4. **Connect per project.** Prefer adding the MCP server to this project's own MCP config,
   with the mode as a flag: `craft-anything-cli mcp --clean-room` (or `--deep`). The global
   `craft-anything-cli setup` (for example `setup --client codex --yes`) writes the user's
   global agent config and pre-approves `rebuild_start`; run it only with the user's
   explicit OK, recorded in `decisions.md`. CLI-only: `craft-anything-cli commands`.
5. **Choose the mode.** Clean room (default) reads nothing inside the original: it works
   from screenshots, visible text and measured layout, and refuses tools that look inside.
   Deep reads code and files, a site's JavaScript, and enables Ghidra (when installed),
   Frida and packet-capture tools. Both may run on the user's own machine. Clean room is
   not an operating-system sandbox; the coding agent still acts as the user.
6. **Study.** Open and triage the target (`core_target_open`, `core_target_triage`,
   `core_overview_show`), then the toolset that fits. Page large results with
   `core_evidence_browse`; record open questions with `core_unknown_add`.
7. **Map evidence.** Export (`core_evidence_export`) and copy each finding into our ledger
   (`docs/research/re-<target>.md`): claim, evidence reference, confidence, limitations.
   High-confidence records with direct evidence become *observed*; the rest *inferred*.
8. **Rebuild loop (optional).** Only when the decisions line says `rebuild: yes`. Before
   starting: turn Auto mode off, or set approvals to ask for commands, publishing and
   deletes (`project_approvals_set`); pick Claude Code as the builder. Then, for example,
   `craft-anything-cli rebuild <url> "<request>" --rounds 1 --project-folder <folder>`,
   and `--continue-in <folder>` for follow-ups. Review each approval card; install npm
   dependencies with `npm install --ignore-scripts` unless the user trusts them.
9. **Check.** Read the project's `checks/`, then `qa-agent` verifies the result with our
   own tests (`testing-and-qa`). Upstream's likeness score is input, not a verdict.
10. **Report** methods, mode, tools used, findings, rebuild output path and limitations
    in `docs/research/re-<target>.md`.

## Decision rules

| Situation | Action |
|---|---|
| No authorization line yet | Ask for one sentence; record it; then start |
| User owns the target or may examine its internals | Deep is fine; snapshot first |
| Ownership of internals unclear (licensed app, third-party site) | Clean room only; no rebuild |
| Target is someone else's product and the user wants "theirs" | `clone-existing-product`; original branding; no rebuild against it |
| DRM, login wall, licence check, anti-cheat in the way | Stop at it; document the interface only |
| Builder would be Antigravity or OpenCode | Do not use; Antigravity passes `--dangerously-skip-permissions`, OpenCode runs with `--auto` |
| Global `setup` requested | Only with explicit user OK; prefer per-project MCP config |
| Credentials or personal data in evidence | Do not use; redact; tell the user to rotate |
| Frida or packet capture | Only the user's own processes and their own traffic |

## Tools

- `craft-anything-cli` (CLI and MCP server): `doctor`, `commands`, `mcp` with `--clean-room`
  or `--deep`, `rebuild`, `setup`; about 320 tools in toolsets (`core`, `native`, `android`,
  `javascript`, `browser`, `frida`, …). Registry entry: `craft-anything` in
  `.ship-anything/registry.yaml`, enabled only under `.ship-anything/policies/external-skills.md`.
- Warnings from upstream's own docs: early alpha; Auto mode is on by default and lets the
  builder run commands without asking (except a fixed set such as deletes outside the
  project, system changes and publishing); the Antigravity and OpenCode adapters bypass
  permission prompts; installing dependencies runs npm install scripts and build scripts.
- Fallback without the engine: `reverse-engineering` (`file`, `strings`, Ghidra, JADX).
- Attribution: ideas and tool names from storytold/craft-anything (MIT OR Apache-2.0),
  read at commit 14c502c (main, 2026-11-28; latest release v0.6.1 = 48a9c5a). Text is
  our own; ArtCraft names and logos are upstream trademarks and are not used here.

## Quality standards

- Authorization line (with mode and rebuild) recorded before the first tool call.
- Every finding traces to an evidence record or our own command.
- Working tree committed or snapshotted before Deep mode or a rebuild.
- Rebuild output uses the user's branding or neutral placeholders, never another
  product's logos, photos or text.

## Common failures

- Running global `setup` for convenience, leaving tools pre-approved everywhere.
- Treating Clean room as isolation from secrets on the same machine.
- Leaving Auto mode on and choosing "always allow" for npm with untrusted dependencies.
- Reporting upstream likeness scores as QA results.
- Pasting large decompiled code or captured traffic into docs.

## Outputs

- Authorization line in `.ship-anything/state/decisions.md`.
- `docs/research/re-<target>.md`: mode, tools, evidence ledger, limitations.
- Optional rebuild project folder (`app/`, `checks/`, `craft.json`) and QA's verdict on it.

## Done when

- The user's questions are answered with evidence or listed as unknowns, the mode and
  tools used are recorded, no hard limit was crossed, and any rebuild was verified by
  `qa-agent` with our own checks.
