# interface-rethinkdb

The AntelopeJS interface for native RethinkDB queries, published as `@antelopejs/interface-rethinkdb`. The whole contract lives in `src/index.ts`: `r`, re-exported unchanged from `rethinkdb-ts`, and `RunQuery`, an `InterfaceFunction`. Implementations such as `@antelopejs/rethinkdb` live in their own repositories.

## Versioning

- `@antelopejs/interface-core` is a peer dependency, and the devDependency uses the same range. When you raise the minimum, raise both and the compatibility table in `README.md` together. Every `@antelopejs/*` range stops below the next minor of its floor: `>=0.5.1 <0.6.0` on a 0.x package, `~1.23.3` on a 1.x one. The `dependency:ranges` step of `pnpm run checks` enforces it in every tracked `package.json`.
- `rethinkdb-ts` is a runtime dependency because `r` is re-exported. Its range is also listed in the `README.md` compatibility table; change both together.

## Tests

- The repository has no test suites. `pnpm test` only builds `dist` with `tsc`, so `pnpm run checks` proves the package compiles and emits.
- `pnpm run checks` does not run the documentation check. CI runs it through the `docs-files` input in `.github/workflows/ci.yml`. To run it locally, clone `AntelopeJS/tooling-configs` at `v0.0.9` (the ref ci-node pins), run `npm ci --prefix <clone>/actions/docs --omit=dev --ignore-scripts`, then run `node <clone>/actions/docs/check.mjs --files "$(printf 'README.md\ndocs')"` from this repository.

## Shipped files

`docs/` and `skills/` ship in the npm package. `docs/` holds the guide the package `homepage` (interfaces.antelopejs.com/docs/rethinkdb) points to. `skills/` reaches users through `antelopeJs.skills`; when the contract changes, update `skills/rethinkdb-interface/SKILL.md`.

<!-- antelopejs-guardrails:start -->
<!-- Managed by @antelopejs/tooling-configs. `antelopejs-sync` rewrites everything between these markers; write repository-specific guidance outside them. -->

## Guardrails

CI runs `pnpm run checks` in full on every pull request and reports what failed. The commit hook formats and lints the staged files. Locally, run only the fast check for what you touched:

- `pnpm run typecheck` after you change types or signatures.
- `pnpm exec oxlint <files>` and `pnpm exec oxfmt <files>` on the files you changed.
- One test file, not the suite. In a module that tests with `ajs module test`: `pnpm run build`, then `pnpm exec ajs module test . -f dist/<path>.test.js`.

Prove a change works with the verification skill in [`.agents/skills/verify-interface/SKILL.md`](.agents/skills/verify-interface/SKILL.md) before you call it done.

### Comments

Say it in code: a constraint in a type, a lint rule or a test, a public item's contract in TSDoc. Other comments are lint directives naming their rules, `@ts-expect-error <reason>`, `SAFETY: <reason>` above a type assertion, and license or tool directives. A reason states what the code does now.

### Tests

Each test names the wrong implementation it fails on, or is deleted. Drive behaviour through the public interface. An invariant over many files is a lint rule.

### Review

No tool checks these:

- A type guard checks the nested elements and values it claims.
- A no-upward import rule rejects same-tier peers; probe it with an import.
- A finding only an evasion or a patched internal can trigger goes under Attention and never blocks.

### Suppressions

`guardrails.suppressions.json` caps lint directives, `@ts-expect-error`, `SAFETY:` comments and rules a lint config turns off. Over a cap, fix the code or remove another suppression of that kind; only the operator raises a number. After removing suppressions, run `pnpm run suppressions:update` and commit the file.

<!-- antelopejs-guardrails:end -->
