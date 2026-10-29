---
covers:
  - src/index.ts
docs:
  - docs/1.introduction.md
journeys:
  - joins-and-aggregates
---

# Joins and aggregations

A module runs native joins (`eqJoin` on a secondary index) and aggregations (`group(...).count()`) through `RunQuery`.

## Sub-features

- `joins-and-aggregates`: against a live RethinkDB with `users` and `posts` (an `authorId` secondary index), `eqJoin` returns one `left`/`right` pair per matching post, `group("role").count()` returns each group with its reduction, and a plain count matches.

## How to get to it (user POV)

- `RunQuery(r.table("users").eqJoin("id", r.table("posts"), { index: "authorId" }))`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" advanced
```

## Gotchas

- The journeys that need a database start their own `rethinkdb:2.4` container on a free port and remove it afterwards; the interface kind of the harness starts no services. The provider is a stand-in that runs each query on a native connection pool, so what the journeys prove is what this interface passes and returns, not what the real `@antelopejs/rethinkdb` module does.
