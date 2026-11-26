# Security Policy

## Supported versions

SHIP ANYTHING is pre-release (0.x). Security fixes land on `main` and in the next 0.x release.

## Reporting a vulnerability

Please **do not** open a public issue for security problems. Use GitHub's private vulnerability
reporting ("Security" tab → "Report a vulnerability") on the project repository once it is public.
Until then, contact the maintainers privately through the channel listed in SUPPORT.md.

Include: affected version/commit, component (CLI, a skill, an agent definition, an adapter), reproduction
steps, impact, and any suggested fix. We aim to acknowledge within 5 business days. This is a
volunteer project — that target is a goal, not an SLA.

## Scope

In scope:
- The `ship-anything` CLI (`packages/cli`): path traversal, unsafe file writes outside the target project,
  overwriting user files, command injection, unsafe handling of untrusted skill sources.
- Instructions in `agents/`, `skills/`, `workflows/`, `.ship-anything/policies/` that could lead an agent to
  leak secrets, bypass the authorization policy, or execute untrusted code.
- The external-skill quarantine and review flow (`ship-anything skills add/approve`).

Out of scope: vulnerabilities in third-party skills or coding agents themselves (report upstream), and
behaviour of a coding agent that ignores its instructions.

## Design principles

See [docs/security-model.md](docs/security-model.md) for the threat model and controls.
