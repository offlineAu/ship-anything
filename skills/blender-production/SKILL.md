---
name: blender-production
description: >-
  Produces 3D assets, stills and animations in Blender via headless Python scripting
  (blender -b -P script.py) or a Blender MCP bridge when available: scene units and
  scale, modelling cleanup, PBR materials, lighting, camera animation, Cycles/EEVEE
  rendering, and glTF export tuned for the web with polycount and texture budgets. Use
  for any Blender modelling, rendering or export task.
license: MIT
metadata:
  category: creative-production
  version: "0.1.0"
  agents: [blender-agent]
---

# Blender Production

## Purpose

Create reproducible Blender output — models, renders, animations, web-ready glTF — from
scripts or a live bridge, and report only what was actually rendered and inspected.

## When to use

- Modelling, cleanup, materials, lighting or camera work in Blender.
- Rendering stills, turntables or animations (Cycles or EEVEE).
- Exporting glTF/GLB for web use (handed to `threejs-production`).

Do not use when:

- Real-time scene implementation in the browser → `threejs-production`.
- 2D motion graphics or video editing → `remotion-production` / `video-editing`.
- Blender is not installed and no bridge exists: report BLOCKED with install steps
  rather than simulating output.

## Inputs

- Brief: deliverable type (GLB, PNG sequence, MP4), resolution, frame range, style frames.
- Source assets with provenance (`asset-pipeline`); reference images.
- Target budgets (polycount, texture sizes) from `threejs-production` if for web.

## Procedure

1. **Detect environment.** `blender --version` (record version). If an MCP bridge is
   available, query addon status and scene info first. Bridges execute arbitrary Python in
   the user's Blender session — confirm the user enabled it; never save over their open
   file without asking.
2. **Script everything reproducible.** Write `scripts/blender/<task>.py` and run
   `blender -b input.blend -P scripts/blender/<task>.py -- --out renders/` (arguments after
   `--` read via `sys.argv[sys.argv.index('--')+1:]`). Keep `.blend` source and script in
   the repo or the contract path.
3. **Units and scale.** Metric, unit scale 1.0, 1 Blender unit = 1 metre (glTF expects
   metres, +Y up after export). Apply transforms (`bpy.ops.object.transform_apply`)
   before export; origin at a meaningful pivot (base centre for products).
4. **Geometry.** Clean topology: no n-gon shading artefacts, merged doubles, consistent
   normals (recalculate outside), UVs unwrapped without overlaps where baking. Decimate or
   retopologise to the polycount budget.
5. **Materials.** Principled BSDF only for web assets (it maps to glTF PBR metallic-
   roughness). Look up nodes by type, not name. Textures: base color (sRGB), and
   non-color data for metallic/roughness/normal/AO. Bake procedural nodes to images before
   glTF export — procedural shaders do not export.
6. **Lighting.** HDRI environment for products plus key/fill/rim area lights as needed;
   bake AO/lighting to textures when the web scene will not light dynamically.
7. **Camera animation.** Keyframe on a named camera; use F-curve easing deliberately; set
   frame range and fps on the scene; avoid motion that cannot be matched in the web scene
   if the two must align.
8. **Render.** Choose engine per Decision rules; set resolution, samples, denoising,
   color management (AgX or Filmic/Standard — record which), output format (PNG/EXR
   sequence for animation, then encode with `video-editing`). Command:
   `blender -b scene.blend -E CYCLES -o //renders/frame_#### -s 1 -e 120 -a`
   (`-f 1` for a single frame).
9. **glTF export.** `bpy.ops.export_scene.gltf(filepath='out.glb', export_format='GLB',
   use_selection=True, export_apply=True, export_yup=True, export_animations=...)`;
   leave compression to gltf-transform downstream unless the brief says otherwise.
   Check exporter parameter names against the installed Blender version.
10. **Inspect output.** Confirm files exist and are non-empty (`ls -l`), view rendered
    frames (image viewer or the bridge's look/screenshot tool), validate GLB with
    `npx gltf-validator out.glb` or `npx @gltf-transform/cli inspect out.glb` and record
    triangle count, materials, texture sizes.

## Decision rules

| Situation | Decision |
|---|---|
| Photoreal stills, glass/caustics, final marketing renders | Cycles (GPU if available) |
| Fast previews, stylised looks, long animations on limited time | EEVEE |
| Web asset | Principled BSDF only, baked textures, power-of-two textures, budgets from threejs-production |
| Imported/generated model | Rescale using its bounding box, place on ground, record provenance |
| Render time unknown | Render a single low-sample frame first and extrapolate before committing |
| Paid generation/asset service | Requires user authorization (`.ship-anything/policies/authorization.md`) |

## Tools

- Blender CLI (`-b`, `-P`, `-E`, `-o`, `-f`, `-a`), bpy.
- Blender MCP bridge when the host provides one (scene info, execute code, viewport look).
- gltf-validator, @gltf-transform/cli for inspection.
- Optional upstream (reference only): `motion-tools-and-skills` (see .ship-anything/registry.yaml) — Blender sub-skills; adapt with attribution after review.

## Quality standards

- Every claimed render or export has a file path, size, and was visually inspected.
- Scale verified (bounding box dimensions in metres reported).
- GLB validates with zero errors; polycount and texture sizes within budget.
- Scripts re-run from a clean checkout produce the same output.

## Common failures

- Unapplied scale/rotation leading to giant or rotated models in Three.js.
- Procedural materials exported to glTF as flat grey.
- Normal maps marked sRGB.
- Claiming "rendered" when the command errored or produced black frames.
- Hardcoded localized node names or enum values breaking on other installs.

## Outputs

- `.blend` source, scripts, renders (PNG/EXR sequences or stills), GLB exports.
- Inspection notes: dimensions, triangle count, materials, texture list, validator output.
- Agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- Deliverables exist at the contract path, inspected, with validator/inspect output cited.
- Budgets met or deviations reported.
- Status follows `.ship-anything/policies/status-model.md`.
