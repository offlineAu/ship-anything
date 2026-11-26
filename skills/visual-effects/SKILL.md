---
name: visual-effects
description: >-
  Creates visual effects for web and video: shaders and post-processing (bloom, depth of
  field, grain), particles, compositing, keying, masks, color grading with LUTs,
  transitions and stylised looks, within performance budgets and with reduced-motion and
  photosensitivity safeguards. Use for WebGL/CSS effects, video compositing, grading and
  stylised looks; not for basic UI transitions.
license: MIT
metadata:
  category: creative-production
  version: "0.1.0"
  agents: [motion-agent, video-agent]
---

# Visual Effects

## Purpose

Add effects that serve the story or brand — a look, a focus cue, a transition — while
staying within frame-time budgets on the web and within quality specs in video.

## When to use

- Real-time effects: custom shaders, post-processing, particles, noise/gradient
  backgrounds, canvas effects.
- Video effects: compositing, green-screen keying, masks, grading with LUTs, stylised
  transitions, grain/vignette.

Do not use when:

- Simple UI transitions → `motion-design`.
- Full 3D scenes → `threejs-production`; modelling/rendering → `blender-production`.
- An effect has no purpose beyond "make it cooler"; propose removing it.

## Inputs

- Style frames and look references (`creative-direction`).
- Target: web (devices, budgets) or video (resolution, fps, color space).
- Source footage/assets with provenance (`asset-pipeline`).

## Procedure

1. **Define the look in words and frames.** What the effect communicates; reference
   frames; where it applies and where it must not (text legibility, faces, product color
   accuracy).
2. **Web: choose the cheapest technique.** CSS (gradients, `backdrop-filter`,
   `mix-blend-mode`) → Canvas 2D → WebGL fragment shader → full post-processing chain.
   For Three.js use `postprocessing` or three's `EffectComposer`; merge passes where
   possible; render effects at reduced resolution when acceptable.
3. **Web: budgets.** Measure frame time on the target device class with DevTools or
   stats.js; provide a static fallback for low-end devices, no-WebGL and
   `prefers-reduced-motion: reduce`. Pause effects when off-screen
   (`IntersectionObserver`) or tab hidden (`visibilitychange`).
4. **Photosensitivity.** No content flashing more than three times per second; avoid
   large high-contrast strobing and rapid red flashes (WCAG 2.3.1).
5. **Video: compositing in ffmpeg** (or a compositor if available):
   - Overlay: `-filter_complex "[0:v][1:v]overlay=x=W-w-40:y=40"`.
   - Key: `chromakey=0x00FF00:0.12:0.08` (tune similarity/blend per footage), then
     `despill` if available; inspect edges on frame grabs.
   - Grade: `lut3d=look.cube` (record LUT source/license), or `eq`/`colorbalance`/`curves`
     for simple corrections. Grade on a correctly tagged color space (Rec.709 for SDR web).
   - Grain/vignette: `noise=alls=8:allf=t`, `vignette`.
6. **Video: preserve quality.** Work from high-quality intermediates; encode once at the
   end (`video-editing`).
7. **Verify.** Web: screenshots, frame-time measurements, fallback and reduced-motion
   screenshots. Video: frame grabs before/after at representative frames, contact sheet,
   check skin tones and brand colors against references.

## Decision rules

| Situation | Decision |
|---|---|
| Effect achievable in CSS | Use CSS; no WebGL |
| Full-screen shader on mobile misses budget | Lower resolution, simplify, or static image fallback |
| Effect reduces text contrast | Move text off the effect or add a scrim; contrast still ≥ WCAG AA |
| Keying edges poor | Re-shoot or rotoscope; do not ship fringing |
| Third-party LUT, shader or preset | Confirm license; record in the assets manifest |

## Tools

- Web: Three.js / postprocessing, GLSL, Canvas 2D, CSS filters and blend modes, stats.js.
- Video: ffmpeg filters (`overlay`, `chromakey`, `lut3d`, `eq`, `curves`, `noise`,
  `vignette`), a compositor (Blender compositor, DaVinci Resolve) when the user has one.
- Reference: `motion-tools-and-skills` (see .ship-anything/registry.yaml) — color-grade and
  shader patterns; adapt with attribution after review.

## Quality standards

- Each effect has a stated purpose and an off/fallback state.
- Web effects measured on target device class; fallbacks screenshotted.
- No photosensitivity violations; reduced motion honoured.
- Before/after frames prove the video effect works across representative shots.
- All LUTs, shaders, textures and presets have recorded provenance.

## Common failures

- Stacking post-processing passes until mobile frame rates collapse.
- Effects running while invisible, draining battery.
- Grading that shifts product or brand colors away from reality.
- Copying shader code from the web without checking its license.
- Judging a key or grade on one frame only.

## Outputs

- Effect code/shaders or filter graphs; LUTs; fallback assets.
- Before/after frames, contact sheets, measurements.
- Agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- Effects implemented with fallbacks, measured (web) or inspected across frames (video),
  provenance recorded, safety checks done.
- Status follows `.ship-anything/policies/status-model.md`.
