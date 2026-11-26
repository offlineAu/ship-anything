# Adapter: Generic (any Agent Skills–compatible agent)

For agents not listed above (and as the baseline every adapter builds on).

| Capability | Assumption | What `init --agent generic` writes |
|---|---|---|
| Project instructions | the agent reads `AGENTS.md` (the de-facto cross-agent convention) | `AGENTS.md` managed block |
| Skill discovery | `.agents/skills/<name>/SKILL.md` (the shared directory used by vercel-labs/skills for most agents) | copies skills to `.agents/skills/` |
| Agent definitions | no native format assumed | canonical copies in `.ship-anything/agents/*.md` |
| Subagents / delegation | not assumed | single-session mode |
| Hooks / permissions / memory | not assumed | none; state in `.ship-anything/state/` |

## Single-session mode (the universal fallback)

1. The session acts as orchestrator and writes `state/plan.yaml`.
2. For each task, it loads `.ship-anything/agents/<agent>.md` + the listed skills, works the contract, writes
   `state/tasks/<id>.md`, then **unloads** that context mentally (summarise, don't carry details forward).
3. Verification is done as a separate, fresh step that re-runs every validation command; record
   "verified in single-session mode" in the report.
4. If the agent cannot read skill directories, point it at the file explicitly: "Read `.agents/skills/<name>/SKILL.md`".
