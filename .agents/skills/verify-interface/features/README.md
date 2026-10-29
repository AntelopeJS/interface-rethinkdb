# Feature map

One file per feature. `covers:` lists the source globs it owns, `docs:` the pages a verdict judges, `journeys:` the journeys it runs, and `seeded-breaks/<feature>.patch` the break its journeys must catch. `pnpm exec antelopejs-verify map` checks that every user-facing file is covered.

| Feature | What the user does | Journeys |
|---|---|---|
| [builder](builder.md) | A module builds a native query with `r` and nothing runs until `RunQuery`. | builder-reexport, builder-types |
| [crud](crud.md) | A module creates, reads, updates and deletes documents through `RunQuery` and checks the write results. | crud-roundtrip, run-types |
| [options](options.md) | A module passes run options such as `readMode` and `durability` for one execution. | run-options |
| [advanced](advanced.md) | A module joins and aggregates records with native query expressions. | joins-and-aggregates |
| [smoke](smoke.md) | The fixed journeys every verdict runs: load the packed interface with a stub provider and call `RunQuery`. | every-function, minor-bump |
