# Releasing

Only a maintainer publishes. Agents never publish, tag or push without the maintainer's explicit go-ahead
(`.ship-anything/policies/authorization.md`).

## Checklist

1. On a clean branch, run the full checks:
   ```bash
   npm ci
   npm run check
   node scripts/generate/registry.mjs --check
   ```
2. Bump `version` in `packages/cli/package.json` (semver) and move the `[Unreleased]` notes in `CHANGELOG.md`
   under the new version heading.
3. Inspect the package contents. `prepack` bundles `agents/`, `skills/`, `workflows/` and `.ship-anything/`
   into `packages/cli/content/`:
   ```bash
   cd packages/cli && npm pack --dry-run
   ```
4. Smoke-test the real tarball in an empty directory:
   ```bash
   npm pack --pack-destination /tmp/sa && mkdir /tmp/sa-try && cd /tmp/sa-try && git init -q
   npx --yes /tmp/sa/ship-anything-<version>.tgz init --agent all --yes
   npx --yes /tmp/sa/ship-anything-<version>.tgz validate
   ```
5. Push the release commit and wait for CI to pass on every OS and Node version.
6. Publish from `packages/cli` (requires `npm login` with 2FA):
   ```bash
   cd packages/cli && npm publish
   ```
7. Tag and push: `git tag v<version> && git push origin v<version>`. Optionally create a GitHub release from
   the CHANGELOG entry.
8. Verify from the registry: `npx ship-anything@<version> --version` in a fresh directory.
