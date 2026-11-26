# assets/readme

**No README assets exist yet.** This directory is a placeholder for images embedded in the
repository README and docs. Style rules: [Brand guidelines §7](../../docs/branding/brand-guidelines.md#7-readme-visual-style).

## What will go here

| File | Purpose |
|---|---|
| `hero-{light,dark}.svg` or `hero-{light,dark}.png` | Top-of-README hero (wordmark + tagline + one real artifact) |
| `architecture-{light,dark}.svg` | The four-layer diagram from [`docs/architecture/overview.md`](../../docs/architecture/overview.md), drawn as SVG |
| `waves-{light,dark}.svg` | Example wave plan (orchestrator → specialists → gates) |
| `status-ladder-{light,dark}.svg` | `PLANNED → … → SHIPPED` status model |
| `init-terminal.{png,gif,mp4}` | Frame or short clip of a **real** `ship-anything init` run |
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
