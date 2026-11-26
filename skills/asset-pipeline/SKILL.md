---
name: asset-pipeline
description: >-
  Manages creative and product assets end to end: provenance classification (generated,
  user-provided, licensed third-party, externally sourced) recorded with source and
  license in an assets manifest, naming and storage, and optimisation — AVIF/WebP images,
  responsive sizes, subset WOFF2 fonts, SVG cleanup, video encodes, glTF compression.
  Use whenever assets are added, generated, downloaded, optimised or shipped.
license: MIT
metadata:
  category: creative-production
  version: "0.1.0"
  agents: [threejs-agent, blender-agent, video-agent]
---

# Asset Pipeline

## Purpose

Know where every asset came from and whether the project may use it, and ship each asset
in the smallest format that preserves the needed quality.

## When to use

- Adding images, icons, fonts, audio, video, 3D models, LUTs, textures to a project.
- Generating assets with AI or procedural tools; downloading from libraries.
- Optimising asset weight for web performance or delivery limits.
- Auditing an existing project's assets before release.

Do not use when:

- Code dependencies (npm/pip packages) — those follow dependency and license review in
  `security-audit`/`code-review`.
- Designing the asset's content → `creative-direction` / `ui-ux-design`.

## Inputs

- The assets, their origin, and any license text or purchase record.
- Target platforms and budgets (page weight, GLB size, delivery specs).
- Existing manifest at `assets/manifest.yaml` (or the path in the task contract).

## Procedure

1. **Classify provenance** for every asset:
   | Class | Meaning | Required fields |
   |---|---|---|
   | `generated` | Made by an agent/tool for this project (code, AI model, procedural) | tool/model + version, prompt or script path, date, tool terms allowing intended use |
   | `user-provided` | Supplied by the user | who supplied it, date, user's stated rights |
   | `licensed-third-party` | Obtained under an explicit license (stock, OFL fonts, CC, purchased) | source URL, license (SPDX or name), attribution text, license file/receipt path, restrictions |
   | `externally-sourced` | Found externally, rights not yet established | source URL, date; **blocked from shipping** until reclassified |
2. **Record in the manifest.** One entry per asset (or per pack):
   ```yaml
   - path: public/img/hero.avif
     class: licensed-third-party
     source: https://example.com/photo/123
     license: Example Stock Standard License
     attribution: "Photo by Jane Doe"
     restrictions: [no-resale, web-only]
     evidence: legal/licenses/hero-receipt.pdf
     derived_from: assets/src/hero.jpg
   ```
3. **Never assume reuse rights.** Copyrighted material (logos, product shots, music,
   fonts, screenshots of other products, characters) is not free because it is public.
   Trademarks/logos of other companies: only per their brand guidelines and context.
   Unknown → `externally-sourced` → ask the user or replace.
4. **Keep sources.** Store originals in `assets/src/` (or outside the shipped bundle) and
   generate optimised outputs; never overwrite the only original.
5. **Optimise images.** Resize to the largest displayed size × 2 at most; encode AVIF
   and/or WebP with a JPEG/PNG fallback only where needed:
   `npx sharp-cli -i in.jpg -o out.avif -f avif -q 50` or `avifenc`, `cwebp -q 75`.
   Generate responsive widths for `srcset`. Optimise SVG with `npx svgo`. Strip metadata
   that may contain location/personal data (EXIF GPS).
6. **Optimise fonts.** WOFF2 only for modern targets; subset to used character ranges
   (`pyftsubset font.ttf --unicodes=U+0000-00FF --flavor=woff2`) when the license permits
   modification; variable fonts when several weights are used; `font-display: swap` or
   `optional`. Confirm the font license allows web embedding.
7. **Optimise video.** Web background/hero: muted H.264 MP4 (+ optional AV1/VP9 WebM),
   `-movflags +faststart`, poster image, short loops; see `video-editing` for encodes.
8. **Optimise 3D.** `npx @gltf-transform/cli optimize` with meshopt/Draco and KTX2 (see
   `threejs-production`).
9. **Attribution.** Generate a credits/NOTICE section from manifest entries that require
   attribution and place it where the license requires.
10. **Verify.** Script or manually check that every file under shipped asset paths has a
    manifest entry and no entry is `externally-sourced`; record before/after sizes.

## Decision rules

| Situation | Decision |
|---|---|
| Rights unknown | Do not ship; mark `externally-sourced` and escalate |
| AI-generated image | `generated`; record tool and terms; avoid prompts imitating living artists or real brands/people |
| Paid stock/font/music needed | Requires user authorization (money); record the receipt |
| Font license forbids modification | Ship unsubsetted or choose another font |
| Asset contains personal data or faces of real people | Confirm consent/release with the user |

## Tools

- sharp/sharp-cli, avifenc, cwebp, svgo, pyftsubset (fonttools), ffmpeg, @gltf-transform/cli.
- Reference: `motion-tools-and-skills` (see .ship-anything/registry.yaml) — licence-note practice (`reference-only` lists).

## Quality standards

- 100% of shipped assets have a manifest entry with class, source and license.
- Zero `externally-sourced` assets in a release.
- Attribution requirements satisfied in the shipped product.
- Optimised outputs measured; originals preserved.

## Common failures

- "Found on Google Images" assets shipped as if free.
- Font files copied from a designer's machine without a web license.
- Over-compressing UI screenshots so text blurs.
- Shipping 4000px images into 400px slots.
- Losing the original after lossy optimisation.

## Outputs

- `assets/manifest.yaml` (or contract path), credits/NOTICE section.
- Optimised assets and size report (before/after).
- Agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- Manifest complete for all in-scope assets; no unresolved provenance; attribution in
  place; optimisation done with sizes recorded.
- Status follows `.ship-anything/policies/status-model.md`.
