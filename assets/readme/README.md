# assets/readme

Images embedded in the repository README. They're generated, not hand-drawn: run
`node scripts/generate/readme-assets.mjs` after changing brand tokens, counts or the captured log.

| File | Source |
|---|---|
| `hero-{light,dark}.svg` | Wordmark, tagline and wave mark (brand concept A, provisional until a logo is designed) |
| `how-it-works-{light,dark}.svg` | Request flow: you → orchestrator → specialists → gates → your approval |
| `init-terminal-{light,dark}.svg` | Real output of `npx ship-anything@0.1.0 init --agent claude --yes`, captured 2026-11-28 in `init-terminal.log` (path shortened to `~/my-app`) |

Style rules: [Brand guidelines §7](../../docs/branding/brand-guidelines.md#7-readme-visual-style).

## Still to produce

| File | Purpose |
|---|---|
| `architecture-{light,dark}.svg` | The four-layer diagram from [`docs/architecture/overview.md`](../../docs/architecture/overview.md), drawn as SVG |
| `waves-{light,dark}.svg` | Example wave plan (orchestrator → specialists → gates) |
| `status-ladder-{light,dark}.svg` | `PLANNED → … → SHIPPED` status model |
| `init-terminal.{gif,mp4}` | Short clip of a **real** run, including the agent working |
| `og-card-1200x630.png` | Open Graph / social preview image |

## Naming

`<subject>[-<theme>][-<width>].<ext>`, lowercase, hyphenated. Ship light and dark variants of
anything with a background and embed them with `<picture>` + `prefers-color-scheme`.

## Specs

- **Width:** designed at 960 px (renders well in GitHub's README column). Export PNG at 2× (1920 px).
- **Format:** SVG for diagrams (outlined text or system font stack, no external fonts), PNG for raster,
  MP4 (H.264) preferred over GIF; GIF only if under 5 MB.
- **Weight:** under 500 KB per image, under 5 MB per clip.
- **Content:** terminal frames and plans must come from a real run (keep the log beside the asset as
  `<name>.log`). Each image needs alt text written in the README where it is embedded.
- No secrets, usernames, home-directory paths or private repository names in any frame.
