---
name: sound-design
description: >-
  Plans and finishes audio for video and product media: music beds, sound effects and
  voice-over, licensing and provenance, sync to picture, ducking, mixing, and loudness
  normalisation with ffmpeg loudnorm to common targets (around -14 LUFS integrated for
  streaming/social, around -16 LUFS for podcasts), verified by measurement. Use for any
  soundtrack, VO, SFX or loudness task.
license: MIT
metadata:
  category: creative-production
  version: "0.1.0"
  agents: [video-agent]
---

# Sound Design

## Purpose

Give media a soundtrack that supports the message, is legally usable, is intelligible
on phone speakers, and hits measured loudness targets for its destination.

## When to use

- Choosing or producing music, SFX and voice-over for a video or product demo.
- Mixing VO over music (ducking), syncing hits to picture.
- Normalising loudness for a platform; fixing clipping, noise or level jumps.

Do not use when:

- UI sound effects inside an app's code path → `frontend-development` (this skill can
  still advise on the assets).
- Music composition requiring a human composer or licensed library purchase without
  user authorization.
- Video cutting/encoding only → `video-editing`.

## Inputs

- Script/storyboard with timing (`creative-direction`), picture lock or rough cut.
- Audio assets with provenance (`asset-pipeline`): music license, SFX source, VO talent
  consent and usage rights.
- Destination platforms.

## Procedure

1. **Licensing first.** For each audio asset record source, license, attribution
   requirement and allowed uses (commercial, paid ads, platforms, duration) in the assets
   manifest. Never assume a track is free to use because it is online. Stock libraries
   often distinguish personal, social and paid-ad use. Synthetic voices: confirm the
   provider's terms allow commercial use; never clone a real person's voice without their
   documented consent.
2. **Spot the picture.** List moments that need sound: hits on cuts, UI clicks, whooshes
   on transitions, music changes at section boundaries. Keep SFX sparse and purposeful.
3. **Voice-over.** Record or generate at 48 kHz; remove noise and breaths moderately
   (`afftdn`, `highpass=f=80`); keep consistent mic distance/level; proof the script
   against the final edit.
4. **Music.** Edit to length on bar boundaries; fade in/out (`afade`); key changes match
   scene changes.
5. **Sync.** Place audio by frame (time = frame / fps). Verify sync visually on frame
   grabs or in an editor at hit points.
6. **Mix and duck.** VO is the priority; music typically sits well below VO during speech.
   Sidechain ducking example:
   `ffmpeg -i music.wav -i vo.wav -filter_complex "[0:a][1:a]sidechaincompress=threshold=0.05:ratio=8:attack=20:release=300[ducked];[ducked][1:a]amix=inputs=2:normalize=0[mix]" -map "[mix]" mix.wav`.
   Listen to the result; tune by ear and by meter.
7. **Loudness normalise** (EBU R128 measurement, two-pass `loudnorm`):
   - Pass 1: `ffmpeg -i mix.wav -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null -`
   - Pass 2: feed measured values back:
     `-af loudnorm=I=-14:TP=-1:LRA=11:measured_I=..:measured_TP=..:measured_LRA=..:measured_thresh=..:offset=..:linear=true`
   Common targets (practice, not universal law; check the platform's current docs):
   about -14 LUFS integrated for streaming/social video, about -16 LUFS for podcasts,
   -23 LUFS for EBU R128 broadcast, -24 LKFS for ATSC A/85; true peak typically ≤ -1 dBTP.
8. **Measure.** `ffmpeg -i final.wav -af ebur128=peak=true -f null -` and record
   Integrated, LRA and True peak. Listen on laptop speakers and headphones.
9. **Deliver** stems (VO, music, SFX) plus the final mix; mux into video via
   `video-editing`.

## Decision rules

| Situation | Decision |
|---|---|
| License unclear or "found online" | Do not use; find a licensed alternative or ask the user |
| Paid music/SFX/voice service | Requires user authorization (money) |
| Muted autoplay platform | Story must work without sound; captions carry speech |
| VO and music compete | Lower or EQ the music under speech; never raise VO into clipping |
| Platform target unknown | Use about -14 LUFS integrated, -1 dBTP, and state the assumption |

## Tools

- ffmpeg filters: `loudnorm`, `ebur128`, `sidechaincompress`, `amix`, `afade`, `afftdn`,
  `highpass`, `alimiter`.
- A DAW if available (Audacity, Reaper) for manual editing.
- Reference: `motion-tools-and-skills` (see .ship-anything/registry.yaml) — sound and licence-note patterns; adapt with attribution.

## Quality standards

- Every audio asset has recorded provenance and license in the assets manifest.
- Integrated loudness and true peak measured on the final file and reported.
- VO intelligible throughout; no clipping, clicks at edits or abrupt cuts.
- Sync checked at every planned hit point.

## Common failures

- Using a popular song without a sync license.
- Single-pass loudnorm with audible pumping where two-pass linear would do.
- Normalising the stem instead of the final mix.
- Music masking VO on phone speakers.
- Reporting loudness from the target value rather than a measurement.

## Outputs

- Final mix, stems, edited VO; updated assets manifest entries.
- Loudness measurement output; mix notes.
- Agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- All audio is licensed and recorded; final mix measured at the agreed target with true
  peak under ceiling; sync and intelligibility checked by listening.
- Status follows `.ship-anything/policies/status-model.md`.
