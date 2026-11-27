# Bootstrap validation report

- **Date:** 2026-11-26
- **Scope:** phases 1–10 of the SHIP ANYTHING bootstrap
- **Repository state:** committed on branch `bootstrap/foundation`; pushed to github.com/offlineAu/ship-anything; `ship-anything@0.1.0` published to npm on 2026-11-27 by the maintainer.
- **Overall status:** foundation `TESTED`. The CLI and adapters are partially `VERIFIED` (see the compatibility table).
  Nothing here is `SHIPPED`: no release has been made and no end-to-end product run has been recorded.

## Totals

| Item | Count | Evidence |
|---|---|---|
| Files created (untracked, excluding `node_modules`) | 193 | `git ls-files --others --exclude-standard` |
| Files modified | 0 | the repo held only an empty initial commit |
| Agents | 22 / 22 required | validator: 21 sections in order, skills resolve |
| Skills | 57 (55 from the brief + `rust-modernization`, `observability`) | validator: frontmatter, 10 sections, registry entries |
| Workflows | 15 / 15 required, plus an index | validator: frontmatter references resolve, 13 sections |
| Adapters | 6 (claude-code, codex, opencode, cursor, gemini-cli, generic) | `.ship-anything/adapters/` |
| Policies / templates | 5 / 8 | `.ship-anything/policies`, `.ship-anything/templates` |
| Repositories inspected | 23 candidates + 2 GitHub Actions + `yaml` npm metadata | `docs/research/skill-candidates.md` |

## Commands run and results

| Command | Result |
|---|---|
| `node scripts/validate/validate.mjs` | ✔ valid, 0 errors, 0 warnings. 148 Markdown files, 153 internal links resolved, 185 files secret-scanned |
| `node scripts/generate/registry.mjs --check` | registry.yaml is up to date (57 internal skills) |
| `npm test` (`node --test`, Node 24.21.0) | 20 tests, 20 pass, 0 fail |
| `npm pack --dry-run` (packages/cli) | 138 files, 275.5 kB packed. Includes LICENSE, README and bundled content. **Not published** |
| `init --agent all --yes` in a scratch dir | 267 files created, 0 conflicts. A re-run reports "Already up to date" (covered by tests and CI) |
| `validate --cwd <scratch>` | 267 managed files, 0 missing, ✔ valid |
| `doctor --cwd <scratch>` | all required checks passed |
| `node scripts/benchmark/context-budget.mjs` | static volume. Startup is 4.2% of the load-everything baseline; typical tasks 9.6–11.8%. Tokens are estimated as bytes/4 (`reports/context-budget.json`) |

### What the CLI tests cover
- Dry run writes nothing. A non-TTY without `--yes` doesn't apply.
- Claude install layout and minimal frontmatter.
- Idempotency.
- Existing `AGENTS.md` and `.gitignore` are preserved, with a single managed block.
- Locally modified files and unmanaged pre-existing files become conflicts. `--force` backs them up first.
- `--agent all` native formats:
  - Codex TOML keys.
  - OpenCode `mode`.
  - Gemini import.
  - Cursor skipped when Claude is present.
- Rollback restores the original state.
- Unknown agent rejected.
- `validate` detects a missing installed file. `doctor` doesn't fail on missing optional agents.
- `agents list`.
- `skills add`:
  - quarantines and flags `pipe-to-shell`;
  - `approve` refuses scripts without `--allow-scripts`;
  - instructions-only approval installs;
  - internal-name collision is rejected.
- `skills remove` disables, and `update` doesn't reinstall.

## Compatibility results

| Agent | Version on this machine | Result | Evidence |
|---|---|---|---|
| Claude Code | 2.1.332 | ✔ VERIFIED: all 22 subagents and the installed skills discovered | `claude -p` in the scratch project listed 22 agents plus `security-audit` and `threejs-production` |
| OpenCode | 1.19.5 | ✔ VERIFIED: 22 agents loaded (orchestrator primary, 21 subagents) | `opencode agent list` |
| Codex CLI | 0.160.1 | ◐ PARTIAL: skills discovered ✔. Agent TOML parses with exact keys ✔. Custom agents **not listed** ✖ | `codex exec --sandbox read-only`. Python 3.12 `tomllib`. The likely cause is that an untrusted temp project skips `.codex/`; this is unverified |
| Cursor | not installed | UNTESTED (docs only) | `.ship-anything/adapters/cursor.md` |
| Gemini CLI | not installed | UNTESTED (docs only) | `.ship-anything/adapters/gemini-cli.md` |

## Upstream integrations

The classifications below are recorded in `.ship-anything/registry.yaml`. Every external entry is
`enabled: false, pin: null`, so none is active until a user reviews and approves it.

| Verdict | Repositories |
|---|---|
| ADOPT (recommend; user installs) | anthropics/skills (frontend-design, skill-creator), pbakaus/impeccable (hooks and live mode off), emilkowalski/skills (subset), yamadashy/repomix, vercel-labs/skills |
| ADAPT | VisualxIntelligence/motion-tools-and-skills (selected skills, with attribution) |
| OPTIONAL | nextlevelbuilder/ui-ux-pro-max-skill, Leonxlnx/taste-skill, remotion-dev/skills (Remotion License), rtk-ai/rtk, thedotmack/claude-mem, headroomlabs-ai/headroom, Egonex-AI/Understand-Anything, morluto/rea, mco-org/mco, anthropic webapp-testing |
| REFERENCE | erkamyaman/rust-anything, Speedrunlab/reverse-engineer-anything, mksglu/context-mode (ELv2, not OSI), CodeAlive-AI/pragmatic-orchestration, dsifry/metaswarm, pvhuwung/dolly, JaimeJunr/claude-code-frontend-skills |
| REJECT | nicohodt/claude-code-ui-ux-skill: an unattributed copy of ui-ux-pro-max |

No third-party skill text was copied into this repository.

## Dependencies

- **Runtime:** Node.js ≥ 20 and git. The CLI has one dependency: `yaml@2.9.1` (ISC, zero dependencies).
- **CI:** `actions/checkout@v7.0.1` and `actions/setup-node@v7.1.0`, both pinned to commit SHAs.
- **Optional, detected by `doctor`, never auto-installed:** ffmpeg, ffprobe, Blender, Docker, Python 3, gh, rtk.

## Security findings

- **Validator secret scan:** 0 hits.
- **CLI installs no hooks** and changes no agent permission settings.
- **Upstream risks documented in the registry:**
  - Impeccable's live mode can launch codex or claude with approvals bypassed. It should stay off.
  - The ui-ux-pro-max demo `settings.json` enables all MCP servers and broad home-directory reads. Don't copy it.
  - Telemetry is on by default in claude-mem, headroom and vercel-labs/skills.
  - rtk's BUSL-1.1 components can't be redistributed.
  - context-mode is under the Elastic License 2.0.
  - Remotion's skills need a company license for organizations of more than three people.
- **Residual risk:**
  - Gates and authorization are enforced by instructions plus the host agent's permission prompts, not by code.
  - The static skill reviewer is regex-based and only a triage aid.
  - See `docs/security-model.md`.

## Known limitations

1. The Cursor and Gemini CLI adapters are untested. Gemini acceptance of hyphenated agent names is unverified.
2. Codex custom agents weren't listed in an untrusted project. The project-trust hypothesis is unverified.
3. No end-to-end product run has been recorded. Workflows and agents are reviewed instructions, not field-tested
   procedures. The restaurant example is labelled illustrative.
4. Token benchmark covers static instruction volume only. Model-usage savings are unmeasured, so none are claimed.
5. Running `skills add`/`approve` in a project changes `registry.yaml`, and `update` then treats it as user-modified
   and skips it. New internal skills from a CLI upgrade won't be registered there until the user merges the file.
6. When Claude and OpenCode (or Cursor) are installed together, the same skills exist in both `.claude/skills` and
   `.agents/skills`. Some agents may list duplicates; de-duplication behaviour is unverified.
7. CI matrix (Windows, macOS, Linux × Node 20/22/24) has not run: GitHub refused to start jobs (account billing lock).
   Local runs covered macOS with Node 20.20.2, 22.23.5 and 24.21.0 (tests, validator, tarball install). Windows and Linux are unverified.
8. Node's default test discovery also loads `test/helpers.js` as a trivially passing test file. This is harmless.
9. Publishing is manual (`docs/guides/releasing.md`); there is no CI release job or npm provenance yet.

## Remaining work

- Verify the Cursor and Gemini adapters on real installs, and confirm Codex project-trust behaviour.
- Run one real end-to-end L2 and L3 request per verified agent. Record evidence and demos.
- Measure model-token usage with the method in `docs/token-efficiency.md`.
- Push the repository and let CI run the cross-platform matrix (needs authorization).
- Pin the recommended upstream skills to reviewed commits after reading their files.
- Produce the brand assets: logo, hero image and screenshots.

## Recommended next phase

**Phase 11: field validation.** Before any release, install into a real scratch project with Claude Code
(verified adapter) and run one L2 request, such as "add a contact form with server validation". Use the
`web-app` workflow and record the plan, the reports and the gate evidence. That will show whether the
instructions hold up in practice, which none of the tests above can.
