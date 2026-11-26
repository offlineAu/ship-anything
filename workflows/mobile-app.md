---
name: mobile-app
description: >-
  Builds iOS/Android apps (cross-platform or native): stack decision, platform-conventional
  UX, app shell, feature screens against a frozen API contract, device testing, secure
  storage review and store-ready release builds. Store submission is authorization-gated.
level: [L2, L3, L4]
required_agents: [mobile-agent, qa-agent]
optional_agents: [architecture-agent, ux-agent, backend-agent, security-agent, release-agent]
required_skills: [mobile-development, cross-platform-development, accessibility-engineering, testing-and-qa]
composes: [product-discovery, production-release]
---

# Mobile app

## Purpose

Deliver a mobile app that builds for every target platform, passes automated tests on
emulators/simulators (and devices when available), follows platform conventions, and is
packaged for store distribution without leaking secrets.

## When to use

- New iOS and/or Android apps; staff/field apps; companion apps for an existing API.
- As a client track in `fullstack-platform` (platform owns architecture and backend; only
  MA-02..MA-04, MA-06, MA-07 apply).

Do not use when: a responsive web app or PWA satisfies the brief (record that decision →
`web-app`); desktop targets → `desktop-app`.

## Inputs

- Brief, target platforms and minimum OS versions (assume current-minus-two majors if
  unspecified, recorded as assumption), API contract if a backend exists.
- Store accounts/bundle IDs (user-owned; needed only for signing and submission).

## Agents

- `mobile-agent` (required): app dir (`apps/mobile/**`, `ios/`, `android/`).
- `qa-agent` (required): e2e flows on simulators/emulators, acceptance verification.
- `architecture-agent` (optional): stack choice (React Native/Expo, Flutter, native) and
  API contract when none exists.
- `ux-agent` (optional): flows following iOS HIG / Material conventions.
- `backend-agent` (optional): endpoints the app needs when no backend exists yet.
- `security-agent` (when auth, payments, PII, or device data like location/camera).
- `release-agent` (when store builds/submission are in scope).

## Skills and tools

`mobile-development`, `cross-platform-development`, `accessibility-engineering`,
`testing-and-qa`; optional `api-development`, `security-audit`, `release-management`.
Tools: platform CLIs (`npx expo`, `eas build`, `flutter build`, `xcodebuild`,
`./gradlew assembleRelease`), e2e runners (Maestro, Detox, or integration_test).

## Task graph

```
id     agent               objective                                  depends_on       wave  owns
MA-01  architecture-agent  stack ADR, offline/sync strategy, API      -                1     docs/architecture.md, docs/adr/**, docs/api/**
                           contract → FROZEN (optional if given)
MA-02  ux-agent            flows, navigation model, tokens, platform  -                1     docs/design/**
                           conventions (optional)
MA-03  mobile-agent        app shell: navigation, theming, auth       MA-01, MA-02     2     apps/mobile/** except apps/mobile/src/features/**
                           flow, API client, secure token storage
MA-04  mobile-agent        feature screens with loading/empty/error/  MA-03            3     apps/mobile/src/features/**
                           offline states, a11y labels
MA-05  backend-agent       missing endpoints per contract (optional)  MA-01            2     services/api/**
MA-06  orchestrator        integration: app vs real API (staging or   MA-04, MA-05     4     root manifests, lockfiles
                           local), builds for each platform
MA-07  qa-agent            e2e journeys on iOS sim + Android emu;     MA-06            5     apps/mobile/e2e/**, tests/**
                           permission prompts, offline, rotation
MA-08  security-agent      secure storage, transport, permissions,    MA-06            5     docs/security/**
                           bundle secret scan (when risk flags)
MA-09  mobile-agent        fix findings with regression tests         MA-07, MA-08     6     apps/mobile/**
MA-10  release-agent       signed release builds, store metadata,     MA-09 VERIFIED   7     release/**, store metadata
                           AUTHORIZATION → submit (production-release)
```

## Parallel opportunities

- MA-01 ∥ MA-02; MA-03 ∥ MA-05 (app shell vs. server, disjoint trees) after contract freeze.
- MA-07 ∥ MA-08: QA owns test dirs, security writes `docs/security/**` only.
- Per-platform builds in MA-06 can run concurrently (separate output dirs).

## Sequential requirements

- Contract frozen before MA-03 consumes the API; app shell before feature screens (shared
  navigation and client).
- QA after integration on both platforms; security review before any release build.
- Store submission and TestFlight/Play internal track uploads are publishing actions →
  explicit user authorization per `policies/authorization.md`.

## Acceptance criteria

- App builds for every target platform from a clean checkout.
- MVP journeys pass e2e on iOS simulator and Android emulator (or the single target platform).
- Tokens stored in Keychain/Keystore-backed storage, never AsyncStorage/SharedPreferences plaintext.
- Only permissions the features need are requested, each with a usage description string.
- Interactive elements have accessibility labels; text scales with system font size without clipping.

## Quality gates

- Typecheck/lint/unit tests exit 0; release build command for each platform exits 0.
- e2e suite passes; acceptance checklist signed by qa-agent with evidence (logs, screenshots).
- No secrets in the bundle: secret scan of the built artifact and source (e.g. `gitleaks detect`)
  reports none; API keys that must ship are restricted by platform/bundle id and documented.
- security-agent (risk flags): 0 open high/critical findings.

## Deliverables

App source, e2e tests, `docs/architecture.md` (if MA-01), build instructions per platform,
`.env.example`, store listing draft (if release in scope), release report.

## Completion conditions

MVP tasks VERIFIED by qa-agent on all target platforms. A local or simulator build is never
DEPLOYED. Internal-track/TestFlight upload = DEPLOYED(preview); public store release
approval = DEPLOYED; SHIPPED only after store availability is confirmed.

## Failure recovery

| Failure | Recovery |
|---|---|
| Native build fails (pods, gradle, SDK) | Capture exact error, pin toolchain versions in docs, clean caches once; never blindly retry |
| Simulator/emulator unavailable on host | Run unit + component tests, mark e2e BLOCKED with reason; do not claim VERIFIED |
| Platform-specific bug | Fix behind platform check with test on that platform; re-run both suites |
| Signing credentials missing | BLOCKED; ask user to provide via their secret store; never commit certificates/keystores |
| Store rejection | Record reason, map to guideline, fix, re-request authorization for resubmission |
| API not ready | Build against contract mocks; integration task stays PLANNED until API is VERIFIED |
