---
name: remotion-production
description: >-
  Builds programmatic videos with Remotion (React): compositions, fps and duration,
  typed props with zod schemas, sequences and timing, fonts and assets, captions, and CLI
  rendering with npx remotion render, then verifies output with ffprobe and frame grabs.
  Surfaces the Remotion license (companies over 3 people need a paid license). Use for
  product demos, launch videos, data-driven or templated video in a Remotion project.
license: MIT
metadata:
  category: creative-production
  version: "0.1.0"
  agents: [video-agent]
---

# Remotion Production

## Purpose

Produce video as code — reproducible, parameterised, reviewable — and hand over a file
that has been rendered and inspected, with licensing made visible to the user.

## When to use

- Product demos, launch films, explainers, social clips built from code and data.
- Templated/personalised videos driven by props or JSON.
- An existing Remotion project needs new compositions or fixes.

Do not use when:

- Cutting, trimming or re-encoding existing footage → `video-editing`.
- Live UI animation in an app → `motion-design`.
- The user's organisation cannot accept Remotion's license terms; propose a
  license-free route (HTML/Canvas + recorded capture, or ffmpeg-based assembly).

## Inputs

- Script/storyboard and style frames (`creative-direction`).
- Specs: aspect ratio, resolution, fps, duration, codec, platforms.
- Assets with provenance (`asset-pipeline`): footage, screenshots, fonts, music, VO.

## Procedure

1. **License notice first.** Before scaffolding, tell the user: Remotion is under the
   Remotion License — free for individuals, for-profit companies with up to 3 employees,
   non-profits and evaluation; larger companies need a paid company license. Record their
   acknowledgement in `.ship-anything/state/decisions.md`. Do not proceed for an
   organisation that has not confirmed licensing.
2. **Scaffold or inspect.** New: `npx create-video@latest` (installing dependencies is a
   normal local action; follow the repo's package manager). Existing: read
   `src/Root.tsx` and registered compositions.
3. **Define compositions.** `<Composition id width height fps durationInFrames
   component schema defaultProps />`. Express timing in frames derived from seconds
   (`Math.round(sec * fps)`); use `calculateMetadata` when duration depends on props/data.
4. **Props schema.** zod schema per composition so props are validated and editable in
   Studio; pass render-time props with `--props=props.json`.
5. **Build scenes.** `<Sequence from durationInFrames>`, `<Series>`, `useCurrentFrame()`,
   `interpolate()` with `extrapolateRight: 'clamp'`, `spring()` for natural motion.
   All animation must be frame-driven — CSS transitions and timers do not render
   deterministically.
6. **Assets.** Put files in `public/` and reference via `staticFile()`; use `<OffthreadVideo>`
   / `<Video>`, `<Audio>`, `<Img>`; load fonts with `@remotion/google-fonts` or
   `delayRender`/`continueRender` until loaded.
7. **Captions.** Generate or import SRT/VTT (`video-editing`), render with safe margins
   for the target platform UI.
8. **Preview** in Studio (`npx remotion studio`) and render stills for review:
   `npx remotion still <id> out/still-f60.png --frame=60`.
9. **Render.** `npx remotion render <id> out/<id>.mp4 --codec=h264 --crf=18`
   (add `--props`, `--concurrency`, `--scale` as needed). For several aspect ratios,
   register one composition per format sharing scene components.
10. **Inspect output.**
    `ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate,pix_fmt -of json out/<id>.mp4`;
    grab frames: `ffmpeg -ss 00:00:02 -i out/<id>.mp4 -frames:v 1 out/check-2s.png`,
    or a contact sheet `ffmpeg -i out/<id>.mp4 -vf "fps=1,scale=320:-1,tile=6x4" -frames:v 1 out/contact.png`;
    view them. Measure loudness (`sound-design`). Compare against spec.

## Decision rules

| Situation | Decision |
|---|---|
| Same video in 16:9, 9:16, 1:1 | Separate compositions with layout per format; never just crop |
| Data-driven batch | One composition + props files; render via script loop or `@remotion/renderer` |
| Long render / many videos | Consider Remotion Lambda — paid cloud resources need authorization |
| Text-heavy frames | Render stills at full resolution and read every word before full render |
| Org size unknown | Ask before building; licensing is the user's decision |

## Tools

- Remotion CLI (`studio`, `still`, `render`), `@remotion/renderer`, zod.
- ffprobe/ffmpeg for inspection.
- Optional upstream: `remotion-skills` (see .ship-anything/registry.yaml) — vendor guidance; user-installed with the license notice; never copy its text into this repo.
- Reference: `dolly` (see .ship-anything/registry.yaml) — render-QA and contact-sheet review ideas.

## Quality standards

- License notice delivered and acknowledgement recorded.
- Output matches spec: duration, resolution, fps, codec, pixel format (yuv420p for broad
  playback), audio present if required — confirmed by ffprobe output.
- Frames inspected at key moments; no missing fonts, cut-off text, black frames.
- Every asset in the video has recorded provenance and license.

## Common failures

- Using `setTimeout` or CSS animations, producing frozen or flickering renders.
- Fonts not loaded before capture, causing fallback fonts in output.
- Duration hard-coded while data length varies.
- Reporting "rendered" from a command that exited non-zero or a 0-byte file.
- Burned-in captions under platform UI overlays on vertical video.

## Outputs

- Remotion source (compositions, scenes, schemas), props files.
- Rendered files in `out/` (or contract path), stills and contact sheet.
- ffprobe JSON and loudness measurement in the report.
- Agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- License acknowledged; each required format rendered; ffprobe output matches spec;
  frames and contact sheet reviewed; audio levels measured.
- Status follows `.ship-anything/policies/status-model.md`.
