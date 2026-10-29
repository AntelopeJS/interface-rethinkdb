---
covers:
docs:
  - docs/1.introduction.md
journeys:
  - every-function
  - minor-bump
---

# Smoke

The fixed journeys every verdict runs, whatever the diff touches: pack the interface, load it in `ajs project dev` with a stub provider and a consumer, call every declared function through core, and compare the declared functions with the published version.

## Sub-features

- `every-function`: `RunQuery` answers the stub provider through core with the arguments sent; `r` is the re-exported query builder, not a function of the interface, and the provider-side `internal` surface does not exist here.
- `minor-bump`: an added, changed or removed function releases as at least a new minor.

## How to get to it (user POV)

- A project with a RethinkDB provider module and a module that imports `@antelopejs/interface-rethinkdb`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" smoke
```

## Gotchas

- The smoke feature covers no glob, so it never marks a file as mapped.
- `minor-bump` needs the npm registry; without it the journey is not verified.
