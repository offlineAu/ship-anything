---
name: mobile-development
description: >-
  Builds iOS and Android apps: picks Flutter, React Native + Expo, SwiftUI or Kotlin +
  Jetpack Compose from requirements, implements navigation, state, offline storage and sync,
  runtime permissions, push notifications, deep links, signing and store-compliance prep,
  and verifies on a device/simulator test matrix. Use for native or cross-platform mobile app
  work. Store submission always requires user authorization.
license: MIT
metadata:
  category: software-engineering
  version: "0.1.0"
  agents: [mobile-agent]
---

# Mobile development

## Purpose

Ship mobile apps that work on real devices, offline and online, respect platform
conventions and permissions, and are ready for store review. Store submission happens only
when the user explicitly asks for it.

## When to use

- Creating or changing an iOS/Android app: screens, navigation, state, offline data, push,
  deep links, background tasks, in-app purchases.
- Choosing a mobile framework. Preparing signing, build configs or store metadata.

Do not use when:
- The deliverable is a responsive website or PWA. Use `frontend-development` and
  `responsive-design`.
- The main question is sharing code across mobile, desktop and web. Use
  `cross-platform-development` first.
- Building the backend the app calls. Use `backend-development` and `api-development`.

## Inputs

- Task contract, target platforms and minimum OS versions, device classes (phone, tablet).
- Design direction (`.ship-anything/templates/design-direction.md`), API contract, offline
  requirements.
- Existing project: `pubspec.yaml`, `package.json` + `app.json`/`app.config.*`, Xcode
  project/`Package.swift`, Gradle files.
- Availability of Xcode (macOS only), Android SDK, simulators/emulators and physical
  devices in this environment.

## Procedure

1. **Detect the toolchain** and confirm what can actually run here. iOS builds need macOS +
   Xcode. Use `flutter doctor`, `npx expo-doctor`, `xcodebuild -version` and
   `sdkmanager --list_installed` as relevant. Record what is unavailable. That limits
   verification and must be reported.
2. **Baseline:** install from the lockfile, then analyze/lint and run tests (`flutter analyze
   && flutter test`, `npm test`, `xcodebuild test -scheme <s> -destination '<sim>'`,
   `./gradlew testDebugUnitTest`).
3. **Choose the framework (new apps only)** with `## Decision rules`. Write an ADR
   (`.ship-anything/templates/architecture-decision.md`).
4. **Architecture.** Separate UI, state (Riverpod/Bloc, Zustand/Redux/TanStack Query,
   Observation/`@Observable`, ViewModel + StateFlow) and data/repository layers. Use the
   platform-idiomatic navigation (go_router, Expo Router/React Navigation,
   `NavigationStack`, Navigation Compose).
5. **Offline.** Decide the policy per feature: read-cache, offline-write queue, or full sync.
   Use local storage that fits: SQLite/Drift/Room/SwiftData/Core Data,
   expo-sqlite/WatermelonDB, or MMKV for small key-value data. Handle conflict resolution
   and show sync status.
6. **Secrets and tokens.** Store tokens in Keychain/Keystore (flutter_secure_storage,
   expo-secure-store). Never embed server secrets in the app binary. Anything shipped is
   extractable.
7. **Permissions.** Request at the moment of use with a pre-prompt explaining why. Handle
   denied and "don't ask again" states. Declare purpose strings (`NS*UsageDescription`) and
   Android manifest permissions for exactly what is used.
8. **Platform features.** For push (APNs/FCM), deep/universal links (`apple-app-site-association`,
   `assetlinks.json`), background work and in-app purchases (StoreKit/Play Billing; store
   rules require them for digital goods), follow the platform docs.
9. **Accessibility.** Support Dynamic Type/font scaling, screen readers (VoiceOver/TalkBack
   labels) and touch targets of at least 44×44 pt (iOS HIG) / 48×48 dp (Material).
10. **Test matrix.** Run unit and widget/component tests, then integration/E2E (Flutter
    integration_test, Maestro, Detox, XCUITest, Espresso) on the matrix below. Capture
    screenshots per platform as evidence.
11. **Signing and release prep.** Configure bundle IDs, versionName/versionCode and
    CFBundleVersion, app icons, splash screen, and privacy manifest (`PrivacyInfo.xcprivacy`)
    / Play Data safety answers. Use EAS/Fastlane/Codemagic or Xcode/Gradle for release
    builds. Credentials stay in the platform keychain or CI secrets, referenced by name.
12. **Stop before submission.** TestFlight upload, Play Console upload, store submission and
    OTA update publishing are publishing actions. They need explicit user authorization
    (`.ship-anything/policies/authorization.md`).

## Decision rules

| Requirement | Prefer |
|---|---|
| One codebase, custom branded UI, high-performance rendering, iOS + Android (+ desktop/web later) | Flutter |
| Team knows React/TS, wants to share logic with a web app, OTA updates | React Native + Expo (prebuild/dev client for native modules) |
| iOS-only, deep Apple platform integration (widgets, watchOS, Live Activities) | SwiftUI (UIKit interop where needed) |
| Android-only or Android-first with deep platform features | Kotlin + Jetpack Compose |
| Native UI on both but shared business logic | Kotlin Multiplatform + SwiftUI/Compose (see `cross-platform-development`) |
| Content app with minimal device APIs | Consider a PWA first. Record why native is needed |

**Platform test matrix (minimum):**

| Dimension | Cover |
|---|---|
| OS | Oldest supported + latest for iOS and Android |
| Form factor | Small phone, large phone, tablet if supported |
| Settings | Dark mode, largest font size, RTL if localized, reduced motion |
| Network | Offline, slow/flaky, airplane-mode toggle mid-action |
| Permissions | Granted, denied, revoked while app backgrounded |
| Lifecycle | Background/foreground, process death and restore, cold start via deep link |

- Mark any matrix cell not run (e.g. no macOS → no iOS run) as "not run" with the reason.
  Never infer it passed.
- OTA updates (Expo Updates, Shorebird, CodePush successors) may only change what store
  policies allow (no new native capabilities or changed app purpose).

## Tools

- Flutter SDK, Expo CLI/EAS, Xcode/`xcodebuild`/`xcrun simctl`, Android Studio/Gradle/`adb`/emulator.
- Maestro, Detox, XCUITest, Espresso, Flutter integration_test. Fastlane for signing/build
  automation.
- Optional upstream `emil-kowalski-skills` (`mobile-native` subset) for native-feel
  interaction details (see `.ship-anything/registry.yaml`).
- Related skills: `cross-platform-development`, `accessibility-engineering`, `responsive-design`,
  `api-development`.

## Quality standards

- Analyze/lint and tests pass. Release build compiles for each supported platform that
  can be built here.
- No secrets in the binary. Tokens are kept in secure storage. Permissions are minimal and
  explained.
- App is usable offline per the stated policy and recovers sync without data loss.
- Accessibility: screen reader labels, font scaling with no clipped text, platform touch
  target sizes.
- Store metadata prerequisites (privacy manifest, data-safety answers, purpose strings) are
  present.

## Common failures

- Testing only on the newest simulator. Older OS or small screens break.
- Requesting all permissions on first launch, leading to rejections and denials.
- Missing purpose strings or privacy manifest entries, causing review rejection.
- Storing tokens in AsyncStorage or SharedPreferences in plaintext.
- Assuming network availability: spinners that never resolve offline.
- Claiming "works on iOS" from an Android-only run, or uploading to TestFlight without
  authorization.

## Outputs

- App source, tests, platform configs, signing config referencing credentials by name, and
  store-metadata checklist.
- Test-matrix table (run / not run + reason) with screenshots per platform.
- Agent report. ADR for framework choice.

## Done when

- Acceptance criteria demonstrated on simulator/emulator or device with screenshots or E2E
  output.
- Test matrix filled honestly. Release build compiles where the toolchain exists.
- Release prep documented. No submission or OTA publish performed without explicit
  authorization.
- Report filed with status no higher than TESTED.
