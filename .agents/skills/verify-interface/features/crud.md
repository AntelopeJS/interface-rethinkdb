---
covers:
  - src/index.ts
docs:
  - docs/1.introduction.md
journeys:
  - crud-roundtrip
  - run-types
---

# CRUD through RunQuery

A module inserts, reads, updates and deletes documents with `RunQuery` and inspects the driver's write results (`generated_keys`, `replaced`, `unchanged`, `skipped`, `deleted`, `errors`, `first_error`).

## Sub-features

- `crud-roundtrip`: against a live RethinkDB, an insert returns a generated string key and no errors; `get` returns the document, a missing id returns `null`, `filter` returns the matching documents; an update reports `replaced`, repeating it reports `unchanged`, a missing record is `skipped`; a duplicate primary key resolves with `errors` and a `first_error` instead of rejecting; a delete reports `deleted` and a repeat deletes nothing; a query on an absent table rejects. A separate native connection then reads the table back and finds exactly what the scenario left (the second view).
- `run-types`: a strict `tsc` probe against the packed declarations pins the generic signature of `RunQuery` and checks that the answer for a `get`, an `insert`, a `filter` and a grouped count is identical to the type of the query's own `run()`, never `any`.

## How to get to it (user POV)

- `const result = await RunQuery(r.table("users").insert({ name, email }))`, then `result.generated_keys?.[0]`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" crud
```

## Gotchas

- The journeys that need a database start their own `rethinkdb:2.4` container on a free port and remove it afterwards; the interface kind of the harness starts no services. The provider is a stand-in that runs each query on a native connection pool, so what the journeys prove is what this interface passes and returns, not what the real `@antelopejs/rethinkdb` module does.
