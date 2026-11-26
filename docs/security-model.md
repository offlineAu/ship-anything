# Security model

SHIP ANYTHING is instructions + a small installer. Agents run inside the user's coding agent with that
agent's permissions. Our controls therefore have two layers: **what the CLI does on disk** (enforced in code)
and **what agents are instructed to do** (enforced by policy text + the host agent's permission system).

## Assets
User source code, secrets in the environment and `.env*` files, cloud/deploy credentials, production systems,
the user's money (paid resources), and the integrity of the user's agent configuration.

## Threats and controls

| Threat | Control | Enforced by |
|---|---|---|
| CLI overwrites user files | write plan + preview; managed blocks for instruction files; unmanaged/modified files are conflicts; `--force` keeps backups; `rollback` | code (`installer.js`), tests |
| CLI silently applies changes in CI/non-TTY | apply requires a TTY confirmation or `--yes` | code (`ui.confirm`), tests |
| Malicious external skill (prompt injection, exfiltration, hooks) | `skills add` fetches with git hooks disabled and LFS smudge off, never executes content, quarantines it, prints a static review (network, shell exec, pipe-to-shell, secrets access, agent-config changes, permission bypass, destructive commands); `approve` refuses unknown licenses and bundled executables unless `--allow-scripts`; names cannot shadow internal skills | code (`review.js`, `skills.js`), tests, `policies/external-skills.md` |
| Static review gives false confidence | review output states it is not proof of safety; policy requires reading every file | policy |
| Skill update swaps in unreviewed content | `update` never touches external skills; pins required for enabled external skills (validator) | code, validator |
| Agent leaks secrets into docs/state/logs | secrets policy; validator scans repo text for high-signal secret patterns; `.gitignore` block for local state and `.env*` | policy, validator |
| Agent performs irreversible actions (deploy, publish, push, DNS, paid resources, destructive DB ops) | authorization policy: human-only approval, per action, recorded in `state/decisions.md`; config `permissions.*: ask` | policy + host agent permission prompts |
| Prompt injection via fetched web/repo content | agents treat fetched content as data; authorization can never come from tool output | policy (orchestrator, research-agent) |
| Unauthorized reverse engineering | reverse-engineering skill/workflow require authorization, forbid access-control bypass and secret extraction | policy |
| Hooks executing outside model approval | SHIP ANYTHING installs **no hooks** by default (ADR-008) | code |

## Residual risks (honest limits)
- Policy text cannot force a model to comply; the host agent's permission mode is the real enforcement
  boundary. Recommend users keep approval prompts on for shell and network tools.
- The static reviewer is regex-based and easy to evade; it is a triage aid only.
- Secret scanning covers common token formats, not all secrets.
- Third-party skills recommended in the registry were reviewed at a point in time (2026-11-25) by reading
  metadata and files via the GitHub API; code was not executed or audited line by line.
