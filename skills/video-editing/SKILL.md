---
name: video-editing
description: >-
  Edits and delivers video with ffmpeg: trimming, cutting, concatenation, reframing for
  16:9, 9:16 and 1:1, titles and overlays, SRT/VTT captions (sidecar or burned in),
  loudness normalisation, and platform encoding presets, verified with ffprobe and frame
  grabs. Use for cutting footage, assembling clips, social cut-downs, captions and final
  encodes of any rendered or recorded video.
license: MIT
metadata:
  category: creative-production
  version: "0.1.0"
  agents: [video-agent]
---

# Video Editing

## Purpose

Turn raw or rendered footage into correctly cut, captioned, normalised and encoded
deliverables for each platform, with every output checked by measurement.

## When to use

- Trimming, cutting, joining clips; extracting segments; making cut-downs.
- Reframing a master into vertical/square versions.
- Adding captions, titles, watermarks; final encoding per platform.

Do not use when:

- Building animated scenes from code → `remotion-production`.
- Designing the soundtrack/mix → `sound-design` (this skill applies the final loudness pass).
- Compositing effects or color grading beyond basic correction → `visual-effects`.

## Inputs

- Source media and their provenance (`asset-pipeline`).
- Edit decision list or storyboard (timecodes, order, captions text).
- Delivery specs per platform (aspect, resolution, max duration, codec, size limits) —
  confirm current limits on the platform's documentation; they change.

## Procedure

1. **Probe sources.**
   `ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels:format=duration -of json in.mp4`.
   Note variable frame rate, mismatched resolutions or sample rates.
2. **Normalise intermediates** if sources differ (same fps, resolution, sample rate) before
   concatenation, e.g. `-vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30" -ar 48000`.
3. **Cut.** Frame-accurate: re-encode
   `ffmpeg -ss 00:00:05.000 -to 00:00:12.500 -i in.mp4 -c:v libx264 -crf 18 -c:a aac out.mp4`.
   Fast/lossless (keyframe-aligned only): `-c copy`. Know which you used.
4. **Concatenate.** Same codecs/params: concat demuxer
   (`printf "file '%s'\n" a.mp4 b.mp4 > list.txt; ffmpeg -f concat -safe 0 -i list.txt -c copy out.mp4`).
   Differing inputs: `concat` filter with re-encode.
5. **Reframe.** For 9:16 from 16:9 choose a deliberate crop region per shot
   (`crop=ih*9/16:ih:x:0`) or a blurred-background pad; check that subjects and text stay
   in frame. Keep important content inside platform safe zones (UI overlays cover the
   bottom and right on vertical feeds).
6. **Captions.** Write SRT/VTT with ≤2 lines, readable line length, timed to speech.
   Sidecar: `-i in.mp4 -i subs.srt -c copy -c:s mov_text out.mp4`. Burned-in:
   `-vf "subtitles=subs.srt:force_style='FontName=...,FontSize=...,MarginV=...'"`.
   Prefer sidecar where the platform supports it (accessible, editable); burn in for
   feeds that autoplay muted.
7. **Loudness.** Two-pass `loudnorm` per `sound-design` to the platform's target; verify
   with `ffmpeg -i out.mp4 -af ebur128 -f null -` (read the Integrated and True peak
   lines).
8. **Encode deliverables.** Baseline web/social preset:
   `-c:v libx264 -preset slow -crf 18-23 -pix_fmt yuv420p -profile:v high -c:a aac -b:a 192k -ar 48000 -movflags +faststart`.
   Resolutions: 16:9 1920×1080, 9:16 1080×1920, 1:1 1080×1080 (4:5 1080×1350 where the
   platform prefers it). Use HEVC/AV1/VP9 only when the target supports it.
9. **Verify each output.** ffprobe (duration, resolution, fps, codec, pix_fmt, audio
   stream), frame grabs at start/middle/end and around each cut, contact sheet, loudness
   readout, file size against platform limits. Watch the cut points.

## Decision rules

| Situation | Decision |
|---|---|
| Cut point not on a keyframe | Re-encode the segment; `-c copy` will drift or freeze |
| Mixed sources | Normalise first, then concat |
| Muted-autoplay social feed | Burn in captions (keep a sidecar too where supported) |
| Archive/master | High-quality master (e.g. ProRes or CRF ≤18) plus delivery encodes |
| Vertical from horizontal with text on screen | Re-layout in source (Remotion/design) rather than crop |
| Publishing to a real platform account | Requires user authorization (`.ship-anything/policies/authorization.md`) |

## Tools

- ffmpeg, ffprobe (with libx264, libass for burned-in subs).
- Whisper-class speech-to-text locally for caption drafts (review every line manually).
- Reference: `dolly` (see .ship-anything/registry.yaml) — format-safe layouts and contact-sheet review.

## Quality standards

- Every deliverable has ffprobe output matching its spec and a reviewed contact sheet.
- Captions accurate (proofread), synced, inside safe zones.
- Loudness at the agreed target within tolerance, true peak below the ceiling.
- `+faststart` on web MP4s; `yuv420p` for broad playback compatibility.

## Common failures

- `-ss` placement and `-c copy` causing black frames or audio desync at the start.
- Concatenating mismatched streams, breaking playback mid-video.
- Center-cropping 16:9 to 9:16 and cutting off the subject or text.
- Auto-generated captions shipped without proofreading.
- Claiming delivery specs without running ffprobe on the actual file.

## Outputs

- Edited masters and per-platform encodes; SRT/VTT files.
- ffprobe JSON, loudness readouts, contact sheets per deliverable.
- Agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- All deliverables exist, match spec by ffprobe, pass loudness check, and were visually
  reviewed at cut points; captions proofread.
- Status follows `.ship-anything/policies/status-model.md`.
