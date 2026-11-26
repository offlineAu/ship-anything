---
name: database-engineering
description: >-
  Designs schemas, writes safe migrations and tunes queries: inspects the existing schema and
  data first, selects a store from requirements (PostgreSQL, MySQL, SQLite, MongoDB, Redis,
  Supabase, Firebase), uses expand/contract zero-downtime migrations with rollback plans,
  indexes from real query patterns and tests migrations on a copy. Use for data modelling,
  migrations, indexing, query performance and data backfills.
license: MIT
metadata:
  category: software-engineering
  version: "0.1.0"
  agents: [architecture-agent, backend-agent, database-agent]
---

# Database engineering

## Purpose

Change data structures without losing data, without downtime and with a tested way back.
Base design and indexing on evidence: the current schema, the real data and the real
queries.

## When to use

- Designing or changing tables, collections, keys, constraints or relations.
- Writing migrations, backfills or data fixes.
- Diagnosing slow queries, adding or removing indexes, choosing a datastore.

Do not use when:
- Only reading data through an existing repository layer. Use `backend-development`.
- The task is general app performance not rooted in queries. Use `performance-optimization`.
- The task is backup, replication or infrastructure provisioning. Infrastructure work is
  owned by the infrastructure agent.

## Inputs

- Task contract and the data requirements behind it (entities, invariants, volumes,
  retention, residency).
- Connection to a **non-production** database or a copy. Migration history. ORM/migration
  tool config.
- Query patterns: slow query log, `pg_stat_statements`, ORM query logs or the code paths
  that issue queries.

## Procedure

1. **Inspect before designing.** Dump the current schema (`pg_dump --schema-only`,
   `mysqldump --no-data`, `sqlite3 db .schema`, or the ORM's introspection command). List
   existing migrations and check whether the migration table matches the files. For large
   tables, check row counts and data shape (nulls, duplicates, orphan rows) with read-only
   queries. Never inspect production without authorization.
2. **Model.** Write entities, keys, constraints (NOT NULL, UNIQUE, FK, CHECK), and the
   access patterns each must serve. Put invariants in the database when they are cheap to
   enforce there.
3. **Plan the migration as expand/contract** for anything touching live data:
   - *Expand:* add new nullable columns or tables or indexes. Code writes both old and new.
   - *Migrate:* backfill in batches (bounded by primary-key ranges, throttled), verify counts.
   - *Switch:* code reads new. Deploy.
   - *Contract:* drop old columns or tables in a later, separately authorised release.
4. **Make each migration reversible.** Write `up` and `down` (or a documented forward-fix
   when `down` would lose data). Write the rollback plan in the migration header or report:
   the trigger to roll back, the command, and the data impact.
5. **Avoid locking surprises.** On PostgreSQL, use `CREATE INDEX CONCURRENTLY` (outside a
   transaction) and add FKs/CHECKs as `NOT VALID`, then `VALIDATE CONSTRAINT` separately. Set
   `lock_timeout` for DDL. Know which `ALTER`s rewrite the table on your engine and version.
   On MySQL, check online DDL support (`ALGORITHM=INPLACE/INSTANT`) or use gh-ost or
   pt-online-schema-change.
6. **Index from query patterns.** For each hot query, run `EXPLAIN (ANALYZE, BUFFERS)` (or
   `EXPLAIN ANALYZE` on MySQL) on representative data. Build composite indexes in equality →
   range → sort column order. Add partial or covering indexes where they fit. Remove unused
   indexes only with usage stats as evidence.
7. **Test on a copy.** Apply `up` → run app tests → apply `down` → apply `up` again against
   a disposable DB restored from a sanitized snapshot or realistic seed. Time the migration
   and record lock behaviour.
8. **Seed and fixtures.** Keep fixture data deterministic and clearly separate from real
   data.
9. **Report** the schema diff, migration files, rollback plan, EXPLAIN output before and
   after, and test-on-copy results.

## Decision rules

| Requirement | Prefer |
|---|---|
| General relational data, integrity, rich queries, JSON when needed | PostgreSQL |
| Existing MySQL estate or hosting constraint | MySQL/MariaDB |
| Embedded, single-node, local-first, tests, small apps, edge replicas | SQLite (libSQL/Turso, Cloudflare D1 variants) |
| Document-shaped data, flexible schema, no cross-document transactions as the core need | MongoDB |
| Cache, rate limits, sessions, queues, leaderboards (ephemeral or derivable) | Redis/Valkey. Never the only copy of critical data |
| Postgres + auth + storage + realtime managed, small team | Supabase. Enforce Row Level Security on every exposed table |
| Mobile/web realtime sync, offline, Google ecosystem | Firebase/Firestore. Write and test Security Rules |

- Keep the existing datastore and migration tool. A switch needs an ADR
  (`.ship-anything/templates/architecture-decision.md`).
- **Authorization required** (`.ship-anything/policies/authorization.md`) before: `DROP`,
  `TRUNCATE`, `DELETE` without a narrow `WHERE`, contract-phase migrations, running any
  migration against shared or production databases, `migrate reset`/`db push --force-reset`
  or similar on any DB that holds non-fixture data. State the command, target, impact and
  rollback when asking.
- Destructive steps always ship as their own migration, never bundled with an expand step.
- Use UUIDv7/ULID or bigint identity keys per project convention. Never use natural keys
  that can change.
- Store money as integer minor units or `numeric` with currency. Store timestamps as
  `timestamptz`/UTC.

## Tools

- `psql`, `pg_dump`, `mysql`, `sqlite3`, `mongosh`, `redis-cli`.
- Migration tools: Prisma Migrate, Drizzle Kit, Knex, Alembic, Django migrations, Laravel,
  Flyway, Liquibase, golang-migrate, sqlx, EF Core.
- Docker/Testcontainers for disposable databases. Supabase/Firebase CLIs and local emulators.
- Related skills: `backend-development`, `performance-optimization`, `regression-prevention`.

## Quality standards

- Every migration has been applied, rolled back and re-applied on a copy, with output recorded.
- No migration takes a long blocking lock on a large table without a documented maintenance
  window approved by the user.
- Constraints encode the stated invariants. Every FK column is indexed when joins or
  cascades use it.
- Index changes are justified by EXPLAIN evidence, not intuition.
- Supabase tables have RLS enabled with tested policies. Firestore has Security Rules tests.

## Common failures

- Renaming or dropping a column in the same deploy that stops writing it, which breaks
  running instances.
- `NOT NULL` added to a populated column with no default or backfill.
- Backfill in one giant transaction, causing locks, bloat and replication lag.
- Editing an already-applied migration instead of adding a new one.
- Resetting a dev DB that turned out to hold the user's real data.
- Claiming "migration tested" when it was only generated, not applied.

## Outputs

- Migration files (up/down), updated schema or models, seed or fixture changes.
- Rollback plan, EXPLAIN before/after, and test-on-copy log in the agent report.
- ADR for datastore or major modelling decisions.

## Done when

- Migration applies, rolls back and re-applies cleanly on a copy, and app tests pass against
  the migrated schema.
- Rollback plan is written. Destructive or contract steps are split out and awaiting
  explicit authorization.
- Query changes show EXPLAIN evidence. Report filed with status no higher than TESTED.
