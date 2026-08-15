# @principia/classification

Low-level utility functions for higher-level libraries in **Principia**, a nanoservice
framework built primarily on Bun.

This package has no framework-specific logic of its own — it's the shared foundation
(date/time, array, object, string, and chunking helpers) that other Principia libraries
build on.

## Requirements

- Bun `>=1.4.0` or Node.js `>=26`
- Plain ESM, no build step, no TypeScript

Both requirements come from using the native `Temporal` global (no `luxon`, no polyfill)
for all date/time handling.

## Install

```bash
bun add @principia/classification
```

## Usage

```js
import { startOfDay, capitalise, groupBy, chunkDocument } from '@principia/classification'
```

Everything is re-exported from the package root via [ArClass.js](./ArClass.js). Individual
modules under `lib/` can also be imported directly if you only need one:

```js
import { formatRetention } from '@principia/classification/lib/Date.js'
```

## Modules

| Module                                         | Purpose                                                                                                                                                                                         |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ArClass.js](./ArClass.js)                     | Package entry point; re-exports every module below plus a handful of day-boundary helpers (`isToday`, `startOfDay`, `endOfDay`, `day`) and generic status constants (`OK`, `NA`, `ANY`, `ALL`). |
| [lib/Date.js](./lib/Date.js)                   | Date/time arithmetic, formatting, and retention/expiry helpers, built on `Temporal`.                                                                                                            |
| [lib/ArrayServices.js](./lib/ArrayServices.js) | Array helpers: async map/filter/find, grouping, random selection, permutations, combinations.                                                                                                   |
| [lib/Helpers.js](./lib/Helpers.js)             | Object helpers (defined-value copying, path get/set, cloning), templating, retry/polling utilities.                                                                                             |
| [lib/Math.js](./lib/Math.js)                   | Small random-number helpers (`rand`, `chances`, `randEquidistant`).                                                                                                                             |
| [lib/Name.js](./lib/Name.js)                   | String helpers: transliteration, capitalisation, truncation.                                                                                                                                    |
| [lib/Chunker.js](./lib/Chunker.js)             | Splits document text into overlapping, sentence-aware chunks for embedding/RAG retrieval.                                                                                                       |

Every exported function is documented with JSDoc directly in its source file — hovering
a function in VSCode or Zed shows its parameters and return type without any extra
tooling, since both editors read JSDoc from plain `.js` files automatically.

Tests live under [test/](./test/), one file per module, separate from the `lib/` sources.

## Scripts

```bash
bun run format       # check formatting (oxfmt)
bun run format:fix   # apply formatting
bun run lint         # lint (oxlint)
bun run lint:fix     # lint and fix
bun run test         # run tests with coverage
```

## License

MIT © Imre Fazekas
