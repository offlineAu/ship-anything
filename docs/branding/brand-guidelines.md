# SHIP ANYTHING — Brand guidelines

> **Your AI Product Studio. Build Anything. Ship Everything.**

Status: **draft v0.1**, written alongside the 0.1.0 pre-release. No logo, screenshot, demo or
social asset exists yet. Everything below is *direction* for the people who will produce
those assets. Each asset gets its own review against this document before it is published
(see [Asset review](#asset-review)).

## 1. What the brand has to say

SHIP ANYTHING is a set of portable instructions (22 specialist agents, 63 skills, composable
workflows, policies) plus a small CLI that installs them into the coding agent you already
use. It does not run its own model. The brand should read like a well-made engineering
tool, not like an AI product launch.

| Message | What it means in practice | How it shows up visually |
|---|---|---|
| Engineering excellence | Contracts, evidence, quality gates, a validator | Grids, aligned columns, monospaced detail, nothing floating at random |
| Autonomous production | The orchestrator plans, delegates in waves and integrates | Wave and pipeline diagrams; motion that moves left to right in steps |
| Modern technology | Agent Skills format, multi-agent adapters, Node CLI | Current type, dark and light themes treated equally, crisp vector work |
| Precision | Status only advances with evidence | Hairlines, tick marks, exact numbers taken from real output |
| Creative freedom | 3D, motion, video and design skills sit next to backend and infra | One accent color used with restraint, so creative work in demos carries the color |
| Professional reliability | Authorization gates, rollback, no secrets in state | Calm layouts, plenty of space, no hype or urgency devices |

**Not this:** purple-to-blue gradients, sparkle or magic-wand icons, glowing brains,
robot mascots, "10x" claims, neon cyberpunk, glassmorphism stacks, stock photos of
people pointing at screens.

## 2. Name and wordmark usage

- Write it as **SHIP ANYTHING** in headings and the wordmark, and *Ship Anything* in running
  prose when all-caps would be loud. Never "ShipAnything", "Ship-Anything" or "SA".
- The CLI and package are `ship-anything` (lowercase, hyphenated, in code formatting).
- Tagline: *Build Anything. Ship Everything.* Use the two sentences together, title case, with periods.
- Descriptor: *Your AI Product Studio.* Use it on first mention or in hero areas. Do not stack it
  with the tagline in more than one place per page.

## 3. Logo direction (concepts only)

The logo will be designed, exported and reviewed separately. These are starting concepts,
not finished files. Final files go in [`assets/logo/`](../../assets/logo/README.md).

| Concept | Idea | Why it fits | Risk to watch |
|---|---|---|---|
| **A. Wave mark** | Three or four short horizontal bars, offset left to right like the orchestrator's parallel waves, closing on a vertical "gate" line | It shows how the system actually works (waves, then gate) | Can look like a generic "menu" or "stack" icon at small sizes |
| **B. Gate chevron** | A forward chevron (`>`) cut by a thin vertical rule: the release gate | Terminal prompt, forward motion and a checkpoint in one shape | Chevrons are common. The cut needs to be distinctive |
| **C. Bracketed S** | A geometric S built from two right-angled segments inside square brackets `[ S ]` | Reads as code, and as a contained, verified unit | Brackets can feel cold. Test against the warm accent |
| **D. Wordmark only** | Expanded-width wordmark, no symbol, with a small accent tick after "SHIP" | Cheapest to keep consistent across README, terminal and video | Weak as a favicon or avatar. Needs a monogram fallback |

Requirements for whichever concept wins:

- Works in one color (ink on paper, paper on ink) before any accent is added.
- Legible at 16 px (favicon) and 32 px (GitHub avatar crop). Supply a simplified small-size variant if needed.
- Built on a pixel grid with stroke weights that match the display typeface.
- No gradients, glows or 3D bevels in the primary mark. Motion versions may animate the build-up of waves.
- Delivered as SVG (outlined, no live text) plus PNG exports. Specs are in [`assets/logo/README.md`](../../assets/logo/README.md).
- Clear space equal to the cap height of the wordmark on all sides. Minimum wordmark width 96 px on screen.

## 4. Typography

All families are open-licensed (SIL Open Font License 1.1), free for commercial use and
embedding, and available from Google Fonts or the foundries' repositories. Self-host the
font files in web properties instead of hot-linking where possible.

| Role | Family | License | Use |
|---|---|---|---|
| Display / wordmark | **Archivo** (variable, with width axis; use expanded widths 112–125 for the wordmark and hero) | SIL OFL 1.1 | Logo wordmark, H1/H2, video titles, social cards |
| Text / UI | **IBM Plex Sans** | SIL OFL 1.1 | Body copy, UI labels, captions, slides |
| Code / data | **JetBrains Mono** | SIL OFL 1.1 | CLI output, file paths, task ids, status badges, numbers in tables |

Rules:

- Display: weight 700–800, tight tracking (−1% to −2%), sentence case for headings, all caps only for the wordmark and short labels.
- Body: 400 for text, 500–600 for emphasis. 16 px minimum on web, line height 1.5–1.6, line length 60–80 characters.
- Mono: use it for anything the user would type or see in a terminal. Turn off ligatures in CLI recordings so `->` and `!=` read literally.
- Numbers in tables use tabular figures (`font-variant-numeric: tabular-nums`).
- Fallback stacks: `Archivo, "IBM Plex Sans", system-ui, sans-serif` · `"IBM Plex Sans", system-ui, sans-serif` · `"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace`.

## 5. Color

One warm accent (**Signal**, a safety orange) on graphite and paper neutrals. The accent marks
the single most important thing on a screen: the primary action, the active wave, the
shipped state. It is never a background wash.

### 5.1 Tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--sa-bg` | `#FAFAF7` | `#0D0F12` | Page background |
| `--sa-surface` | `#FFFFFF` | `#15181D` | Cards, code blocks, terminal frame |
| `--sa-surface-2` | `#F0F0EB` | `#1D2127` | Table stripes, inset areas |
| `--sa-border` | `#D6D6CF` | `#2C323A` | Hairlines and dividers (decorative only) |
| `--sa-border-strong` | `#787E87` | `#6B7480` | Input outlines, focus-adjacent UI, chart axes |
| `--sa-text` | `#14161A` | `#ECEDEE` | Primary text |
| `--sa-text-muted` | `#525861` | `#9BA3AD` | Secondary text, captions |
| `--sa-accent` | `#B4410C` | `#FF7A3D` | Primary actions, links, active state, wordmark tick |
| `--sa-on-accent` | `#FFFFFF` | `#0D0F12` | Text on accent fills |
| `--sa-success` | `#166534` | `#4ADE80` | VERIFIED / SHIPPED, passing checks |
| `--sa-warning` | `#854D0E` | `#FACC15` | BLOCKED, needs-review, UNVERIFIED |
| `--sa-danger` | `#B91C1C` | `#F87171` | FAILED, rejected, destructive actions |
| `--sa-info` | `#0E7490` | `#22D3EE` | IN_PROGRESS, informational notes |

```css
:root {
  --sa-bg:#FAFAF7; --sa-surface:#FFFFFF; --sa-surface-2:#F0F0EB;
  --sa-border:#D6D6CF; --sa-border-strong:#787E87;
  --sa-text:#14161A; --sa-text-muted:#525861;
  --sa-accent:#B4410C; --sa-on-accent:#FFFFFF;
  --sa-success:#166534; --sa-warning:#854D0E; --sa-danger:#B91C1C; --sa-info:#0E7490;
}
@media (prefers-color-scheme: dark) {
  :root {
    --sa-bg:#0D0F12; --sa-surface:#15181D; --sa-surface-2:#1D2127;
    --sa-border:#2C323A; --sa-border-strong:#6B7480;
    --sa-text:#ECEDEE; --sa-text-muted:#9BA3AD;
    --sa-accent:#FF7A3D; --sa-on-accent:#0D0F12;
    --sa-success:#4ADE80; --sa-warning:#FACC15; --sa-danger:#F87171; --sa-info:#22D3EE;
  }
}
```

### 5.2 Contrast (WCAG 2.2)

Ratios were computed with the WCAG relative-luminance formula against `bg` / `surface` / `surface-2`
of the same theme. Re-run the check whenever a token changes.

| Token | Light (bg / surface / surface-2) | Dark (bg / surface / surface-2) |
|---|---|---|
| text | 17.3 / 18.1 / 15.8 | 16.4 / 15.2 / 13.8 |
| text-muted | 6.9 / 7.2 / 6.3 | 7.5 / 7.0 / 6.3 |
| accent | 5.4 / 5.7 / 5.0 | 7.4 / 6.9 / 6.2 |
| success | 6.8 / 7.1 / 6.2 | 11.0 / 10.2 / 9.3 |
| warning | 6.6 / 6.9 / 6.0 | 12.5 / 11.6 / 10.6 |
| danger | 6.2 / 6.5 / 5.7 | 6.9 / 6.4 / 5.8 |
| info | 5.1 / 5.4 / 4.7 | 10.6 / 9.9 / 9.0 |
| border-strong (non-text, needs ≥ 3:1) | 3.9 / 4.1 / 3.6 | 4.1 / 3.8 / 3.4 |
| on-accent on accent | 5.7 (white on `#B4410C`) | 7.4 (ink on `#FF7A3D`) |

Notes:

- Every text token meets **AA for normal text (≥ 4.5:1)** on all three surfaces in both themes.
- `--sa-border` is decorative (about 1.3–1.5:1). Never use it as the only boundary of an input or control. Use `--sa-border-strong`.
- The brighter orange `#F25F1C` is for large illustration fills only. White text on it is 3.3:1, which fails AA for body text.
- Never rely on color alone for status. Pair it with the status word (`VERIFIED`, `FAILED`) or an icon shape.
- Focus rings: 2 px `--sa-accent` outline with a 2 px offset. Check it against whatever sits behind it.

## 6. Visual motifs

Every motif comes from how the system works, so it explains something while it decorates.

- **Waves.** Horizontal lanes of task blocks, offset in time. This is the core diagram for parallel delivery.
- **Gates.** A thin vertical rule with a status label (`QA GATE`, `SECURITY GATE`). Things pass through it or stop at it.
- **Status ladder.** `PLANNED → IN_PROGRESS → IMPLEMENTED → TESTED → VERIFIED → DEPLOYED → SHIPPED` set in mono, with the current step in accent.
- **Contracts.** Small YAML snippets (`owns:`, `depends_on:`) used as texture, at full legibility and with real field names from `.ship-anything/templates/`.
- **Grid and tick marks.** An 8 px base grid. Hairline rulers and corner ticks for framing, like a technical drawing.
- **Terminal frames.** Flat, square-cornered (4 px radius at most) terminal windows with no fake traffic-light buttons unless a real screenshot includes them.

Iconography: 1.5 px stroke at 24 px, square caps, geometric. Use an open-source set with a
compatible license (for example Lucide, ISC) and do not mix sets. No sparkles, wands, brains or robots.

## 7. README visual style

- Top: wordmark (SVG with light and dark variants via `<picture>` and `prefers-color-scheme`), tagline, one sentence on what it is. No badge wall: at most version, license and CI, and only once they are real.
- One hero image, ideally a **real** terminal recording (static frame or short GIF/MP4) of `ship-anything init` followed by a wave plan. Never a mock-up presented as output.
- Diagrams as SVG with both themes, or as text diagrams in code blocks (the architecture overview already uses one). Keep diagrams 960 px wide or less.
- Tables over bullet walls for agents, skills and adapters. Show adapter status honestly (verified / partially verified / docs-only).
- Every screenshot has alt text that says what it shows and where it came from.
- Asset specs are in [`assets/readme/README.md`](../../assets/readme/README.md) and [`assets/screenshots/README.md`](../../assets/screenshots/README.md).

## 8. Demo video style (Remotion-friendly)

Demos are built in code with Remotion (see [`skills/remotion-production`](../../skills/remotion-production/SKILL.md)),
so typography, color and timing come from the same tokens as the web.

- **Source of truth:** every terminal line, file tree and plan shown must come from a recorded real run. Keep the raw log next to the composition (for example `assets/demos/<slug>/run.log`). Speed it up, never invent it.
- **Format:** 1920×1080 at 30 fps for the main cut, plus 1080×1350 (4:5) and 1080×1920 (9:16) social cuts. H.264 MP4, and VP9/AV1 WebM for the web.
- **Length:** 30–90 s overview. 2–5 min deep dives. A visible title card states what is real ("Recorded on <date>, Claude Code <version>, sped up 8×").
- **Composition:** dark theme by default (`--sa-bg` dark), with a light variant for docs embeds. Terminal panel on the left (JetBrains Mono, 20–24 px at 1080p), plan/wave visual on the right.
- **Motion:** step-based, left to right, using `spring` with high damping or ease-out cubic over 300–500 ms. Nothing bounces, orbits or particles. Respect reduced motion in web embeds by offering a static poster.
- **Captions:** burned-in captions for social, plus an SRT/VTT file. Captions in IBM Plex Sans 600 on a `--sa-surface` plate.
- **Audio:** optional low-key music under −18 LUFS integrated, with licensed tracks only and the license recorded. No voice clones.
- **End card:** wordmark, tagline, repository URL once it exists. No "#1" or comparison claims.
- File naming and delivery specs are in [`assets/demos/README.md`](../../assets/demos/README.md).

## 9. Social media presentation

- **Avatar:** the symbol or monogram on `--sa-bg` dark, accent used once. Must read at 48 px.
- **Banner / Open Graph card:** 1200×630 (OG) and 1500×500 (banner). Wordmark, tagline and one real artifact (a wave diagram or terminal frame). No collage.
- **Posts:** lead with a concrete thing shown working ("`init --agent opencode` installs 22 agents and 63 skills; here is the plan it produced"). Link to the source or the recording.
- **Threads:** one idea per post, one image per post, alt text always.
- **Disclosure:** posts produced with help from SHIP ANYTHING or another AI tool say so when it matters.
- **Never:** engagement bait, countdown hype, fake scarcity, unverified compatibility logos ("works with everything"), or third-party logos without permission and correct trademark use.

## 10. Voice and tone

Voice: a senior engineer explaining a system they trust and know the limits of.

| Do | Don't |
|---|---|
| "Installs 22 agents and 63 skills into `.claude/` and `.agents/`." | "Unleash a team of AI superagents!" |
| "Cursor adapter: written from Cursor's docs, not yet tested." | "Works with every AI coding tool." |
| "QA re-runs the checks; a task cannot verify itself." | "Bulletproof, bug-free code, guaranteed." |
| "Production deploys need your explicit approval." | "Fully autonomous, hands-off shipping." |
| "Pre-release (0.1.0). Not on npm yet." | "Trusted by thousands of developers." |

- Short sentences, active voice, specific numbers taken from the repository or a real run.
- State limitations next to features, not in a footnote.
- No emojis in docs, CLI output or the README. Plain status words (`✔`/`✖` glyphs are fine in the CLI because they are already part of its output).
- Avoid "magic", "effortless", "revolutionary", "game-changing", "10x" and "AI-powered" as a selling point.

## 11. Do / don't summary

**Do:** use real output · keep one accent · label unverified things as unverified · design light and dark together · cite the source run for every demo · keep type to the three families.

**Don't:** use purple gradients or sparkle icons · fabricate stars, downloads, benchmarks or testimonials · show logos of tools not verified to work · animate for its own sake · put secrets, tokens or personal paths in screenshots (see [`.ship-anything/policies/secrets.md`](../../.ship-anything/policies/secrets.md)).

## Asset review

Before any asset is published (README, site, social, video):

1. It follows sections 3–9 (type, tokens, motifs).
2. Text and UI elements meet the contrast table in 5.2.
3. Every piece of shown output traces to a real run log, which is kept with the asset.
4. No secrets, emails, usernames, home-directory paths or private repo names are visible.
5. Fonts, music, icons and third-party marks have licenses recorded next to the asset.
6. A second person (or a fresh agent session) reviewed it and signed off in the PR.
