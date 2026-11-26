---
name: threejs-production
description: >-
  Builds production-grade real-time 3D on the web with Three.js or React Three Fiber:
  scene architecture, glTF loading with Draco/meshopt geometry and KTX2 textures, draw
  call and texture-memory budgets, disposal, DPR clamping, mobile GPU limits, no-WebGL
  fallbacks, reduced motion, scroll-driven scenes and product configurators. Use for any
  WebGL/WebGPU scene, 3D hero, viewer or configurator.
license: MIT
metadata:
  category: creative-production
  version: "0.1.0"
  agents: [threejs-agent]
---

# Three.js Production

## Purpose

Ship 3D on the web that loads fast, runs smoothly on ordinary phones, degrades
gracefully, and does not leak memory — measured, not assumed.

## When to use

- 3D hero sections, product viewers, configurators, data/spatial visualisations, scroll scenes.
- Integrating glTF assets produced by `blender-production` / `3d-product-production`.
- Performance or memory problems in an existing Three.js/R3F app.

Do not use when:

- Modelling, texturing or rendering stills/animations offline → `blender-production`.
- A static image or short video would communicate as well; propose that instead.
- Pure 2D UI motion → `motion-design`.

## Inputs

- Brief: purpose of the 3D, target devices, interaction model, fallbacks required.
- Assets (glTF/GLB) with provenance per `asset-pipeline`.
- Stack: React (→ R3F option) or vanilla/other framework.

## Procedure

1. **Choose architecture** (see Decision rules): R3F + drei in React apps, vanilla
   Three.js otherwise or for tightly controlled render loops.
2. **Set budgets before building** and write them in the report. Typical starting
   points to validate on the slowest target device, not guarantees: draw calls in the low
   hundreds or fewer for mobile, total texture memory sized to device (KTX2 keeps GPU
   memory compressed), geometry triangle count driven by measured frame time. Measure with
   `renderer.info.render.calls`, `renderer.info.memory`, and r3f-perf / stats.js.
3. **Asset pipeline.** Optimise GLB with gltf-transform:
   `npx @gltf-transform/cli optimize in.glb out.glb --compress meshopt --texture-compress ktx2`
   (or `--compress draco`). Wire decoders: `DRACOLoader` / `MeshoptDecoder` and
   `KTX2Loader.detectSupport(renderer)`, hosting decoder files locally or from a pinned URL.
4. **Renderer.** `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` (R3F: `dpr={[1, 2]}`);
   `antialias` only if needed; correct color management (`outputColorSpace = SRGBColorSpace`,
   tone mapping chosen deliberately); render on demand (`frameloop="demand"`) for static
   viewers.
5. **Reduce draw calls.** Merge static meshes, share materials, use `InstancedMesh` for
   repeats, texture atlases, LODs for distant objects, frustum culling left on.
6. **Lighting.** Prefer baked lighting/AO and an HDR environment map (prefiltered by
   PMREM) over many dynamic lights; limit real-time shadows to one light with a tight
   shadow camera.
7. **Lifecycle and disposal.** On unmount/route change dispose geometries, materials,
   textures, render targets and controls; cancel `requestAnimationFrame`; remove listeners.
   Verify `renderer.info.memory` returns to baseline after navigating away and back.
8. **Loading UX.** Show progress (`LoadingManager` / drei `useProgress`), a poster image
   first, lazy-load the canvas below the fold, keep LCP on non-3D content where possible.
9. **Fallbacks.** Detect WebGL (`WebGL2RenderingContext` / try `getContext`) and handle
   `webglcontextlost`; render a static image or video when unavailable. Under
   `prefers-reduced-motion: reduce` stop auto-rotation, parallax and scroll-linked camera
   moves.
10. **Scroll-driven scenes.** Map normalised scroll progress to a timeline (GSAP
    ScrollTrigger or drei `ScrollControls`); keep native scrolling; content readable
    without the scene.
11. **Configurators.** Model options as state (variant → material/mesh swaps), preload
    variants likely next, persist selection in URL, keep swaps under a frame where
    possible by reusing materials and toggling visibility; provide accessible
    non-canvas controls (real buttons/selects with labels).
12. **Verify.** Run on a real mid-range phone or throttled emulation; record FPS/frame
    time, draw calls, memory, load time; screenshots of desktop, mobile, fallback and
    reduced-motion states. Never claim performance numbers without measurement output.

## Decision rules

| Situation | Decision |
|---|---|
| React app, declarative scene, UI overlays | React Three Fiber + drei |
| Non-React app, custom render loop, minimal bundle | Vanilla Three.js |
| Geometry heavy | meshopt (fast decode) or Draco (smaller geometry); test both if size matters |
| Textures > a few MB total | KTX2 (ETC1S for color/albedo, UASTC for normal maps) |
| Static product viewer | Render on demand, not continuous loop |
| Low-end device detected or frame time misses budget | Lower DPR, disable shadows/postprocessing, swap LOD |
| WebGPU wanted | Use only with WebGL fallback; verify browser support at build time |

## Tools

- three, @react-three/fiber, @react-three/drei, r3f-perf/stats.js, Spector.js.
- @gltf-transform/cli, gltfpack (meshoptimizer), KTX-Software (`toktx`).
- Optional upstream (reference only): `motion-tools-and-skills` (see .ship-anything/registry.yaml) — Three.js+GSAP film patterns; adapt with attribution, never auto-install.

## Quality standards

- Budgets written down and measured values reported against them.
- No memory growth after repeated mount/unmount cycles (measured).
- Fallback and reduced-motion states exist and are screenshotted.
- 3D does not block LCP of primary content; canvas has an accessible text alternative.
- All assets have recorded provenance and license (`asset-pipeline`).

## Common failures

- Uncapped DPR on 3× phones; full-resolution PNG textures uploaded uncompressed.
- New materials/geometries created every render in R3F.
- Missing disposal causing leaks across route changes.
- Continuous render loop for a static scene draining battery.
- Decoder files fetched from an unpinned CDN path that later breaks.

## Outputs

- Scene code, optimised assets, decoder setup, fallback assets.
- Performance report (device, frame time, draw calls, memory, load size).
- Screenshots of each state.
- Agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- Scene meets its written budgets on the target device class, with measurements cited.
- Fallback, reduced-motion and disposal verified.
- Status follows `.ship-anything/policies/status-model.md`.
