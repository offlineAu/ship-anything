---
name: desktop-app
description: >-
  Builds Windows/macOS/Linux desktop apps (Tauri, Electron or native): shell and IPC
  contract first, UI and native layer in parallel, hardened IPC, packaged installers,
  signing/notarization and auto-update. Signing and publishing are authorization-gated.
level: [L2, L3]
required_agents: [desktop-agent, qa-agent]
optional_agents: [architecture-agent, ux-agent, frontend-agent, security-agent, performance-agent, release-agent]
required_skills: [desktop-development, cross-platform-development, testing-and-qa]
composes: [product-discovery, production-release]
---

# Desktop app

## Purpose

Ship an installable desktop app whose native layer and UI communicate through a narrow,
typed, validated IPC surface, packaged for each target OS with a tested update path.

## When to use

- Offline-capable tools, file-system-heavy apps, tray/menu-bar utilities, editors.
- Wrapping an existing web UI as a desktop app (frontend reuse, desktop-agent owns shell).
- As a client track in `fullstack-platform` (platform owns backend and API contract).

Do not use when: browser delivery suffices (record the decision → `web-app`); CLI tools
(L1/L2 via `improve-existing-project` or direct orchestrator work).

## Inputs

- Brief, target OSes and architectures, offline/file-access needs, update channel.
- Signing identities (user-owned: Apple Developer ID, Windows code-signing cert) if release in scope.

## Agents

- `desktop-agent` (required): shell, native commands, IPC handlers, packaging
  (`src-tauri/**` or `electron/**`).
- `qa-agent` (required): e2e on each target OS available, install/upgrade checks.
- `architecture-agent` (optional): Tauri vs Electron vs native ADR, IPC contract.
- `frontend-agent` (optional): renderer UI when non-trivial (`src/**` UI tree).
- `ux-agent` (optional), `security-agent` (file system, shell exec, auto-update, auth),
  `performance-agent` (startup time, memory targets stated), `release-agent` (distribution).

## Skills and tools

`desktop-development`, `cross-platform-development`, `testing-and-qa`; optional
`frontend-development`, `security-audit`, `performance-optimization`, `rust-modernization`
(Tauri native hot paths only when measured), `release-management`.
Tools: `npm run tauri build` / `cargo tauri build`, `electron-builder`, Playwright
(Electron) or WebDriver (Tauri), OS packaging tools.

## Task graph

```
id     agent               objective                                   depends_on       wave  owns
DA-01  architecture-agent  framework ADR; IPC contract (commands,      -                1     docs/architecture.md, docs/adr/**, docs/api/ipc.*
                           payload schemas, permissions) → FROZEN
DA-02  ux-agent            windows, menus, shortcuts, OS conventions   -                1     docs/design/**
                           (optional)
DA-03  desktop-agent       shell, window mgmt, IPC handlers with       DA-01            2     src-tauri/** or electron/**
                           input validation, capability allowlist
DA-04  frontend-agent      renderer UI calling typed IPC client        DA-01, DA-02     2     src/** (renderer only)
DA-05  orchestrator        integration: dev run, build per OS          DA-03, DA-04     3     root manifests, lockfiles, configs
                           available on host
DA-06  qa-agent            e2e journeys; install, launch, upgrade      DA-05            4     tests/**
                           from previous build; uninstall clean
DA-07  security-agent      IPC surface, CSP, nodeIntegration off /     DA-05            4     docs/security/**
                           Tauri capabilities, update signature check
DA-08  performance-agent   cold start, idle memory vs targets          DA-05            4     perf/**
                           (optional)
DA-09  desktop-agent /     fix findings with regression tests          DA-06..DA-08     5     per finding
       frontend-agent
DA-10  release-agent       signed/notarized installers, update feed,   DA-09 VERIFIED   6     release/**
                           AUTHORIZATION → publish (production-release)
```

## Parallel opportunities

- DA-01 ∥ DA-02. DA-03 ∥ DA-04 after the IPC contract is frozen (native tree vs renderer tree).
- DA-06 ∥ DA-07 ∥ DA-08 (read-only on app code, disjoint owned dirs).
- Per-OS builds in parallel on separate CI runners; never share an output directory.

## Sequential requirements

- IPC contract frozen before native handlers and UI consume it.
- Security review of IPC and update mechanism before any signed build.
- Signing uses user-provided credentials (credential action → authorization); publishing
  installers or update feeds → explicit authorization.

## Acceptance criteria

- App installs, launches, performs MVP journeys and uninstalls cleanly on each target OS
  that was actually tested (untested OSes listed explicitly).
- Every IPC command validates its payload against the contract; unknown commands rejected.
- Renderer cannot reach Node/OS APIs except through the allowlisted IPC surface.
- Upgrade from the previous build preserves user data/settings.

## Quality gates

- Typecheck/lint/unit tests (including native-side tests, e.g. `cargo test`) exit 0.
- Package command exits 0 per target and produces the expected artifact type.
- qa-agent e2e passes; acceptance checklist signed with evidence per OS.
- security-agent: Electron `contextIsolation: true`, `nodeIntegration: false`, sandbox on;
  or Tauri capabilities scoped to required commands/paths; 0 open high/critical findings.
- Performance targets (if stated in the brief) measured on a named machine/config.

## Deliverables

Source, installers (local artifacts), `docs/architecture.md`, IPC contract, tests, build and
signing guide (secret names only), release report if distributed.

## Completion conditions

MVP tasks VERIFIED by qa-agent per tested OS. Local installers are build artifacts, not
deployments. Publishing to an update feed/store → DEPLOYED; SHIPPED once download and
update path are verified from the published location.

## Failure recovery

| Failure | Recovery |
|---|---|
| Build only possible for host OS | Configure CI matrix for other OSes; mark their verification BLOCKED until CI runs |
| Notarization/signing fails | Record exact tool error; check entitlements/identity; credentials never logged |
| IPC contract change needed | architecture-agent versions the contract; both sides re-verified |
| Renderer needs privileged API | Add a narrow IPC command with validation; never enable broad Node access |
| Auto-update fails on upgrade test | Block release; fix and re-run install-previous → upgrade test |
| Startup too slow | performance-agent profiles; lazy-load modules; re-measure on same machine |
