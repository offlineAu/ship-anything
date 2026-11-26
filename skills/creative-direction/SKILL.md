---
name: creative-direction
description: >-
  Sets the creative direction for brand-heavy and media work: concept and key message,
  audience, moodboard of references with what to borrow, script and storyboard, style
  frames, production plan and structured review rounds. Use for launch videos, product
  films, campaign or marketing surfaces, 3D hero concepts, and any creative deliverable
  that needs an agreed idea before production starts.
license: MIT
metadata:
  category: creative-production
  version: "0.1.0"
  agents: [ux-agent, blender-agent, video-agent]
---

# Creative Direction

## Purpose

Agree on one clear idea and how it looks and sounds before anyone renders anything, so
production effort goes into executing a concept the user has approved.

## When to use

- Launch films, product demos, explainers, social campaigns, brand-forward landing
  pages, 3D hero scenes, key visuals.
- The brief says "make it look amazing" without specifics.
- Several production agents (video, 3D, motion) must share one look.

Do not use when:

- Product UI direction for an application → `ui-ux-design` (it may borrow this skill's
  references step).
- Pure execution of an already approved storyboard → `remotion-production`,
  `video-editing`, `blender-production`.
- Brand identity creation (logo, trademark) — that is a user/brand-owner decision;
  this skill can propose options for the user to decide.

## Inputs

- Product brief, audience, key message, call to action, deadline, channels.
- Brand assets and guidelines; previous campaigns.
- Constraints: budget, licensed assets available, tools, legal claims allowed.

## Procedure

1. **Brief back.** One paragraph: audience, the single message, desired feeling, where it
   runs, success criteria. Confirm with the user if anything is assumed.
2. **Concepts.** Write 2–3 distinct concepts, each with a one-line idea, why it fits the
   audience, a visual treatment and risks. Recommend one.
3. **Moodboard.** 6–12 references (links or user-provided images) annotated with the
   specific element to borrow (pacing, palette, type, camera, lighting). Reference only;
   never copy protected material into deliverables. Note references' sources in the
   moodboard, not the assets manifest, since they are not shipped.
4. **Script.** For time-based media: a two-column script (picture | sound/VO) with
   timings. Keep claims accurate to what the product actually does.
5. **Storyboard.** One frame per shot: shot number, duration, framing, motion, text on
   screen, audio cue. Plan each target aspect ratio (16:9, 9:16, 1:1) per shot rather than
   cropping later.
6. **Style frames.** Produce 2–4 high-fidelity frames in the real tool (Remotion still,
   Blender render, HTML screenshot) defining type, color, lighting, texture. These are
   the contract for production.
7. **Production plan.** Shot list mapped to agents/skills, asset list with provenance plan
   (`asset-pipeline`), music/VO plan (`sound-design`), render specs, review checkpoints.
8. **Review rounds.** At each checkpoint (concept → storyboard → style frames → rough cut
   → final) present artefacts with specific questions; record decisions in
   `.ship-anything/state/decisions.md`. Feedback is consolidated into a numbered change
   list before work resumes.
9. **Final review.** Compare the delivered file against the brief, style frames and
   checklist (message clear in first seconds, brand consistent, captions, loudness,
   formats). Only review files that exist and were opened.

## Decision rules

| Situation | Decision |
|---|---|
| Brief vague | Write brief-back with explicit assumptions; get confirmation before style frames |
| User picks elements from several concepts | Merge into one concept and re-confirm |
| Reference is a competitor's work | Borrow principles only; no recognisable copying |
| Concept needs paid talent, stock or services | Escalate for authorization (money) |
| Product claims in script | Must match verified product behaviour; flag any unverifiable claim |

## Tools

- Markdown for briefs/scripts; image boards via any tool the user has (Figma, plain HTML
  grid, folder of images).
- Production tools via their skills for style frames.
- Optional upstream: `anthropic-frontend-design` (see .ship-anything/registry.yaml) — for web-surface aesthetics.
- Reference: `motion-tools-and-skills` and `dolly` (see .ship-anything/registry.yaml) — launch-film structure and review loops; adapt with attribution.

## Quality standards

- One concept approved by the user before production.
- Every moodboard reference annotated with what is borrowed.
- Style frames rendered in the production tool, not described only in words.
- Every review round recorded with decisions and the change list.

## Common failures

- Starting renders before a concept is agreed, then redoing them.
- Moodboards of beautiful images with no stated reason.
- Scripts that over-promise features.
- Designing only for 16:9 and cropping for vertical later.
- Vague feedback ("make it pop") passed straight to production.

## Outputs

- `docs/creative/brief.md`, concepts, moodboard, script, storyboard, style frames,
  production plan (or the contract path).
- Decision records; agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- Concept, storyboard and style frames approved by the user (recorded), production plan
  handed to the producing agents, and final deliverable reviewed against the brief.
- Status follows `.ship-anything/policies/status-model.md`.
