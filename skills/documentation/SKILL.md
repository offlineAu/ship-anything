---
name: documentation
description: >-
  Writes and maintains project documentation that matches verified behaviour: README,
  setup and contributor guides, runbooks, API reference (OpenAPI, typed docs), architecture
  notes, changelog entries and end-of-project handoff reports. Every command and claim is
  checked against the code or a real run. Use when docs are missing, stale, requested, or
  when work is handed off.
license: MIT
metadata:
  category: delivery
  version: "0.1.0"
  agents: [documentation-agent]
---

# Documentation

## Purpose

Let a new developer, operator or user succeed without asking the author. Documentation
describes what the software verifiably does today, not what was planned.

## When to use

- A project lacks a README, setup guide, runbook or API reference.
- Behaviour, commands, config or APIs changed and docs must follow.
- A release needs notes or a changelog entry.
- Work is being handed off (end of session, end of project).

Do not use when:
- Writing code comments inside a change: the implementing agent does that.
- Producing an ADR for a new decision: use `.ship-anything/templates/architecture-decision.md`
  via `architecture-planning`.
- Marketing copy or landing pages: that is product/design work.

## Inputs

- Repository (scripts, config, env schema, routes, CLI help output).
- Verified task reports and test results (`.ship-anything/state/tasks/*.md`).
- Audience: end user, developer, operator, or stakeholder.

## Procedure

1. Inventory existing docs (`README*`, `docs/`, `CONTRIBUTING*`, `CHANGELOG*`, wiki links,
   inline API annotations). Update in place; avoid parallel, conflicting copies.
2. Identify the audience and the job each document does. One document, one job.
3. Gather facts from sources of truth: `package.json` scripts / `Makefile` / `justfile`,
   `.env.example` or the config schema, route definitions, `--help` output, OpenAPI spec.
4. Verify every command you document by running it on a clean checkout where feasible
   (install, dev, test, build, lint). Note the OS and versions used. If a command cannot be
   run (needs prod credentials), mark it "not verified" in your report, not in user-facing
   text as if it worked.
5. Write the README with, in order: what it is (one paragraph), requirements, quick start
   (copy-pasteable), configuration (env var names with purpose; no values), common
   commands, project structure (short), testing, deployment pointer, license.
6. Guides and runbooks: numbered steps, expected output per step, troubleshooting for the
   failures you actually hit. Runbooks include rollback and who to contact by role.
7. API docs: generate from the source of truth (OpenAPI, GraphQL schema, TypeDoc, rustdoc,
   Sphinx/mkdocstrings) rather than hand-copying; include auth, errors, pagination, and one
   real request/response example captured from a test run with secrets redacted.
8. Changelog: Keep a Changelog sections; user-facing language; link to issues/PRs.
9. Handoff report: use the orchestrator's handoff format (`agents/orchestrator.md`,
   completion criteria) and `.ship-anything/templates/agent-report.md`; include what was
   built, status per task with evidence, how to run, where it is deployed (only if verified),
   known issues, decisions, and next steps.
10. Check: links resolve (`npx markdown-link-check` or `lychee` if available), code blocks
    have language tags, no secrets or personal data, headings form a sensible outline.

## Decision rules

| Content | Where |
|---|---|
| How to install and run | README quick start |
| Deep task walk-throughs | `docs/guides/<task>.md` |
| Operating production (alerts, restarts, rollback) | `docs/runbooks/<service>.md` |
| Why a decision was made | ADR |
| What changed per version | `CHANGELOG.md` |
| Endpoint/function reference | Generated API docs |

- If docs and code disagree, the code (as run) wins; fix the doc or file a bug if the code
  is wrong.
- Planned or unverified features go in a clearly labelled "Roadmap" or are left out.
- Prefer short, accurate docs over long, speculative ones.

## Tools

- Markdown; doc generators (TypeDoc, rustdoc, Sphinx, MkDocs, Docusaurus, Redoc/Scalar for
  OpenAPI). Link checkers (lychee, markdown-link-check). Mermaid for diagrams when the
  renderer supports it.
- Optional upstream: `repomix` (see .ship-anything/registry.yaml) to pack a repo for
  overview writing when the codebase is large.

## Quality standards

- Every documented command was run, or is listed as not verified in the agent report.
- Env vars referenced by name; `.env.example` and docs list the same set.
- No secrets, tokens, internal hostnames that should be private, or customer data.
- Deployment URLs and statuses appear only when backed by a deployment record.

## Common failures

- Copying the implementer's claims ("deployed to production") into the README unverified.
- Quick starts that skip a required step (DB migration, env var) because the author's
  machine already had it.
- Duplicated docs drifting apart.
- Hand-written API references that no longer match the code.

## Outputs

- Updated README, guides, runbooks, API docs, changelog, handoff report
  (`reports/handoff-<date>.md` when the orchestrator requests it).
- Agent report listing which commands were verified and on what environment.

## Done when

- The quick start works on a clean checkout (run by you, with output recorded) or the gaps
  are listed.
- All docs in scope match current behaviour; links checked.
- Handoff report delivered when requested, with evidence-backed statuses only.
