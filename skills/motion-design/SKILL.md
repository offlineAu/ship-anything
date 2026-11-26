---
name: motion-design
description: >-
  Designs and implements purposeful UI and web motion: duration and easing tokens,
  enter/exit and state transitions, choreography, animating transform and opacity only,
  prefers-reduced-motion alternatives, frame-budget performance, and choosing CSS versus
  Motion (Framer Motion) versus GSAP. Use for animations, transitions, micro-interactions,
  scroll effects and motion reviews.
license: MIT
metadata:
  category: design
  version: "0.1.0"
  agents: [motion-agent, threejs-agent]
---

# Motion Design

## Purpose

Use motion to explain change — where something came from, what it became, what is
happening — quickly and smoothly, and never at the cost of performance or of people who
are made unwell by movement.

## When to use

- Defining motion tokens for a design system.
- Implementing transitions, enter/exit animations, micro-interactions, scroll-linked effects.
- Reviewing animations that feel slow, janky, or gratuitous.

Do not use when:

- Rendered video output → `remotion-production` / `video-editing`.
- 3D scene animation pipelines → `threejs-production` / `blender-production`
  (this skill still governs UI-level motion and reduced-motion rules there).
- The request is to add motion with no communicative purpose; push back instead.

## Inputs

- `docs/design-direction.md` motion section; token files.
- Components/flows in scope and their state specs (`interaction-design`).
- Stack (framework, existing animation libraries).

## Procedure

1. **Purpose per animation.** Write one line: what change it explains (feedback,
   orientation, continuity, attention). No purpose → no animation.
2. **Tokens.** Define durations and easings as tokens, e.g.
   `--duration-instant` (≈100ms, press feedback), `--duration-fast` (≈150–200ms, small UI),
   `--duration-base` (≈250–300ms, panels, dialogs), `--duration-slow` (≈400–500ms, large
   or page-level); `--ease-out` (entering), `--ease-in` (exiting), `--ease-in-out`
   (moving on screen). These are starting ranges; tune per product and keep the token
   set small. Frequently repeated interactions get shorter or no animation.
3. **Properties.** Animate `transform` and `opacity` (and `filter` sparingly). Avoid
   animating `width`, `height`, `top`, `left`, `margin` — they trigger layout. Use FLIP
   or layout-animation features for size/position changes.
4. **Choose the engine** (see Decision rules). Prefer the lightest that does the job.
5. **Interruptibility.** Animations can be interrupted and reversed mid-flight without
   jumps (CSS transitions or spring-based libraries; avoid non-interruptible keyframes
   for interactive state).
6. **Reduced motion.** Under `@media (prefers-reduced-motion: reduce)` replace movement
   with opacity/instant changes, stop parallax and autoplay loops, keep essential
   feedback. Apply to JS libraries too (Motion `useReducedMotion`/`MotionConfig
   reducedMotion="user"`; GSAP `gsap.matchMedia()`).
7. **Performance.** Keep work off the main thread where possible; `will-change` only
   during the animation; avoid animating many large blurred/shadowed layers. Profile with
   DevTools Performance panel at 4–6× CPU throttling; look for dropped frames and long tasks.
8. **Scroll-driven.** Prefer CSS scroll-driven animations (`animation-timeline: view()`)
   where supported, with a static fallback; otherwise GSAP ScrollTrigger. Never hijack
   native scroll speed for content pages.
9. **Verify.** Record or screenshot key frames, test with reduced motion on, test on a
   throttled CPU, and confirm no layout shift is introduced (CLS ≤ 0.1).

## Decision rules

| Need | Engine |
|---|---|
| Hover/press, simple enter/exit, state transitions | CSS transitions/keyframes |
| React app with layout animations, exit animations, gestures, springs | Motion (formerly Framer Motion) |
| Complex timelines, sequencing many elements, SVG morphing, scroll scenes, canvas/WebGL coordination | GSAP (check its current license terms for the use case) |
| View-to-view page transitions | View Transitions API with fallback |
| Duration conflict between skills | `emil-kowalski-skills` guidance wins for product UI motion |

## Tools

- Browser DevTools Performance and Animations panels; Lighthouse for CLS/INP.
- Optional upstream: `emil-kowalski-skills` (see .ship-anything/registry.yaml) — motion authority: `emil-design-eng`, `animate`, `review-animations`, `improve-animations`, `animation-performance`.
- Optional upstream: `impeccable` (see .ship-anything/registry.yaml) — `animate` only when emil skills are not in use (design stack rule: at most two supporting skills).

## Quality standards

- Every animation has a stated purpose and uses tokens.
- Only compositor-friendly properties animated, or the exception is justified.
- Reduced-motion behaviour implemented for CSS and JS animations and tested.
- No dropped-frame hitches on throttled profiling of key interactions; evidence saved.
- Nothing flashes more than three times per second.

## Common failures

- Long, decorative easing on frequent actions (menus, tabs) making the UI feel slow.
- `ease-in` on entrances, making them feel sluggish.
- Animating height/top causing layout thrash.
- Reduced-motion handled in CSS while JS libraries keep animating.
- Scroll-jacking and parallax on content pages.

## Outputs

- Motion tokens in the token source; animation code in owned files.
- Motion spec (purpose, trigger, duration token, easing, reduced-motion alternative).
- Profiling evidence (trace screenshot or notes) in the report.
- Agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- All in-scope animations implemented with tokens and reduced-motion alternatives.
- Throttled profiling and reduced-motion checks performed and cited.
- Status follows `.ship-anything/policies/status-model.md`.
