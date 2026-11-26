# assets/logo

**No logo assets exist yet.** This directory is a placeholder. The logo is designed and
reviewed separately, against [Brand guidelines §3](../../docs/branding/brand-guidelines.md#3-logo-direction-concepts-only)
and the [asset review checklist](../../docs/branding/brand-guidelines.md#asset-review).

## What will go here

| File | Purpose |
|---|---|
| `ship-anything-symbol.svg` | Symbol only, one color (`currentColor`) |
| `ship-anything-symbol-small.svg` | Simplified symbol for 16–32 px use |
| `ship-anything-wordmark-light.svg` | Wordmark for light backgrounds |
| `ship-anything-wordmark-dark.svg` | Wordmark for dark backgrounds |
| `ship-anything-lockup-{light,dark}.svg` | Symbol + wordmark, horizontal |
| `ship-anything-lockup-stacked-{light,dark}.svg` | Symbol above wordmark |
| `favicon.svg`, `favicon-32.png`, `favicon-16.png`, `apple-touch-icon-180.png` | Web icons |
| `avatar-512.png`, `avatar-1024.png` | GitHub / social avatar (square, safe area = inner 80%) |
| `LICENSE.md` | Terms for the logo files (trademark use is separate from the code's MIT license) |
| `sources/` | Editable source files (for example `.fig` export or `.ai`/`.afdesign`), only if licensing allows |

## Naming

`ship-anything-<variant>[-<theme>][-<size>].<ext>`, lowercase, hyphenated. Themes are `light` / `dark`
(the background the asset sits on). Sizes are in px (`-512`).

## Specs

- **SVG:** outlined paths (no live text, no embedded fonts or raster), `viewBox` set and no fixed
  `width`/`height`, no `<style>` blocks that depend on external CSS, optimized with SVGO, under 10 KB.
- **PNG:** sRGB, transparent background unless noted, exported at 1× and 2×.
- **Colors:** only tokens from [Brand guidelines §5](../../docs/branding/brand-guidelines.md#5-color) (ink, paper, `--sa-accent`).
- **Clear space:** at least the wordmark cap height on all sides. **Minimum size:** wordmark 96 px wide, symbol 16 px.
- No gradients, glows, bevels or drop shadows in the primary mark.
