# Repository Guidelines

## Project Introduction & Overview
Lumno is a Chromium Manifest V3 extension. The refactor target is a clear separation between extension runtime code, static resources, build scripts, and packaged output so contributors can iterate without adding more coupling.

## Folder Architecture Design
Contributors must keep the target architecture aligned with `develop.md`:

```text
manifest.json
package.json

public/
  _locales/
  assets/

scripts/
src/
  background/
  content/
  overlay/
  newtab/
  options/
  shared/
tests/
dist/
```

`public/` stores static extension resources, `scripts/` stores development tooling, `src/` stores all runtime source code, `tests/` stores automated verification, and `dist/` stores packaged extension output. Do not add a separate `i18n` source tree; locale resources stay under `public/_locales/`.

## Build, Test, and Development Commands
- `node --check <file>.js`: quick syntax validation for refactor-in-progress JavaScript modules.
- `node scripts/test-blacklist.js`: blacklist logic regression test.
- `node scripts/test-pinned-recent-blacklist.js`: pinned/hidden recent-site blacklist regression test.
- Load unpacked via `chrome://extensions` for manual verification.

## Coding Style & Anti-Shit-Code Rules
- Use `camelCase` for functions/variables and `PascalCase` only for constructor-like abstractions.
- Keep pure logic modules around 300-500 lines and UI/controller modules around 600-800 lines; do not add new multi-thousand-line files.
- Shared protocols, storage keys, search logic, and utilities belong in `src/shared/`; no copy-paste across feature folders.
- New refactor work should be written in a TypeScript-ready style: explicit data shapes, no implicit globals, and no weakly structured message payloads.
- ESLint/Prettier should remain the enforcement target once the refactor tooling is wired in; until then, keep diffs small, readable, and syntax-clean.

## Testing Guidelines
Add tests for every search, settings, migration, or PiP behavior change. Name tests by behavior, for example `search-ranking.test.js` or `settings-sync.test.js`. Search-related changes must be verified in both overlay and new tab flows.

## Commit & Pull Request Guidelines
Use Conventional Commits, e.g. `fix: restore bookmark suggestion fallback`. PRs should include scope, risk, linked issues, test evidence, and screenshots or recordings for UI changes.
