# Default file ownership

The orchestrator assigns concrete globs per task; these are defaults for a typical repo.
Two concurrently running tasks may never own overlapping globs.

| Area | Default owner |
|---|---|
| `package.json`, lockfiles, root configs, CI files, route/registry index files | orchestrator (integration checkpoints only) |
| `docs/product-brief.md`, acceptance criteria | product-director |
| `docs/architecture.md`, `docs/adr/**`, API contracts (`openapi.*`, `schema.graphql`, `*.proto`) | architecture-agent |
| `docs/design-direction.md`, design tokens | ux-agent |
| UI components, pages, client state, styles | frontend-agent |
| Animations/transition modules, motion tokens | motion-agent (coordinated with frontend-agent) |
| 3D scenes (`**/three/**`, `**/scene/**`) | threejs-agent |
| `.blend` files, exported `*.glb/*.gltf` | blender-agent |
| Remotion projects (`video/**`, `remotion/**`) | video-agent |
| Server code, services, API handlers, auth logic | backend-agent |
| Schemas, migrations, seeds, ORM models | database-agent |
| Provider SDK wrappers, webhooks (`**/integrations/**`, `**/webhooks/**`) | integration-agent |
| Mobile app dir (`apps/mobile/**`, `ios/`, `android/`) | mobile-agent |
| Desktop shell (`src-tauri/**`, `electron/**`) | desktop-agent |
| Dockerfiles, IaC, deploy configs, CI/CD pipelines | infrastructure-agent |
| Health checks, logging/metrics/tracing config | monitoring-agent |
| Test files (e2e, integration), test fixtures | qa-agent (unit tests stay with the implementer) |
| `SECURITY.md`, security fixes (by delegation) | security-agent |
| README, guides, CHANGELOG, API docs | documentation-agent |
| Release notes, version bumps, tags (local) | release-agent |
| `CHANGELOG.md` | release-agent writes the release entry; documentation-agent edits wording (sequential, never concurrent) |
| `docs/research/**` | research-agent |
| `docs/design/**` | ux-agent |
| `docs/integrations/**` | integration-agent |
| `docs/security/**` | security-agent |
| `docs/runbooks/**`, `src/observability/**` | monitoring-agent |
| `docs/guides/**` | documentation-agent |
| `src/motion/**` | motion-agent |
| `perf/**` (benchmarks, load-test scripts) | performance-agent |
| `assets/3d/scripts/**` (Blender Python) | blender-agent |
| `playwright.config.*` and other test-runner configs | qa-agent (orchestrator approves changes, since they affect every task) |

Conflict protocol: if an agent must touch a file it does not own, it stops, records the
needed change in its report under "Issues", and the orchestrator either re-assigns
ownership or performs the change at the next integration checkpoint.
