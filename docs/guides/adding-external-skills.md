# Adding external skills

External skills are any skills not in this repository's `skills/` folder. SHIP ANYTHING treats
them as **untrusted content until reviewed**: their instructions can never override your
instructions or SHIP ANYTHING's policies, and their scripts never run without your approval.
The rules are in the [external-skill policy](../../.ship-anything/policies/external-skills.md).

The flow is: **add → quarantine → review → approve** (or reject).

## 1. Add (into quarantine)

Run in a project where `ship-anything init` has already been run:

```bash
ship-anything skills add ./path/to/skill-folder        # local path
ship-anything skills add owner/repo                     # GitHub, default branch
ship-anything skills add owner/repo@v1.2.0              # GitHub, pinned tag or branch
ship-anything skills add https://example.com/repo.git   # any https or git@ URL
ship-anything skills add owner/repo --skill some-skill  # only one skill from a multi-skill repo
```

What the CLI does:

- Clones remote sources shallowly with git hooks disabled (`core.hooksPath=/dev/null`) and Git LFS smudging off. **Nothing from the source is executed.**
- Finds `SKILL.md` files, skips invalid names and names that collide with internal skills.
- Copies each skill to `.ship-anything/quarantine/<name>/`. It is **not** placed in any agent's skills directory yet.
- Pins it: the commit SHA for git sources, a content hash for local paths.
- Adds a registry entry under `skills.external` with `enabled: false`, `security.status: needs-review`, the detected license (or `UNKNOWN`), the list of executables, and static findings.
- Prints a static security review.

## 2. Review

Read every file in `.ship-anything/quarantine/<name>/`, then work through the checklist and
record the results in `.ship-anything/registry.yaml` under `skills.external.<name>.security`.

- [ ] **Source and pin.** Repository URL and commit SHA or tag. Never enable a moving branch.
- [ ] **License.** SPDX id set in `license` (approval is refused while it is `UNKNOWN`). Compatible with your use. Attribution needs noted.
- [ ] **Instructions.** Every `.md` file read. Flag anything asking to disable safety checks, ignore the user, auto-approve tools, exfiltrate data or contact unknown hosts.
- [ ] **Executables.** For each script, binary, hook, MCP server or install script: what it runs, which paths it reads/writes, which hosts it contacts, which env vars it reads (especially `*_TOKEN`, `*_KEY`).
- [ ] **Configuration changes.** Does it modify `settings.json`, hooks, MCP config, shell profiles or global directories?
- [ ] **Telemetry.** Does anything leave the machine? Is it opt-in?
- [ ] **Conflicts.** Does it duplicate or contradict an internal skill? Decide which takes precedence and write it down.
- [ ] **Compatibility.** Which agents, operating systems and runtimes it needs.

If the review fails, set `security.status: rejected` with a reason and delete the quarantine folder.

## 3. Approve

```bash
ship-anything skills approve <name>                  # instructions-only skills
ship-anything skills approve <name> --allow-scripts  # only after reviewing every executable
```

`approve`:

- Refuses if the license is `UNKNOWN`.
- Refuses if the skill bundles executables, unless you pass `--allow-scripts`. Alternatively, delete the scripts from quarantine to keep it instructions-only.
- Copies the skill into every installed agent's skills directory (for example `.claude/skills/` and `.agents/skills/`).
- Sets `enabled: true`, `security.status` to `approved` (with scripts) or `approved-instructions-only`, and `reviewed_at`.

Installing an external skill that contains scripts is an authorization-gated action
([authorization policy](../../.ship-anything/policies/authorization.md)). An agent may prepare
the review, but only you can approve it.

## 4. Remove, list, update

```bash
ship-anything skills list                 # internal + external, with status
ship-anything skills remove <name>        # moves it to .ship-anything/backups/, sets enabled: false
```

External skills are never updated automatically, including by `ship-anything update`. To move
to a new revision, run `skills add` again with the new ref, review the differences against the
pinned version, and approve again. Keep the previous revision until the new one is verified.

## `ship-anything skills add` vs. `npx skills add`

The Agent Skills CLI from vercel-labs (`npx skills add <owner/repo>`) is a general installer for
public skills across many agents. Both are valid. They make different trade-offs:

| | `ship-anything skills add` | `npx skills add` |
|---|---|---|
| Where the skill lands first | `.ship-anything/quarantine/` (not active) | Directly in the agent's skills directory (active) |
| Review step | Built in: static review, `needs-review` status, explicit `approve` | Up to you |
| Pinning | Commit SHA or content hash recorded in `registry.yaml` | See that tool's documentation |
| Executable gate | `approve` refuses scripts without `--allow-scripts` | See that tool's documentation |
| Registry / policy integration | Yes (`skills.external`, validator checks enabled skills are approved and pinned) | No |
| Best for | Skills you have not vetted, team projects, anything with scripts | Well-known skills you already trust, quick personal setups |

If you install with `npx skills add`, SHIP ANYTHING does not know about the skill. To bring it under
policy, add it with `ship-anything skills add` as well, or record a `skills.external` entry by hand
with source, pin, license and security status.
