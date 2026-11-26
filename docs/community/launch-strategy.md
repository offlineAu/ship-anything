# Launch strategy

Status: **plan, not yet executed.** SHIP ANYTHING is at 0.1.0, is not published to npm and
has no public repository yet. This document says what has to be true before launch, where and
in what order to announce it, and how to measure it honestly.

Principle: **show, don't claim.** Every public statement links to something a reader can run or
inspect: the repository, a recorded run log, or a reproducible benchmark.

## 1. Pre-launch readiness checklist

The launch does not happen until every **must** item is checked and linked to its evidence.

### Install and CLI (must)

- [ ] `npx ship-anything init --agent <x>` works from the npm registry in an empty directory, on macOS, Linux and Windows (Node 20 and current LTS). Today only the local-checkout path exists: see [Getting started](../guides/getting-started.md).
- [ ] `doctor`, `validate`, `update`, `rollback`, `skills add/approve/remove` and `agents list/show` pass the CLI test suite (`npm test` in `packages/cli`) in CI on all three OSes.
- [ ] `node scripts/validate/validate.mjs` and `node scripts/generate/registry.mjs --check` pass in CI.
- [ ] `rollback` after `init` leaves the target project byte-identical (tested in CI).
- [ ] Package contents reviewed (`npm pack --dry-run`): no state, logs, backups or secrets bundled.
- [ ] `private: true` removed from `packages/cli/package.json` **only** at publish time, with the user's explicit authorization ([authorization policy](../../.ship-anything/policies/authorization.md)).

### Adapter honesty (must)

- [ ] A public compatibility table with three levels: *verified* (loaded and delegated in a recorded session), *partially verified*, *docs-only*. As of 0.1.0:
  - Claude Code, OpenCode: generated agents loaded in local tests.
  - Codex CLI: agent TOML parsed and skills visible; custom agents not listed (likely needs project trust, unverified).
  - Cursor, Gemini CLI: written from documentation; never executed.
- [ ] Each "verified" entry links to a run log with tool version and date.

### Demos and examples (must)

- [ ] At least two demos recorded from **real** runs (for example `init` + agents visible in Claude Code, and the external-skill quarantine flow), with raw logs kept in [`assets/demos/`](../../assets/demos/README.md).
- [ ] At least one example app built end to end by a SHIP ANYTHING run, published as its own repository with the untouched `.ship-anything/state/` (plan, task reports, decisions) so people can audit what the agents did and what a human changed.
- [ ] The [restaurant-platform walkthrough](../guides/example-restaurant-platform.md) stays labeled as an illustrative plan until a real run replaces it.

### Benchmark methodology (must, if any performance or quality claim is made)

- [ ] A written method published *before* results: task set, success criteria, coding agent + model + versions, number of runs, baseline (same agent without SHIP ANYTHING), token accounting source (host-reported only).
- [ ] Raw results, including failures and costs, in the repository. Scripts live in `scripts/benchmark/` (empty today).
- [ ] No benchmark, no claim. "Faster", "cheaper" or "better" do not appear in launch copy without a linked result.

### Repository hygiene (must)

- [ ] README (in brand voice, see [Brand guidelines](../branding/brand-guidelines.md)), LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY (private vulnerability reporting enabled), CHANGELOG.
- [ ] Issue templates: bug, adapter report ("I tried tool X version Y"), skill proposal. Labels from the [contribution roadmap](contribution-roadmap.md).
- [ ] 10+ good-first-issues filed and actually scoped.
- [ ] Secret scan of the full git history.
- [ ] Logo and README assets reviewed ([asset review](../branding/brand-guidelines.md#asset-review)).

### Nice to have

- [ ] Docs site (static, generated from `docs/`).
- [ ] Cursor and Gemini CLI adapters verified by a contributor with those tools.
- [ ] Short Remotion-built overview video (30–90 s).

## 2. Channels

| Channel | What to post | Notes |
|---|---|---|
| GitHub repository | The source of truth: README, releases, discussions | Enable Discussions for Q&A and show-and-tell |
| npm | `ship-anything` package | Publish with provenance (`npm publish --provenance`) from CI |
| Hacker News (Show HN) | Plain title, link to repo, a first comment explaining what it is and what it is not | One post. No vote requests anywhere |
| Reddit (relevant subreddits for each coding agent and r/programming-type communities) | Tool-specific posts ("using SHIP ANYTHING with OpenCode") | Follow each subreddit's self-promotion rules. Disclose authorship |
| Coding-agent communities (official Discords/forums for Claude Code, Codex, OpenCode, Cursor, Gemini CLI) | Adapter-specific notes and asks for verification help | Post only where showcases are allowed |
| Agent Skills ecosystem (skill directories / registries that accept submissions) | Submit individual high-quality skills | Each skill must stand alone and pass the validator |
| X / Bluesky / Mastodon / LinkedIn | One real demo clip + link | See [social guidelines](../branding/brand-guidelines.md#9-social-media-presentation) |
| Personal / project blog | "How the orchestrator plans waves", "Why external skills are quarantined" | Technical, with diagrams and logs |

## 3. Sequencing

| Phase | Duration | Goal | Exit criteria |
|---|---|---|---|
| **0. Private hardening** | until checklist done | Make the must items true | All must boxes checked with evidence |
| **1. Closed preview** | 2–4 weeks | 5–15 invited developers across different coding agents try it on real projects | Each adapter has at least one outside report. Top issues fixed. Install time measured from real sessions |
| **2. Public repository** | 1 week before announcing | Repo public, issues open, no announcement yet | First outside issues triaged. Docs gaps filled |
| **3. Announcement** | 1 day, then a week of follow-up | Show HN + social + community posts on the same day | Maintainers available to answer for 48 h |
| **4. Follow-through** | 4–8 weeks | Weekly changelog posts, adapter verification, first community skills merged | 0.2.0 released with contributor credits |

Rules: announce on a weekday when maintainers can respond. Do not cross-post the same text to
every channel at once. Ship fixes publicly and fast after launch, and credit reporters in the CHANGELOG.

## 4. What NOT to do

- **No fake engagement:** no bought stars, upvote rings, sock-puppet accounts, "star for star" swaps, or asking people to upvote a specific post.
- **No fabricated social proof:** no invented testimonials, user counts, company logos or "used by" sections. Quotes require the person's written permission and a real name or handle.
- **No misleading capability claims:** do not say "works with any AI tool" while Cursor and Gemini CLI are docs-only. Do not say "fully autonomous": production deploys, publishing, pushes and paid resources are authorization-gated by design.
- **No staged demos:** no edited logs, no cherry-picked runs presented as typical. Say how many attempts a demo took when it is not the first.
- **No benchmark theater:** no single-run comparisons, no undisclosed baselines, no numbers from vendor marketing.
- **No logo misuse:** do not use other tools' logos as endorsements.
- **No growth hacks that touch users' machines:** no telemetry added for launch metrics. The CLI does not phone home, and that stays opt-in only if it is ever added.
- **No spam:** no unsolicited DMs, no mass issue/PR openings on other projects to advertise.

## 5. Metrics to watch (honestly)

Report these as they are, including when they are flat or down. Stars and upvotes are
attention, not adoption; they are noted, not targeted.

| Signal | Source | Why it matters |
|---|---|---|
| Successful installs vs. install issues | GitHub issues labeled `install`, closed-preview notes | Is the one-command promise true? |
| Adapter reports by tool and version | `adapter-report` issues | Moves adapters from docs-only to verified |
| Time to first useful result | Closed-preview sessions (self-reported, with logs) | The real product promise |
| Rollbacks and uninstalls mentioned in feedback | Issues, discussions | Signals trust problems |
| External contributors and merged community skills | GitHub | Health of the ecosystem |
| Issue response and fix time | GitHub | Reliability of the maintainers |
| npm weekly downloads | npm (after publish) | Noisy (CI, mirrors). Report the trend only, never as a "user" count |
| Security reports | Private advisories | Count and time to fix, published in advisories |

Not measured: anything requiring telemetry from users' projects.

## 6. Launch-day copy constraints

- Title: what it is, in plain words. For example: "Show HN: SHIP ANYTHING – agents, skills and workflows that install into your coding agent".
- First paragraph: what it installs, which tools are verified, what is not verified, that it is pre-1.0.
- Link the [architecture overview](../architecture/overview.md), the demo logs and the compatibility table.
- End with a specific ask: adapter verification, skill reviews, bug reports.
