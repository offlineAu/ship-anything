---
name: 3d-product
description: >-
  Produces interactive 3D experiences and assets: product viewers/configurators, WebGL
  scenes, Blender-modelled or sourced models optimised to GLB, with licensing provenance,
  performance budgets, fallbacks and accessibility. Creative workflow; composes into web apps.
level: [L2, L3, L4]
required_agents: [threejs-agent, qa-agent]
optional_agents: [blender-agent, ux-agent, motion-agent, frontend-agent, performance-agent]
required_skills: [threejs-production, 3d-product-production, asset-pipeline]
composes: []
---

# 3D product

## Purpose

Deliver 3D that loads fast, looks intentional and degrades gracefully: optimised GLB assets
with recorded provenance, a Three.js (or React Three Fiber) scene or viewer component,
interaction that works with mouse, touch and keyboard, and a static fallback.

## When to use

- Product viewers (rotate/zoom), configurators (materials, variants), hero 3D scenes,
  interactive showcases, asset production for video renders.
- Composed into `website`, `web-app` or `fullstack-platform` as a component track.

Do not use when: a static image or pre-rendered video meets the goal (record the decision,
use `video-production` or plain images); game development with physics/netcode (out of scope).

## Inputs

- Product references (user-owned photos, CAD, dimensions) or permission to source assets.
- Target devices, per-project asset budgets (triangles, texture resolution, file size) —
  set in the task contract from the brief; if absent, architecture/perf sets them and
  records them as assumptions.
- `docs/design-direction.md` (lighting mood, materials, palette).

## Agents

- `threejs-agent` (required): scene, viewer component, loaders, interaction, fallbacks.
- `qa-agent` (required): cross-device checks, interaction tests, visual baselines.
- `blender-agent` (optional): modelling, UVs, baking, export scripts (`assets/3d/**`).
- `ux-agent` (optional): interaction model and art direction when none exists.
- `motion-agent` (optional): camera moves/scroll choreography beyond basic orbit controls.
- `frontend-agent` (optional): mounting the component into pages it owns.
- `performance-agent` (optional; required when budgets are tight or mobile is primary).

## Skills and tools

`threejs-production`, `3d-product-production`, `asset-pipeline`; optional `blender-production`,
`creative-direction`, `motion-design`, `performance-optimization`, `visual-regression`.
Tools: headless Blender (`blender -b <file>.blend --python <script>.py`), glTF Transform
(`npx @gltf-transform/cli inspect <in>.glb`, `... optimize <in>.glb <out>.glb`), Khronos
glTF validator, Playwright screenshots of the canvas.

## Task graph

```
id     agent               objective                                  depends_on       wave  owns
3D-01  ux-agent            art direction: lighting, materials,        -                1     docs/design/3d/**
                           camera, interaction spec (optional)
3D-02  blender-agent       model/source assets; record license +      3D-01            2     assets/3d/**, assets/3d/scripts/**
                           source per asset; scripted GLB export
3D-03  threejs-agent       viewer component against placeholder       3D-01            2     src/three/**
                           GLB: loader, controls, lights, fallback
3D-04  orchestrator        asset pipeline step: optimise GLBs,        3D-02            3     public/models/**, build scripts
                           inspect vs budgets, commit outputs
3D-05  threejs-agent       swap in final assets, variants/config      3D-03, 3D-04     4     src/three/**
                           state, keyboard controls, reduced motion
3D-06  motion-agent        camera choreography/scroll sequences       3D-03            4     src/motion/**
                           (optional)
3D-07  frontend-agent      mount component, poster image, lazy        3D-05            5     host page files only
                           load on visibility (optional if composed)
3D-08  qa-agent            device matrix, interaction tests, canvas   3D-07 (or 3D-05) 6     tests/**
                           visual baselines, fallback path
3D-09  performance-agent   load time, frame rate on named devices,    3D-07 (or 3D-05) 6     perf/**
                           GPU memory (optional)
3D-10  threejs-agent /     fix findings                               3D-08, 3D-09     7     per finding
       blender-agent
```

## Parallel opportunities

- 3D-02 ∥ 3D-03: assets and viewer code are disjoint; the viewer uses a placeholder GLB.
- 3D-05 ∥ 3D-06: viewer internals vs motion modules in `src/motion/**`.
- 3D-08 ∥ 3D-09: QA tests vs perf measurements, both read-only on source.

## Sequential requirements

- Art direction before modelling when ux-agent is used.
- Asset optimisation and budget check (3D-04) before final assets enter the viewer.
- Licensing provenance recorded before any third-party asset is committed; unclear license
  → do not use (user decision).
- Mounting into host pages only after the component is functional (avoids churn in pages).

## Acceptance criteria

- Every shipped asset has source, author, license and modification note in `assets/3d/LICENSES.md`.
- Each optimised GLB is within the contract's budgets per `gltf-transform inspect` output.
- Viewer supports pointer, touch and keyboard (rotate/zoom/reset); controls have labels.
- Static poster/fallback renders when WebGL is unavailable or the asset fails to load.
- `prefers-reduced-motion` disables auto-rotation and camera animations.
- No 3D loading blocks first paint of the host page (lazy/deferred load).

## Quality gates

- Khronos glTF validator: 0 errors per shipped GLB.
- Build/lint/tests exit 0; qa-agent interaction tests pass on the tested browser/device list.
- Visual baselines approved for each variant/config state.
- Performance (if targets set): load time and frame rate measured on named devices; host
  page still meets its CWV targets (LCP not the canvas unless intended).
- Licensing gate: every asset in `public/models/**` appears in LICENSES.md.

## Deliverables

Source `.blend` files (or sourced originals), export scripts, optimised GLBs, viewer
component, fallback images, `assets/3d/LICENSES.md`, tests, budget report.

## Completion conditions

Viewer and assets VERIFIED by qa-agent with validator, budget and licensing evidence.
DEPLOYED/SHIPPED follow the host workflow's release; standalone without release → DEPLOYED N/A.

## Failure recovery

| Failure | Recovery |
|---|---|
| Asset over budget | Decimate, bake normals, reduce/compress textures (KTX2/WebP), split LODs; re-inspect |
| Validator errors | Fix in source .blend and re-export via script; never hand-edit binary GLB |
| Black/incorrect materials | Check color space, normal maps, environment map; compare against reference render |
| Low frame rate on mobile | Lower DPR cap, fewer lights/shadows, instancing; re-measure same device |
| License unclear | Remove asset, use placeholder, ask user; never ship unclear-license assets |
| WebGL context lost | Handle `webglcontextlost`, show fallback, offer reload; add test |
