# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-10-09

### Added

- GFM footnotes. `toHtml()` renders references as numbered superscript links and appends a `<section class="footnotes">` with back-links; `toAnsi()` prints `[1]` markers and lists the notes at the end. Notes are numbered in order of first reference, and unreferenced definitions are left out of HTML and terminal output.
- Doc Tree: `footnoteReference` inline nodes and `footnoteDefinition` block nodes (`DocFootnoteReference`, `DocFootnoteDefinition`). Definitions are moved to the end of the document. Code that switches exhaustively over `DocInlineNode` or `DocBlockNode` needs a case for each.
- Doc Tree: `DocList.start`, the number of the first item of an ordered list (`null` for unordered lists). It is a required field, so code that builds `DocList` objects itself (fixtures, transforms) must set it, and stored Doc Tree snapshots gain `"start": null` on unordered lists.

### Fixed

- Reference-style links and images (`[text][ref]`, `[ref][]`, `[ref]`, `![alt][ref]`) were dropped entirely, including their text, by every built-in serializer. They now resolve against their `[ref]: url` definitions.
- Ordered lists that don't start at 1 (`3. item`) now keep their number: `<ol start="3">` in HTML and `3.` in terminal output.
- Heading IDs now keep inline code text and letters outside ASCII: `## Use \`foo\` here` → `use-foo-here`, `# Café` → `café`. Emoji are still dropped (`# ❤️ Love` → `love`). IDs for other headings are unchanged.
- `classNames.code` on a fenced code block with a language produced two `class` attributes; they are now merged (`class="language-ts mono"`).
- `toAnsi()` dropped code blocks, blockquotes and tables inside list items; they are now rendered, indented under the item.
- `toAnsi()` no longer turns `javascript:`, `data:` or other unsafe URLs into OSC 8 hyperlinks or prints them after the link text; the label is shown on its own.
- `toAnsi()` blockquote lines could run two characters past `columns`; they now fit, including when nested or inside list items and footnotes.
- `toAnsi()` printed `[image: ]` for images with empty alt text; it now falls back to the URL, with control characters removed.

Custom serializers passed to `serialize()` still receive the unmodified MDAST, including reference and definition nodes. The built-in serializers work on a copy (`structuredClone`) and never modify a tree passed to them; a remark plugin that stores functions or other non-cloneable values on nodes will now make them throw. When a footnote is defined twice, only the first definition is used, in every output including the Doc Tree.

## [2.0.1] - 2026-10-09

### Security

- `toDocTree()` now sanitises `DocLink.url` and `DocImage.url` the same way `toHtml()` sanitises `href` and `src`: URLs using any protocol other than `http:`, `https:`, or `mailto:` (for example `javascript:`, `data:`, `vbscript:`) are replaced with `#`. Relative references and `#fragment` links are unchanged. Previously the Doc Tree passed these URLs through as written, so an editor or renderer built on it could emit a `javascript:` link from untrusted Markdown.

If you relied on `data:` image URLs in Doc Tree output, they are now replaced with `#`; resolve them from the source Markdown before calling `toDocTree()` or with a remark plugin.

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
