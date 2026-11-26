# Workflows

Workflows are task-graph recipes the orchestrator executes. Each file has YAML frontmatter
(`name`, `description`, `level`, `required_agents`, `optional_agents`, `required_skills`,
`composes`) and the 13 sections defined in `docs/architecture/authoring-spec.md`.

| Workflow | Level | Purpose | Composes |
|---|---|---|---|
| [build-anything](build-anything.md) | L1–L4 | Master router: deliverables → level → composed workflows → merged waves | all others |
| [product-discovery](product-discovery.md) | L2–L4 | Idea → product brief, MVP cut, testable acceptance criteria | — |
| [website](website.md) | L1–L3 | Marketing/content/landing sites with a11y, SEO, Core Web Vitals | production-release |
| [web-app](web-app.md) | L2–L3 | Single web client + API + data; contract-first parallel FE/BE | product-discovery, security-remediation, production-release |
| [mobile-app](mobile-app.md) | L2–L4 | iOS/Android apps; device testing; gated store submission | product-discovery, production-release |
| [desktop-app](desktop-app.md) | L2–L3 | Tauri/Electron/native apps; hardened IPC; signed installers | product-discovery, production-release |
| [fullstack-platform](fullstack-platform.md) | L3–L4 | Shared backend, several clients, real-time, payments, authz matrix | product-discovery, web-app, mobile-app, desktop-app, security-remediation, production-release |
| [3d-product](3d-product.md) | L2–L4 | 3D viewers/configurators, optimised GLB assets with provenance | — |
| [video-production](video-production.md) | L2–L4 | Remotion videos rendered and checked against a delivery spec | 3d-product |
| [clone-existing-product](clone-existing-product.md) | L2–L4 | Original product from public UX/feature patterns; legal gate first | product-discovery, website, web-app, mobile-app, fullstack-platform, production-release |
| [reverse-engineer](reverse-engineer.md) | L2–L3 | Authorized analysis → system map, behavioural spec, characterization tests | — |
| [improve-existing-project](improve-existing-project.md) | L1–L3 | Baseline-guarded changes in an existing repo | security-remediation, legacy-modernization, production-release |
| [legacy-modernization](legacy-modernization.md) | L3–L4 | Strangler-fig migration slice by slice; Rust only for measured bottlenecks | reverse-engineer, security-remediation, production-release |
| [security-remediation](security-remediation.md) | L2–L3 | Reproduce, fix, regression-test and re-verify security findings | production-release |
| [production-release](production-release.md) | L2–L4 | Readiness → staging → explicit authorization → prod → verify | — |

## How the orchestrator composes workflows

1. **Route.** Every new request enters `build-anything`: score the request with the
   rubric in `skills/parallel-agent-coordination/SKILL.md`, map each deliverable to a
   workflow via its routing table, and record level + reasoning in `decisions.md`.
2. **Compose.** `composes` lists the workflows a workflow *may* pull in; only those the
   request needs are included. `product-discovery` goes first when no brief exists on L3+;
   `production-release` goes last and appears once.
3. **Merge.** Task graphs are merged into one `.ship-anything/state/plan.yaml`. Shared tasks
   (brief, architecture/contracts, design direction, QA gate, security gate, release) exist
   once; when `fullstack-platform` is present it owns backend and contracts and client
   workflows contribute UI tracks only. Task ids keep their workflow prefix (FP-, WA-, MA-…).
4. **Wave.** A wave contains tasks whose `depends_on` are satisfied and whose `owns` globs
   are pairwise disjoint, capped at `parallelism.max_agents` (default 4). An integration
   checkpoint (install, typecheck, lint, tests, boot, smoke) runs after every wave.
5. **Gate.** QA after integration → security (risk flags) → performance (targets) →
   release. Statuses advance only with evidence per `.ship-anything/policies/status-model.md`;
   production actions require explicit user authorization per
   `.ship-anything/policies/authorization.md`.
6. **Fallback.** Hosts without subagents execute the same waves sequentially in one session,
   still writing contracts and reports, and mark verification "single-session mode".

Composition is acyclic: a workflow never composes one that (transitively) composes it.
