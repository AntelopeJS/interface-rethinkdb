---
covers:
  - src/index.ts
docs:
  - docs/1.introduction.md
journeys:
  - builder-reexport
  - builder-types
---

# Query builder

A module builds a query with `r`, the rethinkdb-ts query builder re-exported, and executes it only through `RunQuery`.

## Sub-features

- `builder-reexport`: in a Node process on the packed interface, `r` is the very object `rethinkdb-ts` exports, the package exports exactly `r` and `RunQuery`, building a query reaches no provider, and `RunQuery` hands that same query object to the provider once it is called.
- `builder-types`: a strict `tsc` probe against the packed declarations pins `typeof r` to the driver's and the exact export list, in both directions.

## How to get to it (user POV)

- `import { RunQuery, r } from "@antelopejs/interface-rethinkdb"`, then `RunQuery(r.table("users").filter({ active: true }))`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" builder
```

## Gotchas

- No database is needed for this feature.
