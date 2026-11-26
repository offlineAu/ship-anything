# assets/demos

**No demo videos or recordings exist yet.** This directory is a placeholder. Demos are built
from recorded real runs only: speeding up is fine, staging fake output is not. Style:
[Brand guidelines §8](../../docs/branding/brand-guidelines.md#8-demo-video-style-remotion-friendly).

## What will go here

One folder per demo:

```
assets/demos/<yyyy-mm-dd>-<slug>/
  run.log              # raw terminal/session log of the real run (redacted of secrets and personal paths)
  run.md               # what was run: date, OS, Node version, coding agent + version, command(s), prompt
  plan.yaml            # copy of .ship-anything/state/plan.yaml produced by the run (if any)
  <slug>-1920x1080.mp4 # main cut
  <slug>-1080x1350.mp4 # 4:5 social cut
  <slug>-1080x1920.mp4 # 9:16 social cut
  <slug>.webm          # web embed (VP9 or AV1)
  <slug>-poster.png    # first meaningful frame, also used as the reduced-motion fallback
  <slug>.vtt           # captions
  LICENSES.md          # fonts, music, any third-party footage
  remotion/            # optional: Remotion composition source for the cut
```

Planned demos (none recorded yet): `init-claude` (install + agents visible), `doctor-and-validate`,
`skills-add-quarantine` (add → review → approve), and an end-to-end example app run once one exists.

## Specs

- 30 fps, H.264 High profile MP4 (yuv420p, `+faststart`), target under 20 MB for the main cut.
- 30–90 s for overviews; a title card states recording date, tool versions and the speed-up factor.
- Captions in WebVTT; burned-in captions on social cuts.
- Audio optional; loudness about −16 to −18 LUFS integrated; licensed tracks only.
- Large binaries may move to a release attachment or Git LFS later. Keep `run.log` and `run.md` in git either way.
