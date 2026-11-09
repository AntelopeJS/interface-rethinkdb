---
name: rethinkdb-interface
description: AntelopeJS interface exposing RethinkDB query execution via RunQuery and the r query builder re-exported from rethinkdb-ts. Use when code imports @antelopejs/interface-rethinkdb, when a task mentions RunQuery, r.table(...), ReQL queries, RethinkDB CRUD/joins/aggregations in an AntelopeJS module, or when implementing the interface with ImplementInterface.
category: antelopejs-interface
tags: [antelopejs, rethinkdb, reql, database, queries]
---

# RethinkDB Interface

Thin AntelopeJS interface over RethinkDB. It exports two values and one type:

- `r` — the ReQL query builder, re-exported unchanged from `rethinkdb-ts`. Building queries with `r` is pure and consumer-side; nothing touches the network.
- `RunQuery` — the only proxy crossing. It is an `InterfaceFunction` (AsyncProxy): the call is routed to whichever module implements the interface and owns the connection.
- `QueryResult` — the type `RunQuery` resolves to.

## Imports

```typescript
import { RunQuery, r } from "@antelopejs/interface-rethinkdb";
```

That single subpath is the whole public surface (`.` in the exports map; `./package.json` is also exported for tooling).

## Consuming

```typescript
import { RunQuery, r } from "@antelopejs/interface-rethinkdb";

// Read
const book = await RunQuery(r.table("books").get("bk-9f2c"));

// Write
const res = await RunQuery(
  r.table("books").insert({ title: "The Icebound Atlas", addedAt: r.now() }),
);
if (isWriteResult(res)) {
  const id = res.generated_keys?.[0]; // only present when the server generated keys
}

// Optional RunOptions as second argument
const overdueLoans = await RunQuery(
  r.table("loans").filter({ status: "overdue" }),
  { readMode: "outdated" },
);
```

`RunQuery(query, options?)` returns `Promise<QueryResult>`. `QueryResult` (exported as a type) is any value a query can resolve to: a JSON value, a `Date`, bytes, or `undefined`. The implementing module runs the query and the interface cannot check its answer against the query, so the result is not typed as `query.run()` would be. Narrow it before reading a field, for example with a guard that checks `typeof result.errors === "number"` for a write result (`isWriteResult` above, typed `result is QueryResult & WriteResult` with `WriteResult` from `rethinkdb-ts`).

## Providing (implementer modules only)

A module that owns a RethinkDB connection implements the interface with `ImplementInterface` from `@antelopejs/interface-core`:

```typescript
import { ImplementInterface } from "@antelopejs/interface-core";
import * as rethinkdbInterface from "@antelopejs/interface-rethinkdb";

ImplementInterface(rethinkdbInterface, {
  RunQuery: (query, options) => query.run(connection, options),
});
```

## Gotchas

- Never call `.run()` on a query in consumer code — consumers have no connection. Always execute through `RunQuery`; the implementing module manages the connection.
- `RunQuery` always returns a Promise, even for cursors/atomic values, because it crosses an AsyncProxy.
- Calls made before an implementation attaches are queued by the AsyncProxy and resolve once a provider registers — they do not fail fast. A missing provider therefore looks like a hang, not an error. Under the AntelopeJS test harness (test-stub mode) it instead rejects immediately with the "Interface function called without implementation in test environment" error.
- `r.now()`, `r.uuid()`, etc. build ReQL terms evaluated server-side at execution time, not local values.
- `@antelopejs/interface-core` is a peer dependency; the host project provides it.

## Deeper reference

Full walkthrough (query builder, CRUD, query options, joins, aggregations) is in this package's `docs/1.introduction.md`. Exact types are in `dist/index.d.ts`; the complete ReQL API is documented by RethinkDB and `rethinkdb-ts`. Do not duplicate those here.
