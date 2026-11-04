# `@antelopejs/interface-rethinkdb`

<div align="center">
<a href="https://www.npmjs.com/package/@antelopejs/interface-rethinkdb"><img data-illustration alt="npm" src="https://img.shields.io/npm/v/@antelopejs/interface-rethinkdb?style=for-the-badge&labelColor=000000&color=000000"></a>
<a href="./LICENSE"><img data-illustration alt="License" src="https://img.shields.io/npm/l/@antelopejs/interface-rethinkdb?style=for-the-badge&labelColor=000000&color=000000"></a>
<a href="https://discord.gg/g4pFt6eXqu"><img data-illustration alt="Discord" src="https://img.shields.io/badge/Discord-18181B?logo=discord&style=for-the-badge&color=000000"></a>
<a href="https://interfaces.antelopejs.com/docs/rethinkdb"><img data-illustration alt="Docs" src="https://img.shields.io/badge/Docs-18181B?style=for-the-badge&color=000000"></a>
</div>

The AntelopeJS interface for native RethinkDB queries. You build a ReQL query with `r` and run it on the connection that the implementing module shares with every caller. Use it for what the database-agnostic [`@antelopejs/interface-database`](https://github.com/AntelopeJS/interface-database) does not cover.

Part of [AntelopeJS](https://github.com/AntelopeJS/antelopejs), the TypeScript framework where modules depend on contracts and the application chooses the provider. Built by the team behind [AntelopeJS DMS](https://github.com/AntelopeJS/dms).

## What it offers

- `r` is the [rethinkdb-ts](https://github.com/rethinkdb/rethinkdb-ts) query builder, re-exported.
- `RunQuery(query, options?)` runs a query on the connection that the implementing module manages, and returns the query's own result type.
- Run options such as `readMode` and `durability` pass through to the driver.

## Implementations

| Module                                                             | Notes                                                                                                        |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| [`@antelopejs/rethinkdb`](https://github.com/AntelopeJS/rethinkdb) | Implements this interface in its default `owned` mode only. Also implements `@antelopejs/interface-database` |

## Install

Add the interface to the module that runs ReQL queries:

```bash
pnpm add @antelopejs/interface-rethinkdb
```

Then add the implementation to the project:

```bash
ajs project modules add @antelopejs/rethinkdb
```

## Quick start

```ts
import { RunQuery, r } from "@antelopejs/interface-rethinkdb";

export async function listActiveUsers() {
  return await RunQuery(r.table("users").filter({ active: true }));
}
```

## Documentation

- [Introduction and query reference](./docs/1.introduction.md)

## Compatibility

The interface has one AntelopeJS peer dependency:

<!-- antelopejs-docs-compat:start -->

| Package                      | Supported        | Tested with |
| ---------------------------- | ---------------- | ----------- |
| `@antelopejs/interface-core` | `>=0.2.4 <1.0.0` | `0.2.4`     |

<!-- antelopejs-docs-compat:end -->

The RethinkDB driver is the runtime dependency:

<!-- docs-compat: ./package.json#dependencies -->

| Package        | Range    |
| -------------- | -------- |
| `rethinkdb-ts` | `^2.7.0` |

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before you open a pull request. The local checks are:

```bash
pnpm install
pnpm run checks
```

## License

[Apache-2.0](./LICENSE)
