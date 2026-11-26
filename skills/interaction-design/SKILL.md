---
name: interaction-design
description: >-
  Designs how interfaces respond to people: flows, navigation, feedback, affordances,
  forms, error prevention and recovery, undo, optimistic updates, gestures, drag and drop,
  keyboard shortcuts and state transitions, specified as state machines and interaction
  specs. Use for complex flows, multi-step forms, editors, gestures or when users get lost
  or make avoidable errors.
license: MIT
metadata:
  category: design
  version: "0.1.0"
  agents: [ux-agent, frontend-agent, motion-agent]
---

# Interaction Design

## Purpose

Specify behaviour, not just appearance: what each input does, what the system shows in
response, how errors are prevented and recovered, so implementers do not improvise and
users always know where they are and what happened.

## When to use

- Multi-step flows (onboarding, checkout, wizards), editors, builders, dashboards with
  filtering, bulk actions, drag and drop, gestures, keyboard shortcut systems.
- Users report confusion, accidental destructive actions, or lost work.
- A component has more than a couple of states and transitions.

Do not use when:

- Visual direction is the question → `ui-ux-design`.
- Animation timing/easing implementation → `motion-design`.
- Simple static pages or content sites with standard links.
- Pure API/backend behaviour with no user-facing interaction.

## Inputs

- User journeys and acceptance criteria from the brief/task contract.
- `docs/design-direction.md`; existing UI or prototype.
- Data model constraints (latency, validation rules, permissions).

## Procedure

1. **Map the flow.** List entry points, steps, decisions, exits and failure paths for
   each journey. Note where the user can leave and come back.
2. **Model states.** For each non-trivial component or flow write a state machine:
   states, events, transitions, guards. Example states for a save action:
   `idle → saving → saved | failed(retryable) | conflict`. Implementations may use XState
   or a reducer; the spec is library-agnostic.
3. **Feedback within budget.** Acknowledge every input immediately (pressed state, cursor,
   optimistic UI). Keep interactions responsive enough to meet INP ≤ 200 ms. Show progress
   for anything that takes noticeably long; show determinate progress when duration is known.
4. **Prevent errors.** Constrain inputs (pickers, masks, sensible defaults), validate
   inline on blur, disable submit only with a visible reason, confirm only destructive
   and irreversible actions — prefer undo over confirmation where reversible.
5. **Recover from errors.** Message states cause and next step; preserve user input on
   failure; retries are idempotent; offline/timeout states defined.
6. **Navigation and orientation.** Current location visible; back button behaves as
   expected (URL reflects state for filters, tabs, pagination); deep links restore state.
7. **Direct manipulation.** Drag and drop, swipe, pinch: specify hit areas, thresholds,
   cancel behaviour, and a non-drag alternative (WCAG 2.5.7). Gestures track 1:1 with the
   pointer and settle with velocity-aware motion.
8. **Keyboard model.** Shortcuts discoverable (menu hints, `?` overlay), not overriding
   browser/assistive-tech keys, scoped to context, documented.
9. **Write the spec.** For each component/flow: states table, events, copy, timing
   (reference motion tokens), keyboard map, edge cases. Store in `docs/design/interactions/`.
10. **Validate.** Prototype or test in the running app; walk each failure path; record
    what was exercised.

## Decision rules

| Situation | Decision |
|---|---|
| Reversible destructive action | Do it, offer undo (toast with action) instead of a confirm dialog |
| Irreversible action (delete account, payment) | Explicit confirm naming the object; type-to-confirm for high impact |
| Server usually succeeds quickly and conflict is rare | Optimistic update with rollback on failure |
| Long operation | Background it, show progress, notify on completion |
| Form > ~7 fields | Group into sections; multi-step only if steps are meaningfully separate |
| Filter/sort/tab state | Encode in URL |

## Tools

- State machine notation (tables or XState visualiser); flow diagrams (Mermaid).
- Browser tool for walking the implemented flow.
- Optional upstream: `emil-kowalski-skills` (see .ship-anything/registry.yaml) — gestures, interaction details and `break-ui` stress testing.

## Quality standards

- Every flow has failure, empty, offline/timeout and cancel paths specified.
- Every destructive action has undo or explicit confirmation.
- Every drag/gesture has a single-pointer, keyboard-accessible alternative.
- User input is never lost on validation or network errors.

## Common failures

- Specs that cover only the happy path.
- Confirmation dialogs on everything, training users to click through.
- Optimistic UI without rollback, leaving phantom data.
- Disabled submit buttons with no explanation.
- Filter state lost on reload or back navigation.

## Outputs

- Flow diagrams and state tables in `docs/design/interactions/`.
- Keyboard map and copy for states.
- Review findings when assessing an implementation.
- Agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- Every in-scope flow has states, transitions, failure paths and copy specified.
- Implemented flows walked in the running app (or report states not exercised).
- Status follows `.ship-anything/policies/status-model.md`.
