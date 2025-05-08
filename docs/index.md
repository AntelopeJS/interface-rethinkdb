# RethinkDB Interface

## Overview

The RethinkDB interface provides direct access to RethinkDB functionality, allowing you to execute queries against a RethinkDB database with a clean, promise-based API.

## Dependencies

- [**rethinkdb-ts**](https://www.npmjs.com/package/rethinkdb-ts): TypeScript-compatible driver for RethinkDB

## Features

- Simple RethinkDB query execution
- Exports RethinkDB query builder (`r`)
- Type-safe return values using TypeScript generics
- Full access to all RethinkDB operations

## Core Functions

### RunQuery

Executes a RethinkDB query against the connected database.

```typescript
import { RunQuery, r } from "@ajs/rethinkdb/dev";

// Usage example
async function example() {
  // Query that fetches all documents from a table
  const allUsers = await RunQuery(r.table("users"));

  // Query with filters
  const activeUsers = await RunQuery(
    r.table("users").filter({ status: "active" })
  );

  // Query that gets a specific document by id
  const user = await RunQuery(r.table("users").get("user-id-123"));

  // Insert a new document
  await RunQuery(
    r.table("users").insert({
      name: "John Doe",
      email: "john@example.com",
    })
  );
}
```

#### Parameters

- `query`: The RethinkDB query to execute
- `options` (optional): Query execution options

#### Returns

- `Promise<T>`: A promise that resolves to the result of the query, with the type matching the query's return type

### r

The RethinkDB query builder object, re-exported from the rethinkdb-ts package.

```typescript
import { r } from "@ajs/rethinkdb/dev";

// Example of building a query (this doesn't execute it)
const query = r
  .table("users")
  .filter({ status: "active" })
  .orderBy(r.desc("lastLogin"))
  .limit(10);
```
