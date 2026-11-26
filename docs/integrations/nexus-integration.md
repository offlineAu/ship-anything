# NEXUS integration (optional, future)

Status: **draft specification. Nothing here is implemented.** SHIP ANYTHING 0.1.0 has no
NEXUS code, no export command and no network calls. This document fixes the contract so that
an integration, if built, cannot compromise SHIP ANYTHING's independence or its security policies.

NEXUS is a separate project: a project and infrastructure control plane. **SHIP ANYTHING
must not depend on NEXUS.** Every SHIP ANYTHING feature works the same whether NEXUS exists,
is unreachable or was never configured.

## 1. Responsibilities

| Concern | SHIP ANYTHING | NEXUS |
|---|---|---|
| Planning, task contracts, delegation, quality gates | Owns | Never involved |
| Source of truth for task status and evidence | Owns (`.ship-anything/state/`) | Receives copies, never writes back |
| Building, testing, release preparation | Owns (in the coding agent session) | Observes via events |
| Production deploy authorization | The **human user**, per the [authorization policy](../../.ship-anything/policies/authorization.md) | May *request* a deploy. A request is not authorization |
| Executing deployments | Either side, decided per project. If SHIP ANYTHING deploys, it still needs user authorization | If NEXUS deploys, it uses its own credentials and approval rules |
| Infrastructure inventory, environments, health over time | Not owned | Owns |
| Secrets | Never stores or transmits values ([secrets policy](../../.ship-anything/policies/secrets.md)) | Owns secret storage. Shares secret *names* only |

Direction of trust: events from SHIP ANYTHING to NEXUS are informational. Anything NEXUS sends
back (for example `deployment.requested`) is **untrusted input** to the agent. It is shown to
the user and never treated as authorization.

## 2. Integration modes

Both modes are opt-in and disabled by default. Neither is required.

### 2.1 File export (preferred first step)

SHIP ANYTHING appends events to `.ship-anything/state/nexus-export.json`. NEXUS (or any other
tool) reads it. No network, no credentials.

```json
{
  "schema": "ship-anything.nexus-export/v1",
  "project_id": "proj_7f3c2a",
  "generated_at": "2026-12-01T10:15:00Z",
  "events": [ { "...": "event envelopes, oldest first" } ]
}
```

- Written atomically (write a temp file, then rename).
- Append-only within a schema version. Consumers track the last `event_id` they processed.
- Rotated when larger than 5 MB: the old file is renamed `nexus-export.<timestamp>.json`.
- Gitignored by default, like the rest of the runtime state.

### 2.2 HTTP events (later)

`POST {NEXUS_URL}/v1/events` with one envelope per request, or `POST /v1/events:batch` with up to 100.
Same envelope as the file. The HTTP sender reads from the export file, so the file stays the
outbox and nothing is lost when NEXUS is down.

Proposed configuration (in `.ship-anything/config.yaml`, which holds no secrets):

```yaml
integrations:
  nexus:
    enabled: false              # default
    mode: file                  # file | http | both
    url_env: NEXUS_URL          # name of the env var holding the base URL
    token_env: NEXUS_TOKEN      # name of the env var holding the bearer token
    project_id: null            # assigned by NEXUS at registration, not secret
    timeout_ms: 3000
    max_retries: 5
```

## 3. Envelope

Every event, in both modes, uses the same envelope.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "ship-anything.nexus/envelope/v1",
  "type": "object",
  "required": ["specversion", "event_id", "type", "occurred_at", "source", "project_id", "data"],
  "additionalProperties": false,
  "properties": {
    "specversion": { "const": "1.0" },
    "event_id": { "type": "string", "pattern": "^evt_[0-9A-HJKMNP-TV-Z]{26}$", "description": "ULID; idempotency key" },
    "type": { "enum": ["project.registered", "build.completed", "test.completed", "release.prepared",
                       "deployment.requested", "deployment.completed", "deployment.verified", "health.reported"] },
    "occurred_at": { "type": "string", "format": "date-time" },
    "source": {
      "type": "object",
      "required": ["tool", "version"],
      "properties": {
        "tool": { "const": "ship-anything" },
        "version": { "type": "string" },
        "agent_host": { "type": "string", "description": "e.g. claude-code, opencode; no user or machine names" }
      }
    },
    "project_id": { "type": "string" },
    "task_id": { "type": ["string", "null"], "description": "id from state/plan.yaml, e.g. REL-01" },
    "correlation_id": { "type": ["string", "null"], "description": "links events of one release or deployment" },
    "data": { "type": "object" }
  }
}
```

The envelope fields mirror CloudEvents 1.0 names (`specversion`, `type`, `source`) so a
CloudEvents adapter is a mapping, not a redesign.

**Content rules for `data`** (enforced by the exporter before writing):

- No secret values, ever. Secrets are referenced by name: `{ "secret_ref": "STRIPE_SECRET_KEY", "store": "vercel-env:production" }`.
- No file contents, diffs, prompts, transcripts, personal data, emails, usernames or absolute home paths. Paths are repo-relative.
- Evidence is summarized (counts, status, command name) and points to repo-relative report paths.
- The exporter runs the same redaction patterns as the [secrets policy](../../.ship-anything/policies/secrets.md) and drops the event (logging locally) if anything matches.

## 4. Event contracts

Each event's `data` schema is below with an example. `additionalProperties: false` applies to
every `data` object, so unknown fields are rejected and nothing leaks in by accident.

### 4.1 `project.registered`

Emitted once when the integration is enabled (and again if the stack changes).

```json
{
  "type": "object", "additionalProperties": false,
  "required": ["name", "installed_agents", "ship_anything_version"],
  "properties": {
    "name": { "type": "string" },
    "repository": { "type": ["string", "null"], "description": "public or remote URL without credentials" },
    "installed_agents": { "type": "array", "items": { "enum": ["claude", "codex", "opencode", "cursor", "gemini", "generic"] } },
    "ship_anything_version": { "type": "string" },
    "stack": { "type": "array", "items": { "type": "string" } },
    "environments": { "type": "array", "items": { "type": "string" } }
  }
}
```

```json
{
  "specversion": "1.0", "event_id": "evt_01JE5Q8M3V6T2R9K4N7P1XWZ0A", "type": "project.registered",
  "occurred_at": "2026-12-01T10:15:00Z", "source": { "tool": "ship-anything", "version": "0.1.0", "agent_host": "claude-code" },
  "project_id": "proj_7f3c2a", "task_id": null, "correlation_id": null,
  "data": { "name": "restaurant-platform", "repository": null, "installed_agents": ["claude"],
            "ship_anything_version": "0.1.0", "stack": ["nextjs", "postgres", "expo"], "environments": ["staging", "production"] }
}
```

### 4.2 `build.completed`

```json
{
  "type": "object", "additionalProperties": false,
  "required": ["status", "target", "command"],
  "properties": {
    "status": { "enum": ["succeeded", "failed"] },
    "target": { "type": "string", "description": "workspace or app, e.g. apps/web" },
    "command": { "type": "string", "description": "command name only, no env values" },
    "duration_ms": { "type": "integer", "minimum": 0 },
    "commit": { "type": ["string", "null"], "pattern": "^[0-9a-f]{7,40}$" },
    "artifacts": { "type": "array", "items": { "type": "string" }, "description": "repo-relative paths or image digests" }
  }
}
```

```json
{ "type": "build.completed", "task_id": "WEB-01", "correlation_id": "rel_2026_12_01",
  "data": { "status": "succeeded", "target": "apps/web", "command": "pnpm build", "duration_ms": 48210,
            "commit": "3e1f9ab", "artifacts": ["apps/web/.next"] } }
```

(Examples from here on show only the envelope fields that differ.)

### 4.3 `test.completed`

```json
{
  "type": "object", "additionalProperties": false,
  "required": ["status", "suite", "passed", "failed"],
  "properties": {
    "status": { "enum": ["passed", "failed", "errored"] },
    "suite": { "enum": ["unit", "integration", "e2e", "api", "accessibility", "performance", "security"] },
    "passed": { "type": "integer", "minimum": 0 },
    "failed": { "type": "integer", "minimum": 0 },
    "skipped": { "type": "integer", "minimum": 0 },
    "verified_by": { "type": "string", "description": "agent name that ran it, e.g. qa-agent" },
    "independent": { "type": "boolean", "description": "true if not run by the implementer (status model rule 3)" },
    "report_path": { "type": "string", "description": "repo-relative, e.g. .ship-anything/state/tasks/QA-01.md" }
  }
}
```

```json
{ "type": "test.completed", "task_id": "QA-01",
  "data": { "status": "passed", "suite": "e2e", "passed": 42, "failed": 0, "skipped": 1,
            "verified_by": "qa-agent", "independent": true, "report_path": ".ship-anything/state/tasks/QA-01.md" } }
```

(The numbers in examples are placeholders that show the shape, not results of any run.)

### 4.4 `release.prepared`

```json
{
  "type": "object", "additionalProperties": false,
  "required": ["version", "gates"],
  "properties": {
    "version": { "type": "string" },
    "commit": { "type": "string" },
    "changelog_path": { "type": "string" },
    "gates": {
      "type": "object", "additionalProperties": false,
      "properties": {
        "qa": { "enum": ["passed", "failed", "n/a"] },
        "security": { "enum": ["passed", "failed", "n/a"] },
        "performance": { "enum": ["passed", "failed", "n/a"] }
      }
    },
    "required_secrets": { "type": "array", "items": { "$ref": "#/$defs/secret_ref" } }
  },
  "$defs": {
    "secret_ref": {
      "type": "object", "additionalProperties": false, "required": ["secret_ref"],
      "properties": { "secret_ref": { "type": "string", "pattern": "^[A-Z][A-Z0-9_]*$" }, "store": { "type": "string" } }
    }
  }
}
```

```json
{ "type": "release.prepared", "task_id": "REL-01", "correlation_id": "rel_2026_12_01",
  "data": { "version": "1.0.0", "commit": "3e1f9ab", "changelog_path": "CHANGELOG.md",
            "gates": { "qa": "passed", "security": "passed", "performance": "passed" },
            "required_secrets": [ { "secret_ref": "DATABASE_URL", "store": "vercel-env:production" },
                                  { "secret_ref": "STRIPE_SECRET_KEY", "store": "vercel-env:production" } ] } }
```

### 4.5 `deployment.requested`

Can be emitted by SHIP ANYTHING (asking NEXUS to deploy) or received from NEXUS (shown to the
user). Either way it **does not authorize** anything.

```json
{
  "type": "object", "additionalProperties": false,
  "required": ["environment", "version", "requested_by"],
  "properties": {
    "environment": { "type": "string" },
    "version": { "type": "string" },
    "commit": { "type": "string" },
    "requested_by": { "enum": ["ship-anything", "nexus"] },
    "user_authorization": {
      "type": ["object", "null"], "additionalProperties": false,
      "properties": {
        "granted": { "type": "boolean" },
        "decision_ref": { "type": "string", "description": "anchor in .ship-anything/state/decisions.md" }
      }
    },
    "rollback_plan": { "type": "string" }
  }
}
```

```json
{ "type": "deployment.requested", "task_id": "REL-02", "correlation_id": "rel_2026_12_01",
  "data": { "environment": "production", "version": "1.0.0", "commit": "3e1f9ab", "requested_by": "ship-anything",
            "user_authorization": { "granted": true, "decision_ref": "decisions.md#2026-12-01-prod-deploy" },
            "rollback_plan": "redeploy previous release 0.9.3" } }
```

### 4.6 `deployment.completed`

```json
{
  "type": "object", "additionalProperties": false,
  "required": ["environment", "version", "status"],
  "properties": {
    "environment": { "type": "string" },
    "version": { "type": "string" },
    "status": { "enum": ["succeeded", "failed", "rolled_back"] },
    "deployment_ref": { "type": "string", "description": "provider deployment id, not a secret" },
    "url": { "type": ["string", "null"], "format": "uri" },
    "executed_by": { "enum": ["ship-anything", "nexus", "ci"] }
  }
}
```

```json
{ "type": "deployment.completed", "task_id": "REL-02", "correlation_id": "rel_2026_12_01",
  "data": { "environment": "production", "version": "1.0.0", "status": "succeeded",
            "deployment_ref": "dpl_example123", "url": "https://app.example.com", "executed_by": "ship-anything" } }
```

### 4.7 `deployment.verified`

Maps to the DEPLOYED status's evidence requirement in the [status model](../../.ship-anything/policies/status-model.md).

```json
{
  "type": "object", "additionalProperties": false,
  "required": ["environment", "version", "result", "checks"],
  "properties": {
    "environment": { "type": "string" },
    "version": { "type": "string" },
    "result": { "enum": ["healthy", "degraded", "failed"] },
    "checks": {
      "type": "array",
      "items": {
        "type": "object", "additionalProperties": false, "required": ["name", "status"],
        "properties": { "name": { "type": "string" }, "status": { "enum": ["pass", "fail"] }, "detail": { "type": "string" } }
      }
    }
  }
}
```

```json
{ "type": "deployment.verified", "task_id": "REL-03", "correlation_id": "rel_2026_12_01",
  "data": { "environment": "production", "version": "1.0.0", "result": "healthy",
            "checks": [ { "name": "GET /api/health", "status": "pass", "detail": "200" },
                        { "name": "e2e smoke: place order (test mode)", "status": "pass" } ] } }
```

### 4.8 `health.reported`

Usually produced by NEXUS or the project's monitoring. SHIP ANYTHING may emit it after a
monitoring-agent task.

```json
{
  "type": "object", "additionalProperties": false,
  "required": ["environment", "status"],
  "properties": {
    "environment": { "type": "string" },
    "status": { "enum": ["healthy", "degraded", "down", "unknown"] },
    "signals": {
      "type": "array",
      "items": {
        "type": "object", "additionalProperties": false, "required": ["name", "value"],
        "properties": { "name": { "type": "string" }, "value": { "type": "number" }, "unit": { "type": "string" } }
      }
    },
    "window": { "type": "string", "description": "ISO 8601 duration, e.g. PT15M" }
  }
}
```

```json
{ "type": "health.reported",
  "data": { "environment": "production", "status": "healthy", "window": "PT15M",
            "signals": [ { "name": "http_5xx_rate", "value": 0.0, "unit": "ratio" },
                         { "name": "p75_lcp", "value": 2100, "unit": "ms" } ] } }
```

## 5. Authentication

- HTTP mode uses a bearer token read at send time from the environment variable named by
  `token_env` (default `NEXUS_TOKEN`). The token value is **never** written to config, state,
  the export file, logs, reports or memory.
- If the variable is unset, HTTP sending is skipped with a one-line local warning. File export continues.
- Tokens should be project-scoped and write-only for events (they cannot read other projects or trigger actions).
- HTTPS is required except for `http://localhost` and `http://127.0.0.1`.
- Creating or rotating the token is a credential action, so it needs user authorization under the [authorization policy](../../.ship-anything/policies/authorization.md).

## 6. Idempotency and ordering

- `event_id` (ULID) is the idempotency key. NEXUS must treat a repeated `event_id` as a no-op and return success.
- The same logical fact re-emitted after a retry keeps its original `event_id`.
- Ordering is best effort. Consumers order by `occurred_at`, then `event_id`. `correlation_id` groups a release's events.
- Events are facts about the past. They are never edited. Corrections are new events (for example `deployment.completed` with `status: rolled_back`).

## 7. Versioning

- Envelope: `specversion` (currently `"1.0"`). Export file: `schema: ship-anything.nexus-export/v1`.
- Adding an optional field to `data` is a minor change. Removing or renaming a field, changing a type, or adding a required field is a major change and gets a new `$id` (`.../v2`).
- SHIP ANYTHING emits one major version at a time. NEXUS should accept the current and previous major.
- HTTP path is versioned (`/v1/events`). A `410 Gone` tells SHIP ANYTHING to stop sending and warn the user once.

## 8. Failure handling

**Rule: NEXUS being unavailable, slow, misconfigured or rejecting events never blocks, fails,
or delays any SHIP ANYTHING task, gate or status change.**

| Situation | Behavior |
|---|---|
| Integration disabled or not configured | No file, no network, no warnings |
| Network error, timeout (> `timeout_ms`), 5xx, 429 | Event stays in the export file. Retry with exponential backoff and jitter up to `max_retries`, then leave it for the next session |
| 400 / 422 (schema rejected) | Log locally once with the event type and error. Do not retry that event |
| 401 / 403 | Stop HTTP sending for the session. Warn once: "NEXUS rejected the token in `NEXUS_TOKEN`" (name only) |
| Export file unwritable or corrupt | Rename the corrupt file aside, start a new one, warn once. Task work continues |
| Redaction check matches | Drop the event, log locally which rule matched (not the value) |
| NEXUS sends `deployment.requested` | Present it to the user as a request. Proceed only with explicit user authorization |

Sending happens at task boundaries (after a report is written), never inside a gate, and
never in a way that holds the agent's turn open.

## 9. Open questions

1. Should SHIP ANYTHING ever execute deployments when NEXUS is present, or always hand off to NEXUS? (Default proposal: per-project setting, no implicit choice.)
2. How does NEXUS assign `project_id` in file-only mode: does the user paste it, or does NEXUS derive it from the repository URL?
3. Is a pull model (NEXUS reads the file from CI artifacts) enough to skip HTTP entirely?
4. Should `health.reported` flow into SHIP ANYTHING at all, for example to reopen a SHIPPED task as a regression (status model rule 4), or stay NEXUS-only?
5. Signing: are bearer tokens enough, or should events be signed (HMAC with a key named by env var) for tamper evidence in the file?
6. Retention: how long should rotated export files be kept locally?
7. Multi-repo products: one `project_id` per repo, or a parent product id?
8. Which component owns the JSON Schemas once both projects are public? Proposal: a small, separately versioned schema package that neither project's runtime depends on.
