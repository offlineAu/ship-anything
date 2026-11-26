---
name: 3d-product-production
description: >-
  Runs the end-to-end 3D product pipeline: reference and CAD/model intake, Blender
  preparation (scale, materials, UVs, baking), glTF export, optimisation with
  gltf-transform (meshopt/Draco, KTX2, resize), and Three.js/R3F presentation as a
  viewer, hero or configurator with fallbacks. Use for product visualisation, 3D
  e-commerce viewers, configurators and launch-page 3D heroes.
license: MIT
metadata:
  category: creative-production
  version: "0.1.0"
  agents: [threejs-agent, blender-agent]
---

# 3D Product Production

## Purpose

Coordinate the hand-offs between Blender and the web so a product model arrives in the
browser accurate, light and attractive, with each stage verified before the next.

## When to use

- A physical or digital product must be shown in 3D on the web.
- Converting CAD/OBJ/FBX/USD sources into a web viewer or configurator.
- Rebuilding a slow or inaccurate existing 3D product page.

Do not use when:

- Only a Blender render is needed → `blender-production`.
- Only an in-browser scene without asset preparation → `threejs-production`.
- Product photos would serve the goal better (state this tradeoff to the user).

## Inputs

- Source model(s) and their provenance/license (`asset-pipeline`).
- Product references: photos, dimensions, material/finish list, variant matrix.
- Target page, devices, interactions (orbit, zoom, variants, AR) and fallbacks.

## Procedure

1. **Spec.** Write the variant matrix (colors, materials, parts), required views, real
   dimensions, and budgets agreed with `threejs-production` (triangles, textures, GLB
   transfer size). Record in the task contract or `docs/3d/spec.md`.
2. **Intake.** Import source into Blender; record source format and units. CAD (STEP)
   usually needs conversion and tessellation first; record the tool used.
3. **Prepare in Blender** (`blender-production`): real-world scale in metres, apply
   transforms, pivot at base centre, merge parts by material, separate meshes only where
   variants swap parts, clean normals, UV unwrap, bake AO and any procedural detail.
4. **Materials.** Principled BSDF per finish; name materials by variant slot
   (e.g. `body`, `trim`) so the web app can swap them. Use KHR material extensions
   (transmission, clearcoat, sheen) only if the target renderer supports them.
5. **Export.** GLB with applied transforms, +Y up. One GLB with all variant parts, or a
   base GLB plus variant GLBs when variants are large.
6. **Optimise.**
   ```bash
   npx @gltf-transform/cli inspect product.glb
   npx @gltf-transform/cli optimize product.glb product.opt.glb \
     --compress meshopt --texture-compress ktx2 --texture-size 2048
   npx @gltf-transform/cli inspect product.opt.glb
   ```
   Compare before/after sizes and visually check for compression artefacts (normal maps
   and fine text are sensitive; fall back to UASTC or WebP for those textures).
7. **Validate** with `npx gltf-validator product.opt.glb`; zero errors required.
8. **Present** (`threejs-production`): environment lighting matched to brand, contact
   shadow, camera limits that keep the product framed, poster image for first paint,
   on-demand rendering, DPR clamp, accessible variant controls, URL-persisted selection.
9. **Optional AR.** `model-viewer` with USDZ for iOS Quick Look if requested; verify on device.
10. **Verify** visually (screenshots per variant, mobile and desktop), check dimensions
    against the spec, measure load size and frame time on the target device class, test
    no-WebGL and reduced-motion fallbacks.

## Decision rules

| Situation | Decision |
|---|---|
| Few variants, small textures | Single GLB, material swaps |
| Many large variant parts | Base GLB + lazily loaded variant GLBs |
| Hero only, no interaction | Consider a pre-rendered video/image sequence instead of live 3D |
| Accuracy-critical (dimensions, colors) | Product owner signs off screenshots before release |
| Source is a third-party/marketplace model | Confirm license permits web redistribution before use |

## Tools

- Blender (headless or MCP bridge), @gltf-transform/cli, gltf-validator, KTX-Software.
- Three.js / React Three Fiber / drei, `<model-viewer>` for simple viewers and AR.
- Optional upstream (reference only): `motion-tools-and-skills` (see .ship-anything/registry.yaml) — `3d-product` pattern; adapt with attribution after review.

## Quality standards

- Dimensions within the stated tolerance of the spec; scale verified in metres.
- GLB validates with zero errors; transfer size and frame time within budget, measured.
- Every variant screenshotted and reviewed.
- Provenance and license recorded for every source model and texture.

## Common failures

- Skipping the inspect step and shipping 40 MB GLBs.
- Over-compressed normal maps causing blotchy surfaces.
- Variant material names lost or renamed during export, breaking swaps.
- Model renders but at wrong scale or upside down in the viewer.
- Using a downloaded model without checking redistribution rights.

## Outputs

- Prepared `.blend`, source and optimised GLB(s), poster images.
- Viewer/configurator code; inspect and validator output; screenshots per variant.
- Agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- Optimised GLB validated, within budget, and rendered correctly in the target page for
  every variant, with screenshots and measurements cited.
- Fallbacks verified; provenance recorded.
- Status follows `.ship-anything/policies/status-model.md`.
