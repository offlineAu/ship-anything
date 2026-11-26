# Task status model

| Status | Meaning | Evidence required to enter |
|---|---|---|
| PLANNED | In plan.yaml with contract | contract exists |
| IN_PROGRESS | An agent owns it now | owner recorded |
| IMPLEMENTED | Code/assets written | files listed in report; builds or compiles |
| TESTED | Implementer ran checks | commands + real results in report |
| VERIFIED | Independent check passed | QA (or a different agent/session) re-ran checks and validated acceptance criteria |
| DEPLOYED | Running in the target environment | authorised deploy command + URL/ID + health check output |
| SHIPPED | All acceptance criteria met and deliverables verified (in prod if prod was in scope) | release report |
| BLOCKED | Cannot proceed | blocker + what unblocks it |
| FAILED | Attempted, exhausted retry budget | failure evidence + root-cause notes |
| DESCOPED | Removed from scope | who decided and why |

Rules:
1. Never skip a status that applies. A library has no DEPLOYED stage; mark it N/A explicitly.
2. A local build is never DEPLOYED. A preview deploy is DEPLOYED(preview), not production.
3. Self-verification is not VERIFIED. If no independent agent is available (single-session
   adapters), the orchestrator re-runs every validation command fresh, in a clean step, and
   records "verified in single-session mode".
4. Regressions move a task back to IN_PROGRESS.
