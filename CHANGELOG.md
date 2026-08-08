# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-08-08

### Removed

- **Breaking:** dropped support for Node 18, which reached end-of-life on 2025-04-30. `engines.node` is now `>=20.0.0`.

### Added

- GitHub Actions CI running typecheck, tests, and build on Node 20, 22, and 24
- Dependabot weekly updates for npm dependencies and GitHub Actions, with patch and minor updates auto-merging once CI passes
- Release workflow publishing to npm on `v*` tags via trusted publishing (OIDC), with build provenance attestation

## [1.0.2] - 2026-03-06

### Changed

- Source maps are no longer published to npm (`sourcemap: false`), halving the installed package size from 288 KB to 144 KB across 45 to 29 files

No functional changes — the emitted JavaScript and type declarations are identical to 1.0.1.

## [1.0.1] - 2026-03-06

### Added

- `homepage`, `repository`, and `bugs` fields in `package.json`, so npm links back to the GitHub repository and issue tracker

No functional changes — the published `dist/` output is identical to 1.0.0.

## [1.0.0] - 2026-03-06

### Added

- `serialize(md, serializer, options?)` — generic dispatch function accepting any `Serializer<T>` implementation
- `toHtml(md, options?)` — Markdown to HTML string
  - Collision-safe heading `id` slugs (`headingIds` option)
  - Custom CSS class injection per element (`classNames` option)
  - GFM table alignment (`style="text-align:..."`)
  - GFM task list checkboxes (`<input type="checkbox" disabled>`)
  - `renderImages` option to suppress `<img>` tags
  - `allowRawHtml` option (default `false`) for trusted-source raw HTML passthrough
  - URL sanitisation: blocks `javascript:`, `data:`, and other unsafe protocols
- `toAnsi(md, options?)` — Markdown to ANSI terminal string
  - Box-drawing table rendering
  - Blockquote `│` prefix
  - Word-wrap respecting invisible escape sequence widths
  - Fully themeable via `AnsiTheme` (no chalk dependency)
  - OSC 8 hyperlink support (`hyperlinks` option) with control-character sanitisation
- `toDocTree(md, options?)` — Markdown to `DocDocument` structured JSON tree
  - Flattened inline marks: `bold`, `italic`, `strikethrough` as boolean flags on `DocText`
  - `isHeader: true` on first `DocTableRow`
  - `checked: boolean | null` on `DocListItem`
- `Serializer<TOutput, TOptions>` interface as the core extension point
- `BaseOptions.remarkPlugins` — inject additional remark transform plugins
- `BaseOptions.gfm` — toggle GitHub Flavored Markdown (default `true`)
- Sub-path exports: `md-to-rich/html`, `md-to-rich/ansi`, `md-to-rich/doc-tree`
- Dual ESM + CJS output with `.d.ts` declarations per entry point
- 64 tests across 4 test files with ≥80% coverage
- 12 runnable examples in `examples/`
