# AGENTS.md

Low-level utility functions for higher-level libraries in **Principia**, a nanoservice
framework built primarily on Bun. No framework logic here — just shared helpers.

## Runtime

- Requires Bun `>=1.4.0` or Node.js `>=26` — uses the native `Temporal` global (no `luxon`,
  no polyfill) for all date/time handling. Don't reintroduce `luxon` or a Temporal polyfill.
- Plain ESM, no TypeScript, no build step. Don't add a `tsconfig.json` — it was deliberately
  removed (was only there for typedoc, which is also gone).
- Relative imports/exports **must** include explicit `.js` extensions. Bun tolerates missing
  ones; Node's ESM resolver doesn't. Always write `from './lib/Foo.js'`, never `'./lib/Foo'`.

## Layout

- [ArClass.js](./ArClass.js) is the package entry point; it re-exports everything under `lib/`.
- `lib/` holds the actual modules (was renamed from `util/` — watch for stale references to the
  old name in comments/docs).
- Tests live in `test/`, flat, one file per `lib/` module, using `bun:test`. Run via `bun run test`.

## Style

- Formatting is enforced by oxfmt ([.oxfmtrc.json](./.oxfmtrc.json)): tabs, single quotes, no
  semicolons, trailing commas. Run `bun run format:fix` before committing.

## Consumption gotcha

This package is consumed by sibling repos (e.g. `empyria-common`) via a **git dependency**
pointing at this repo's GitHub remote — not a local link. Local changes here are invisible to
consumers until they're committed **and pushed**. If a change here is meant to unblock work in
another Principia repo, say so explicitly before assuming it already took effect there.
