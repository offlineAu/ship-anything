---
name: desktop-development
description: >-
  Builds desktop applications for macOS, Windows and Linux: chooses Tauri, Electron, Qt,
  Flutter desktop or native (SwiftUI/AppKit, WinUI/.NET, GTK) from requirements, implements
  windows, menus, file system and OS integration with least-privilege IPC, offline-first
  storage, code signing/notarization, installers and auto-update, and verifies on a per-OS
  test matrix. Use for desktop app work. Publishing releases requires user authorization.
license: MIT
metadata:
  category: software-engineering
  version: "0.1.0"
  agents: [desktop-agent]
---

# Desktop development

## Purpose

Ship desktop apps that install cleanly, feel native on each OS, keep a tight security
boundary between UI and system access, update safely, and are verified on every OS they
claim to support.

## When to use

- Creating or changing a desktop app: windows, menus, tray, shortcuts, file associations,
  native dialogs, background processes, auto-update, installers.
- Choosing a desktop framework, or wrapping an existing web app for desktop.

Do not use when:
- The deliverable is a website or PWA. Use `frontend-development`.
- The main decision is code sharing across mobile, desktop and web. Use
  `cross-platform-development` first.
- Porting a backend or CLI to Rust. Use `rust-modernization`.

## Inputs

- Task contract, target OSes and minimum versions, CPU architectures (x64, arm64).
- Feature needs: file system, native APIs, GPU, hardware access, background services,
  offline.
- Existing project: `src-tauri/` + `tauri.conf.json`, Electron `main`/`preload`, CMake/qmake,
  `pubspec.yaml`, Xcode/.csproj.
- Which OSes are available here for build and test. Signing credentials by env var name only.

## Procedure

1. **Detect the toolchain** and host OS. Record which targets can be built and run here.
   macOS builds and notarization need macOS. MSI/MSIX signing is usually done on Windows or
   in CI.
2. **Baseline:** install from the lockfile, then lint and run tests (`cargo test` plus
   frontend tests, `npm test`, `ctest`, `flutter test`, `dotnet test`).
3. **Choose the framework (new apps only)** with `## Decision rules`. Write an ADR
   (`.ship-anything/templates/architecture-decision.md`).
4. **Security boundary.**
   - Tauri: define capabilities/permissions per window with only the needed commands and
     scoped file system paths. Set a strict CSP.
   - Electron: `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, and a
     minimal `contextBridge` API in preload. Validate every IPC message in main. No
     `remote`. Use `shell.openExternal` only with allow-listed URLs. Turn off unneeded
     Electron fuses.
   - All frameworks: treat the UI layer as untrusted, and validate paths (no traversal)
     and arguments in the privileged layer.
5. **OS integration.** Use the native menu conventions (macOS app menu, Windows/Linux menu
   bar), keyboard shortcuts (Cmd vs Ctrl), per-OS app data paths (via the framework's path
   API), and file associations and deep-link protocols declared in the bundle config.
6. **Data and offline.** Store data locally first (SQLite, files in the app data dir). Make
   writes atomic (write to a temp file, then rename). Run migrations on upgrade. Keep
   secrets in the OS keychain (Keychain, Windows Credential Manager, libsecret) via the
   framework plugin.
7. **Auto-update.** Use the framework updater (Tauri updater with signed update artifacts,
   electron-updater/Squirrel, Sparkle on macOS, MSIX/winget). Update manifests are served
   over HTTPS and signatures are verified. Support rollback or staged rollout where the
   channel allows. Updater signing keys are referenced by env var name only.
8. **Signing and packaging.** macOS: Developer ID signing, hardened runtime, notarization
   and stapling. Windows: Authenticode signing (EV/OV certificate or cloud signing service).
   Linux: AppImage/deb/rpm/Flatpak as required. Unsigned builds trigger Gatekeeper and
   SmartScreen warnings. Report that if signing is not configured.
9. **Test matrix.** Run unit tests, then E2E (WebDriver via tauri-driver, Playwright for
   Electron, Qt Test, Flutter integration_test) on each target OS available. Capture
   screenshots per OS.
10. **Stop before publishing.** Uploading release artifacts, publishing update manifests,
    Mac App Store / Microsoft Store submission and GitHub releases need explicit user
    authorization (`.ship-anything/policies/authorization.md`).

## Decision rules

| Requirement | Prefer |
|---|---|
| Web UI skills, small binaries and memory, Rust-backed system access | Tauri (v2; also targets mobile) |
| Web UI, need full Node ecosystem or consistent Chromium rendering across OSes | Electron |
| Rich native-feeling UI, C++/Python team, embedded/industrial, heavy graphics | Qt (Qt Quick/QML or Widgets). Check LGPL/commercial licence obligations |
| Already shipping Flutter mobile, want desktop from the same code | Flutter desktop |
| Single OS, deepest platform integration | Native: SwiftUI/AppKit (macOS), WinUI 3/WPF/.NET (Windows), GTK/libadwaita (Linux) |
| Existing Electron app | Keep it. Migrate to Tauri only with an ADR covering Node API usage and WebView differences |

**Per-OS test matrix (minimum):**

| Dimension | Cover |
|---|---|
| OS | Each supported OS at oldest supported + current version |
| Architecture | x64 and arm64 where shipped (Apple Silicon, Windows on ARM) |
| Display | 100% and HiDPI scaling, multi-monitor, light/dark theme |
| Install | Fresh install, upgrade from previous version (data migration), uninstall |
| Update | Updater finds, verifies and applies an update. A bad signature is rejected |
| Offline | Launch and core features without network |
| Permissions | macOS privacy prompts (files, camera, mic, screen), Windows UAC only if required |

- Tauri relies on the system WebView (WebKit on macOS/Linux, WebView2 on Windows). Test
  rendering on each OS. Do not assume Chromium behaviour.
- Mark untested matrix cells "not run" with the reason. Never extrapolate from one OS.

## Tools

- Tauri CLI, Electron Forge/electron-builder, Qt (CMake, `windeployqt`/`macdeployqt`),
  Flutter, Xcode, .NET SDK.
- `codesign`, `xcrun notarytool`, `stapler`, `signtool`, `spctl --assess` for verification.
- tauri-driver/WebDriver, Playwright (Electron), Qt Test.
- Related skills: `cross-platform-development`, `rust-modernization`, `frontend-development`.

## Quality standards

- Least-privilege IPC/capabilities. All privileged inputs validated. Strict CSP.
- Signed and notarized builds where signing is configured. Unsigned state stated explicitly
  if not.
- Updates are signature-verified. Upgrade preserves user data.
- Keyboard accessible, with screen reader labels and OS-appropriate shortcuts.
- Test matrix filled honestly with evidence.

## Common failures

- Electron with `nodeIntegration` enabled or an unrestricted preload, so any XSS becomes
  remote code execution.
- Tauri capabilities granting `fs:default` broadly or scope `**`.
- Hardcoded paths or path separators. Writing into the install directory.
- Updater without signature verification, or the signing key committed to the repo.
- Testing only on the developer's OS and calling the app cross-platform.
- Publishing a GitHub release or update manifest without authorization.

## Outputs

- App source, IPC/capability config, packaging and signing config (credentials by name),
  updater config, and tests.
- Per-OS test-matrix table with screenshots. Signing verification output (`spctl`,
  `signtool verify`) where run.
- Agent report. ADR for framework choice.

## Done when

- Acceptance criteria demonstrated on each available target OS with evidence.
- Installers build. Signing and update verification ran where credentials exist (or the
  gap is reported).
- No release or store submission performed without explicit authorization.
- Report filed with status no higher than TESTED.
