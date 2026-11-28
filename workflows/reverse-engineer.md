---
name: reverse-engineer
description: >-
  Explains how an existing system works — undocumented codebase, API, protocol, file format
  or build — from material the user is authorized to analyse. Produces a system map,
  behavioural spec and characterization tests with every claim tagged observed or inferred.
  Never bypasses access controls.
level: [L2, L3]
required_agents: [research-agent, qa-agent]
optional_agents: [architecture-agent, security-agent, documentation-agent]
required_skills: [reverse-engineering, codebase-intelligence, repository-mapping, documentation]
composes: []
---

# Reverse engineer

## Purpose

Turn an opaque system into documented, testable knowledge: what components exist, how data
flows, what each interface accepts and returns, and which behaviours must be preserved.
The output enables safe change (`improve-existing-project`, `legacy-modernization`) or
interoperability; it is never a means to defeat protections.

## When to use

- Inherited/undocumented codebases; "how does this work?" for a system the user owns.
- Undocumented internal APIs, protocols or file formats the user is authorized to use.
- Before modernising a legacy system with no tests or docs.

Do not use when: the user lacks authorization for the target; the goal is to copy a
competitor (→ `clone-existing-product`, public surface only); the code is well documented
(→ read docs, `improve-existing-project`).

## Inputs

- Target(s): repo paths, binaries/artifacts the user possesses, API base URLs of
  environments the user controls (test/staging preferred), sample files.
- User's authorization statement: ownership, license terms, contract, or lawful
  interoperability basis (the user's legal call, recorded verbatim).
- Questions to answer (scope); without them, default to: architecture, data flow, interfaces.

## Agents

- `research-agent` (required): analysis, system map, behavioural spec.
- `qa-agent` (required): characterization tests that pin observed behaviour.
- `architecture-agent` (optional): architecture recovery for large systems, ADR backfill.
- `security-agent` (optional): when analysis touches auth, crypto, secrets or security
  boundaries; also reviews that methods stayed within authorization.
- `documentation-agent` (optional): polish docs for a human audience.

## Skills and tools

`reverse-engineering`, `codebase-intelligence`, `repository-mapping`, `documentation`;
optional `architecture-planning`, `security-audit`, `api-testing`.
Tools: `git log --stat`, `rg`, dependency graphs, language-appropriate static analysis,
debuggers/disassemblers on artifacts the user owns, HTTP capture of the user's own
traffic to environments they control, schema inference from captured samples.

Optional upstream tool: `craft-anything` (see `.ship-anything/registry.yaml`, disabled until
reviewed under `.ship-anything/policies/external-skills.md`). Its CLI/MCP analysis tools
produce evidence records with confidence and limitations that map onto RE-01/RE-02 and the
observed/inferred tags. Only after RE-00, only on targets inside the recorded scope, and in
its default Clean room mode unless that scope allows reading internals. Deep mode
(decompilation, Frida, packet capture) runs only in an isolated VM/container. Do not use its
`rebuild` loop or its global `setup`; recreating a product is `clone-existing-product`'s job,
under that workflow's originality rules.

## Task graph

```
id     agent               objective                                   depends_on     wave  owns
RE-00  orchestrator        AUTHORIZATION GATE: record basis, targets,  -              1     .ship-anything/state/decisions.md
                           allowed methods, forbidden methods
RE-01  research-agent      repo map / artifact inventory; entry        RE-00          2     docs/research/system-map.md
                           points, build, dependencies
RE-02  research-agent      interface capture: APIs, CLI, file formats, RE-00          2     docs/research/interfaces/**
                           events (from code + own test traffic)
RE-03  architecture-agent  component/data-flow recovery, backfilled    RE-01          3     docs/architecture.md, docs/adr/**
                           ADRs for evident decisions (optional)
RE-04  research-agent      behavioural spec: rules, edge cases,        RE-01, RE-02   3     docs/research/behaviour.md
                           error handling, each tagged observed/inferred
RE-05  qa-agent            characterization tests pinning RE-04        RE-04          4     tests/characterization/**
                           behaviours against the running system
RE-06  security-agent      security-relevant findings, method audit    RE-02          4     docs/security/**
                           (optional)
RE-07  documentation-agent onboarding guide from RE-01..RE-04          RE-03, RE-04   5     docs/guides/**
                           (optional)
```

Allowed: static analysis of code/artifacts the user possesses; observing the user's own
accounts and environments; reading public docs. Forbidden even if asked: bypassing auth,
DRM, licence checks or rate limits; exploiting vulnerabilities on systems the user does not
own; extracting or using secrets/keys found; load against production without authorization.

## Parallel opportunities

- RE-01 ∥ RE-02 (code structure vs interface capture, disjoint docs).
- RE-03 ∥ RE-04; RE-05 ∥ RE-06 (tests vs security notes).
- Large repos: split RE-01 by top-level module into separate `system-map-<module>.md` files.

## Sequential requirements

- RE-00 before any analysis; targets outside the recorded scope need a new authorization.
- Behavioural spec before characterization tests; tests run against test/staging, never
  production unless the user authorizes read-only checks explicitly.
- Found secrets: stop, report to user per `policies/secrets.md`, never use them.

## Acceptance criteria

- Every claim in the spec carries a tag (observed / inferred) and evidence (file:line,
  capture id, or test name).
- Each user scope question is answered or listed as unknown with what would resolve it.
- Characterization tests pass against the current system and fail if the pinned behaviour changes.
- Interface docs include request/response shapes and error cases seen.

## Quality gates

- Characterization suite runs green twice in a row (stability check) — command recorded.
- Orchestrator samples ≥ 5 claims (or all, if fewer) and confirms their evidence resolves.
- Method audit: report lists every tool/action used; none in the forbidden list.
- Secret scan of produced docs/tests is clean (captured traffic redacted).

## Deliverables

System map, interface docs, behavioural spec, characterization tests, optional
architecture doc + ADRs, optional onboarding guide, open-questions list.

## Completion conditions

RE-01, RE-02, RE-04 VERIFIED by the orchestrator via claim sampling; RE-05 VERIFIED by a
fresh run (different agent than author, or single-session re-run). DEPLOYED N/A. Follow-up
change work is composed as a new plan (improve/modernise), not implied.

## Failure recovery

| Failure | Recovery |
|---|---|
| Authorization unclear or partial | BLOCKED for out-of-scope targets; continue only on clearly authorized ones |
| System cannot run locally | Document from static analysis; tag claims inferred; mark RE-05 BLOCKED with environment needs |
| Obfuscated/encrypted component | Document its interface only; never defeat protections |
| Contradictory observations | Record both with conditions; add a test that discriminates them |
| Characterization tests flaky | Isolate nondeterminism (time, randomness, ordering); pin or document it |
| Scope explodes on huge repo | Answer the user's questions first; map remaining modules shallowly; record the rest |
