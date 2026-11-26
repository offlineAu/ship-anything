---
name: video-production
description: >-
  Produces programmatic and edited video (promo, explainer, product, launch) with Remotion:
  creative brief, script, storyboard, licensed assets, compositions, sound, preview and
  final renders verified against a delivery spec. Publishing is authorization-gated.
level: [L2, L3, L4]
required_agents: [video-agent, qa-agent]
optional_agents: [ux-agent, motion-agent, blender-agent, threejs-agent, research-agent]
required_skills: [remotion-production, video-editing, creative-direction, asset-pipeline]
composes: [3d-product]
---

# Video production

## Purpose

Deliver a rendered video that matches an agreed script and delivery spec (duration,
resolution, frame rate, codec, aspect ratios, captions), built reproducibly as code
(Remotion) so revisions are cheap and renders are deterministic.

## When to use

- Product promos, launch trailers, explainers, feature walkthroughs, social cut-downs,
  data-driven or templated videos (per-customer, per-locale).
- Composed with `website`/`web-app` when a hero/landing video is a deliverable.

Do not use when: a short UI animation inside an app (→ motion-agent within the host
workflow); live-action editing of footage the user has not supplied; stock-video sourcing
without a license decision from the user.

## Inputs

- Goal, audience, channel(s) and delivery spec; if missing, record assumptions
  (e.g. 16:9 1920×1080 primary) in decisions.md.
- Brand assets, footage, voice-over, music the user owns or has licensed.
- Product screenshots/recordings from the actual product (if a product video).

## Agents

- `video-agent` (required): script, storyboard, Remotion project (`video/**` or `remotion/**`),
  edit, sound, renders.
- `qa-agent` (required): independent check of renders against the delivery spec and script.
- Optional creative support only when requested: `ux-agent` (brand/art direction),
  `motion-agent` (shared motion language with the product), `blender-agent` / `threejs-agent`
  (3D renders, via `3d-product`), `research-agent` (competitor/reference video analysis).

## Skills and tools

`remotion-production`, `video-editing`, `creative-direction`, `asset-pipeline`; optional
`sound-design`, `visual-effects`, `motion-design`, `blender-production`.
Tools: Remotion CLI (`npx remotion studio`, `npx remotion render <entry> <composition-id> <out>`),
`ffprobe` (stream metadata), `ffmpeg` (`-af loudnorm=print_format=json` to measure loudness,
`-vf` thumbnails for review sheets).

## Task graph

```
id     agent           objective                                    depends_on       wave  owns
VP-01  video-agent     creative brief, script, shot list, delivery  -                1     video/docs/**
                       spec (durations, formats, captions)
VP-02  ux-agent        brand/art direction frames (optional)        -                1     docs/design/video/**
VP-03  video-agent     storyboard + animatic (low-res timing pass)  VP-01, VP-02     2     video/src/** , video/docs/**
VP-04  video-agent     asset collection with license ledger;        VP-01            2     video/public/**, video/LICENSES.md
                       product captures from real product
VP-05  (3d-product)    3D renders/sequences (optional)              VP-02            2     assets/3d/**, video/public/3d/**
VP-06  orchestrator    review gate: script + animatic approved      VP-03            3     .ship-anything/state/**
                       by user when brand-sensitive; else recorded
VP-07  video-agent     full compositions, typography, transitions,  VP-04, VP-05,    4     video/src/**
                       captions, variants (aspect ratios/locales)   VP-06
VP-08  video-agent     sound: music bed, SFX, VO sync, mix          VP-07            5     video/public/audio/**
VP-09  video-agent     final renders per variant                    VP-08            6     video/out/**
VP-10  qa-agent        spec check (ffprobe), loudness, captions,    VP-09            7     tests/video/**
                       frame review sheet vs script
```

## Parallel opportunities

- VP-01 ∥ VP-02; VP-03 ∥ VP-04 ∥ VP-05 (storyboard code, licensed media, 3D renders in
  disjoint directories).
- Variant renders in VP-09 can run concurrently (distinct output files); cap by host CPU/GPU.

## Sequential requirements

- Script and delivery spec before storyboard; animatic timing approved before full build.
- License ledger entry before any third-party asset enters a composition.
- Sound mix after picture lock (VP-07 VERIFIED) to avoid re-sync.
- Uploading/publishing to YouTube, social, CDN or ad platforms → explicit authorization.

## Acceptance criteria

- Each rendered file matches the delivery spec: duration within the spec's tolerance,
  resolution, frame rate, codec/container, audio channels (from `ffprobe` output).
- Every on-screen claim, UI and number matches the script and the real product.
- Captions/subtitles present when specified and in sync with VO.
- Every asset in the render appears in `video/LICENSES.md` with source and license.
- Renders reproduce from a clean checkout with the documented command.

## Quality gates

- Remotion typecheck/lint exit 0; `npx remotion render` exits 0 for every composition.
- `ffprobe` metadata recorded per output and matched to spec by qa-agent.
- Integrated loudness measured with ffmpeg `loudnorm` and within the target stated in the
  delivery spec (platform-specific target chosen in VP-01, not assumed later).
- Review sheet (thumbnails at fixed interval) checked: no blank frames, cut-off text, or
  placeholder assets.

## Deliverables

Remotion project source, final renders (`video/out/**`), captions files, `video/LICENSES.md`,
script/storyboard docs, render instructions in README.

## Completion conditions

Renders VERIFIED by qa-agent against the spec. Local render files are not DEPLOYED;
an authorized upload/publish with URL/ID → DEPLOYED; SHIPPED after the published video
plays at the destination with correct metadata.

## Failure recovery

| Failure | Recovery |
|---|---|
| Render crashes/out of memory | Lower concurrency, render in segments, check asset sizes; record command and error |
| Audio drift / VO out of sync | Re-time from frame-accurate VO markers; re-render affected segment |
| Asset license unclear | Replace with owned/licensed alternative or placeholder; ask user |
| Fonts differ between preview and render | Bundle fonts locally, load before render; re-render |
| Spec mismatch (fps/resolution) | Fix composition config, never post-convert silently; re-run spec check |
| Stakeholder rejects direction | Return to VP-01/VP-03 with written feedback; keep reusable compositions |
