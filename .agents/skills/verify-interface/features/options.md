---
covers:
  - src/index.ts
docs:
  - docs/1.introduction.md
journeys:
  - run-options
---

# Run options

A module passes `RunOptions` such as `readMode` or `durability` as the second argument of `RunQuery` for one execution.

## Sub-features

- `run-options`: against a live RethinkDB, the options reach the provider exactly as given (`null` when omitted), a query with `readMode: "outdated"` and one with `durability: "soft"` run and answer, and an invalid `readMode` is refused by the database and rejects the call. The table is read back natively.

## How to get to it (user POV)

- `await RunQuery(r.table("users").filter({ role: "admin" }), { readMode: "outdated" })`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" options
```

## Gotchas

- The journeys that need a database start their own `rethinkdb:2.4` container on a free port and remove it afterwards; the interface kind of the harness starts no services. The provider is a stand-in that runs each query on a native connection pool, so what the journeys prove is what this interface passes and returns, not what the real `@antelopejs/rethinkdb` module does.
