# Contribution roadmap

SHIP ANYTHING is pre-release (0.1.0). The repository is not public yet. This roadmap says
where outside help will matter most once it is, how contributions are reviewed, and how the
project is governed and versioned.

Before contributing, read the [architecture overview](../architecture/overview.md) and the
[authoring spec](../architecture/authoring-spec.md). The validator enforces the spec.

## 1. Contribution areas

| Area | What is needed | Where | Start with |
|---|---|---|---|
| **Adapter verification** (highest priority) | Run `init --agent cursor` / `--agent gemini` in a real project, confirm the agents and skills load and delegation works, and record versions and evidence. Confirm whether Codex lists custom agents once the project is trusted | [`.ship-anything/adapters/`](../../.ship-anything/adapters/generic.md), `packages/cli/src/lib/adapters.js` | [cursor.md](../../.ship-anything/adapters/cursor.md), [gemini-cli.md](../../.ship-anything/adapters/gemini-cli.md), [codex.md](../../.ship-anything/adapters/codex.md) |
| **New adapters** | Other agents that read `AGENTS.md` / Agent Skills (document native mechanisms first, then generate files) | adapters + CLI | [generic.md](../../.ship-anything/adapters/generic.md) as the baseline |
| **New skills** | Gaps where an agent lacks depth (for example specific frameworks, data engineering, i18n, payments providers) | `skills/<name>/SKILL.md` | [Writing skills](../guides/writing-skills.md) |
| **Skill quality** | Tighter procedures, real commands, `references/` for long material, "when not to use" sections | existing `skills/` | Skills you use daily |
| **Workflows** | Field-test workflows against real projects and report gaps in task graphs, gates and failure recovery. New workflows for uncovered request types (for example data pipelines, browser extensions, CLI tools) | `workflows/*.md` | [build-anything.md](../../workflows/build-anything.md) routing table |
| **CLI features** | See the CLI backlog below | `packages/cli/` | `npm test` in `packages/cli` |
| **Examples and demos** | Real end-to-end runs published with their `.ship-anything/state/` | separate example repos, [`assets/demos/`](../../assets/demos/README.md) | [Launch strategy §1](launch-strategy.md#1-pre-launch-readiness-checklist) |
| **Benchmarks** | Reproducible method and harness (none exists yet) | `scripts/benchmark/` | Write the method doc first |
| **Docs** | Guides, troubleshooting, translations | `docs/` | [Getting started](../guides/getting-started.md) |

### CLI backlog (candidates, not commitments)

- `--gemini-agent-names=underscore` option, in case Gemini CLI rejects hyphenated agent names (noted in the Gemini adapter).
- `doctor` check that detects whether the current Codex project is trusted (once the trust mechanism is verified).
- `skills update <name>` that shows the diff between the pinned and new revision, as the [external-skill policy](../../.ship-anything/policies/external-skills.md) requires.
- `status` command: summarize `.ship-anything/state/plan.yaml` (tasks by status, blocked items).
- Optional export to `.ship-anything/state/nexus-export.json` (see the [NEXUS integration spec](../integrations/nexus-integration.md); optional and off by default).
- Windows path handling coverage in tests.

## 2. Good first issues

Each should be small, testable and reviewable in one sitting.

1. Add a `--json` example for every command to `ship-anything <cmd> --help`.
2. Add a test proving `init` followed by `rollback` leaves an empty directory unchanged.
3. Add a validator warning when a skill's `When to use` section has no "when not to use" sentence.
4. Write `references/` for one long skill so its `SKILL.md` drops under 250 lines.
5. Add a `doctor` hint when Codex is installed and `.codex/agents/` exists, pointing to the project-trust note in the Codex adapter.
6. Document a troubleshooting entry: "agents not listed in Codex" (project trust).
7. Add a link check for anchors (`#section`) in the validator, not just file targets.
8. Add a test that `skills add` refuses a skill whose name collides with an internal skill.
9. Proofread one workflow against the authoring spec headings and fix any drift.
10. Add a `CHANGELOG.md` entry template and a check that release PRs touch it.

Label scheme: `good-first-issue`, `adapter:<tool>`, `skill`, `workflow`, `cli`, `docs`,
`security`, `needs-repro`, `verification`.

## 3. Skill contribution process

1. **Propose.** Open a "skill proposal" issue with: name, category, which agents use it, the
   gap it fills, and why an existing internal or upstream skill does not cover it. If a
   strong upstream skill exists, the answer may be a registry entry instead of a new skill
   (see [Adding external skills](../guides/adding-external-skills.md)).
2. **Author.** Follow the [authoring spec](../architecture/authoring-spec.md): required
   frontmatter (`name`, `description`, `license`, `metadata.category/version/agents`) and the
   ten body headings in order. Guide: [Writing skills](../guides/writing-skills.md).
3. **Validate locally.**
   ```bash
   node scripts/validate/validate.mjs          # or: node packages/cli/bin/ship-anything.js validate
   node scripts/generate/registry.mjs          # regenerate skills.internal in registry.yaml
   node scripts/generate/registry.mjs --check  # must pass in CI
   ```
4. **Try it.** Install into a throwaway project (`init --agent <your tool> --cwd <dir>`) and
   use the skill on a real task. Attach a short excerpt of the session to the PR (no secrets, no private paths).
5. **Review.** One maintainer review for instructions-only skills. Two reviews, one of them
   security-focused, for skills with `scripts/`. Reviewers check: accuracy of commands,
   over-activation risk (description too broad), contradictions with policies, fabricated
   numbers, and instructions that bypass user permissions.
6. **License.** Internal skills are MIT, like the repository. By contributing you agree your
   contribution is MIT-licensed (inbound = outbound). Material adapted from other projects
   must have a compatible license, be attributed in the skill, and be noted in the PR.
   Content with unclear provenance is not accepted.
7. **Merge.** The registry entry is regenerated, and the skill ships in the next minor release.

Agents and workflows follow the same steps. Changes to an agent's required headings,
policies or the status model need an architecture decision recorded first (see Governance).

## 4. Governance

Current model (pre-1.0): **maintainer-led.** The founding maintainer(s) merge PRs and cut
releases. Decisions that change architecture, policies, the status model or adapter
contracts are written as short ADRs (template: [`.ship-anything/templates/architecture-decision.md`](../../.ship-anything/templates/architecture-decision.md))
and discussed in a public issue for at least 7 days before merging.

Planned evolution, once there are regular outside contributors:

- **Area owners** (CODEOWNERS) for adapters, CLI, skills by category, and security.
- **Maintainer** status for contributors with a sustained record of good reviews, granted by consensus of existing maintainers.
- Security policy and private vulnerability reporting are required before the repository goes public.
- A code of conduct (Contributor Covenant or similar) applies to all project spaces.

Non-negotiables that no contribution can change without an ADR: the
[authorization policy](../../.ship-anything/policies/authorization.md), the
[secrets policy](../../.ship-anything/policies/secrets.md), the
[external-skill policy](../../.ship-anything/policies/external-skills.md), and "no telemetry by default".

## 5. Versioning

- **Semantic Versioning** for the `ship-anything` package. Bundled content (agents, skills,
  workflows, policies) is versioned with the CLI because `update` re-applies it.
- Each skill also has `metadata.version`. Bump the minor for new procedure steps, the major
  when inputs, outputs or required tools change, and the patch for wording fixes.
- **Breaking changes** (pre-1.0 they bump the minor; post-1.0 the major): renamed or removed
  agents/skills, changed frontmatter schema, changed state file formats, changed generated
  adapter file locations. They require a CHANGELOG migration note, and `update` must handle
  them without overwriting user edits.
- Adapter verification is tracked per tool version in each adapter file ("Verified against …").
- Releases: tagged from `main`, CHANGELOG entry required, npm publish from CI with provenance,
  and only with explicit maintainer authorization.
