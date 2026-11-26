---
name: cross-platform-development
description: >-
  Plans and implements products that target several platforms (web, iOS, Android, macOS,
  Windows, Linux) from shared code: decides what to share (UI, logic, contracts only) and
  picks an approach (Flutter, React Native + Expo + web, Tauri v2, Kotlin Multiplatform,
  Capacitor, PWA, or separate native apps), structures monorepos and platform adapters, and
  verifies parity with a cross-platform test matrix. Use when one product must ship on more
  than one platform family.
license: MIT
metadata:
  category: software-engineering
  version: "0.1.0"
  agents: [architecture-agent, mobile-agent, desktop-agent]
---

# Cross-platform development

## Purpose

Decide deliberately how much code to share across platforms, then build so shared code
stays platform-agnostic and platform code stays thin. Prove parity on every claimed
platform instead of assuming it.

## When to use

- A product must ship on two or more of: web, iOS, Android, desktop.
- Deciding between one shared-UI codebase, shared logic with native UI, or separate apps.
- Adding a new platform to an existing app (e.g. desktop for a Flutter mobile app, mobile
  for a web app).

Do not use when:
- Only one platform is in scope. Use `mobile-development`, `desktop-development` or
  `frontend-development`.
- "Cross-platform" only means responsive web across screen sizes. Use `responsive-design`.
- The task is implementing a feature inside an already-chosen setup with no sharing
  question. Use the platform skill directly.

## Inputs

- Platform list with priority order and minimum OS/browser versions.
- Required device/OS capabilities per platform (camera, BLE, background sync, file system,
  widgets, tray).
- Team skills, existing codebases, release cadence, offline needs, design direction
  (native look vs brand-uniform look).

## Procedure

1. **Build a capability matrix:** rows = features, columns = platforms, cells = needed /
   not needed / platform-specific behaviour. Mark features that depend on native APIs.
2. **Decide the sharing level:**
   - *Shared UI + logic* (Flutter, React Native + Expo with web, Tauri v2, Capacitor):
     fastest parity, less native feel.
   - *Shared logic, native UI* (Kotlin Multiplatform, Rust core via UniFFI, shared TS domain
     package): native UX, higher UI cost.
   - *Shared contracts only* (OpenAPI/proto types, design tokens): independent apps,
     maximum native fidelity.
3. **Pick the approach** with `## Decision rules` and record it in an ADR
   (`.ship-anything/templates/architecture-decision.md`, logged in
   `.ship-anything/state/decisions.md`). Include the rejected options and the capability
   gaps each option leaves.
4. **Structure the repo.** Shared packages (`packages/core`, `packages/ui`, `packages/api-client`)
   have no platform imports. Platform apps (`apps/web`, `apps/mobile`, `apps/desktop`)
   hold only platform shells and adapters. Use the existing workspace tool (pnpm/npm/yarn
   workspaces, Turborepo, Nx, Melos, Gradle). Root configs and lockfiles are shared files
   owned by the orchestrator (`.ship-anything/policies/file-ownership.md`).
5. **Isolate platform differences** behind interfaces: storage, secure storage,
   notifications, file access, deep links, payments. Use platform-specific files
   (`*.ios.tsx`/`*.web.tsx`, Dart conditional imports, KMP `expect`/`actual`) rather than
   runtime `if (platform)` branches spread through shared code.
6. **Share design tokens** from one source (`DESIGN.md` per
   `.ship-anything/templates/design-direction.md`), and respect platform conventions where
   they matter: navigation patterns, back behaviour, menus, keyboard shortcuts.
7. **Delegate** platform-specific implementation to `mobile-development` and
   `desktop-development`, including signing, store requirements, permissions and auto-update.
8. **CI per platform.** Each platform gets a build and test job. Shared packages are tested
   once, independently of any shell.
9. **Verify parity** with the matrix below. Record per-platform evidence (screenshots, E2E
   output). A platform without a run is "not verified", never "should work".

## Decision rules

| Situation | Prefer |
|---|---|
| Mobile-first, custom brand UI, desktop/web secondary | Flutter |
| React/TS team, web + iOS + Android | React Native + Expo (Expo Router for web), shared TS packages |
| Existing web app, need store presence with modest native API use | Capacitor (or PWA if store presence is not required) |
| Web UI, desktop first, mobile later, small binaries | Tauri v2 |
| Native UI on iOS/Android is non-negotiable, shared business logic | Kotlin Multiplatform (+ Compose Multiplatform if UI sharing is acceptable) |
| Performance-critical shared engine (sync, crypto, media) | Rust core + UniFFI/FFI bindings, native or framework UI on top |
| Platforms differ greatly in UX and the team has native expertise | Separate native apps sharing only API contracts and tokens |

- Keep the existing approach unless an ADR shows a capability gap or cost that justifies
  migration. Prefer incremental migration (one screen or module at a time) over a rewrite.
- If a must-have capability is unsupported or plugin-only and unmaintained on a target
  platform, that rules out the option, or the gap goes in the ADR with a native-module
  plan.
- Web targets need SEO and crawlable HTML only for public content. App-shell web builds
  from Flutter or React Native are acceptable for authenticated apps.

**Cross-platform parity matrix (minimum):**

| Check | Every claimed platform |
|---|---|
| Core flows (per acceptance criteria) | E2E or scripted manual run with screenshot |
| Offline/poor network behaviour | Same policy, verified |
| Auth and deep links | Login, logout, link opens correct screen |
| Accessibility | Screen reader + font scaling/zoom + keyboard (desktop/web) |
| Install/update path | Store/TestFlight build, installer or web deploy, prepared but not published without authorization |

## Tools

- Flutter/Melos, Expo/EAS, Capacitor CLI, Tauri CLI, Kotlin Multiplatform Gradle plugin,
  UniFFI, and Turborepo/Nx/pnpm workspaces.
- Platform test tools from `mobile-development` and `desktop-development`. Playwright for web.
- Related skills: `mobile-development`, `desktop-development`, `frontend-development`,
  `architecture-planning`, `rust-modernization`.

## Quality standards

- ADR exists, with the capability matrix and rejected options.
- Shared packages build and test without any platform shell. No platform imports leak into
  shared code.
- Every claimed platform has a CI build and recorded parity evidence. Gaps are listed
  explicitly.
- Publishing to any store or channel follows `.ship-anything/policies/authorization.md`.

## Common failures

- Choosing by framework popularity instead of the capability matrix, then discovering a
  missing native API late.
- `Platform.OS` checks scattered through shared code.
- Forcing one platform's conventions on another (iOS-style navigation on Android, no
  keyboard support on desktop).
- Treating "it compiles for web" as web support.
- Declaring parity after testing one platform.

## Outputs

- Capability matrix and ADR, workspace structure, shared packages and platform adapters,
  and per-platform CI config.
- Parity matrix with evidence per platform. Agent report.

## Done when

- Sharing level and approach are decided in an accepted ADR.
- Shared code builds and tests independently. Each platform shell builds.
- Parity matrix is filled with evidence or explicit "not verified" reasons.
- Report filed with status no higher than TESTED.
