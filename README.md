<a href="https://github.com/AntelopeJS/antelopejs"><img data-illustration src="./.github/readme/strip.svg" width="100%" alt="INTERFACE · RETHINKDB: part of AntelopeJS, hexagonal architecture beyond your own code. A glowing button reads Star AntelopeJS."></a>

<div align="center">

# `@antelopejs/interface-rethinkdb`

<a href="https://www.npmjs.com/package/@antelopejs/interface-rethinkdb"><img data-illustration alt="npm" src="https://img.shields.io/npm/v/@antelopejs/interface-rethinkdb?style=for-the-badge&labelColor=000000&color=000000"></a> <a href="./LICENSE"><img data-illustration alt="License" src="https://img.shields.io/npm/l/@antelopejs/interface-rethinkdb?style=for-the-badge&labelColor=000000&color=000000"></a> <a href="https://discord.gg/g4pFt6eXqu"><img data-illustration alt="Discord" src="https://img.shields.io/badge/Discord-18181B?logo=discord&style=for-the-badge&color=000000"></a> <a href="https://interfaces.antelopejs.com/docs/rethinkdb"><img data-illustration alt="Docs" src="https://img.shields.io/badge/Docs-18181B?style=for-the-badge&color=000000"></a> <a href="https://github.com/AntelopeJS/antelopejs"><img data-illustration alt="Star AntelopeJS" src="https://img.shields.io/github/stars/AntelopeJS/antelopejs?label=Star%20AntelopeJS&style=for-the-badge&labelColor=000000&color=000000&logo=github"></a>

**Native RethinkDB queries for AntelopeJS. Build a ReQL query and run it on the project's shared connection.**

[Documentation](https://interfaces.antelopejs.com/docs/rethinkdb) · [Implementations](#implementations) · [All interfaces and providers](https://github.com/AntelopeJS/antelopejs#ecosystem)

</div>

The AntelopeJS interface for native RethinkDB queries. You build a ReQL query with `r` and run it on the connection that the implementing module shares with every caller. Use it for what the database-agnostic [`@antelopejs/interface-database`](https://github.com/AntelopeJS/interface-database) does not cover.

## What it offers

- `r` is the [rethinkdb-ts](https://github.com/rethinkdb/rethinkdb-ts) query builder, re-exported.
- `RunQuery(query, options?)` runs a query on the connection that the implementing module manages, and resolves to a `QueryResult`, which you narrow before you read a field.
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
| `@antelopejs/interface-core` | `>=0.2.4 <1.0.0` | `0.4.0`     |

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

## Part of AntelopeJS

[AntelopeJS](https://github.com/AntelopeJS/antelopejs) is the TypeScript framework where modules depend on contracts and the application chooses the provider. [AntelopeJS DMS](https://github.com/AntelopeJS/dms) is built on it.

<!-- antelopejs-framework-modules:start -->

| Area         | Contracts                                                                                                                                                                                                                                                                                                                                                                 | Providers                                                                                                                                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API          | [`interface-api`](https://github.com/AntelopeJS/interface-api) · [`interface-api-util`](https://github.com/AntelopeJS/interface-api-util) · [`interface-data-api`](https://github.com/AntelopeJS/interface-data-api)                                                                                                                                                      | [`api`](https://github.com/AntelopeJS/api)                                                                                                                                                                                                          |
| Auth         | [`interface-auth`](https://github.com/AntelopeJS/interface-auth)                                                                                                                                                                                                                                                                                                          | [`auth-jwt`](https://github.com/AntelopeJS/auth-jwt)                                                                                                                                                                                                |
| Database     | [`interface-database`](https://github.com/AntelopeJS/interface-database) · [`interface-database-decorators`](https://github.com/AntelopeJS/interface-database-decorators) · [`interface-database-catalog`](https://github.com/AntelopeJS/interface-database-catalog) · [`interface-mongodb`](https://github.com/AntelopeJS/interface-mongodb) · **`interface-rethinkdb`** | [`postgres`](https://github.com/AntelopeJS/postgres) · [`mysql`](https://github.com/AntelopeJS/mysql) · [`mongodb`](https://github.com/AntelopeJS/mongodb) · [`rethinkdb`](https://github.com/AntelopeJS/rethinkdb)                                 |
| Redis        | [`interface-redis`](https://github.com/AntelopeJS/interface-redis) · [`interface-redis-scheduler`](https://github.com/AntelopeJS/interface-redis-scheduler)                                                                                                                                                                                                               | [`redis`](https://github.com/AntelopeJS/redis)                                                                                                                                                                                                      |
| Email        | [`interface-email`](https://github.com/AntelopeJS/interface-email)                                                                                                                                                                                                                                                                                                        | [`nodemailer`](https://github.com/AntelopeJS/nodemailer) · [`brevo`](https://github.com/AntelopeJS/brevo)                                                                                                                                           |
| File storage | [`interface-file-storage`](https://github.com/AntelopeJS/interface-file-storage)                                                                                                                                                                                                                                                                                          | [`file-storage-local`](https://github.com/AntelopeJS/file-storage-local) · [`file-storage-s3`](https://github.com/AntelopeJS/file-storage-s3)                                                                                                       |
| Payments     | [`interface-payment`](https://github.com/AntelopeJS/interface-payment) · [`interface-subscriptions`](https://github.com/AntelopeJS/interface-subscriptions) · [`interface-stripe`](https://github.com/AntelopeJS/interface-stripe)                                                                                                                                        | [`stripe`](https://github.com/AntelopeJS/stripe) · [`mollie`](https://github.com/AntelopeJS/mollie) · [`checkout-com`](https://github.com/AntelopeJS/checkout-com) · [`payment-subscriptions`](https://github.com/AntelopeJS/payment-subscriptions) |

<!-- antelopejs-framework-modules:end -->

## License

[Apache-2.0](./LICENSE)
