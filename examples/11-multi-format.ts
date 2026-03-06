/**
 * Example 11 — Multi-format Output from a Single Parse
 *
 * serialize() parses the Markdown once per call. If you need multiple output
 * formats from the same source, you can call each converter independently —
 * or parse once manually and call serializer.serialize() directly.
 *
 * Run: npx tsx examples/11-multi-format.ts
 */
import { parseMarkdown } from '../src/parser.js'
import { HtmlSerializer, AnsiSerializer, DocTreeSerializer } from '../src/index.js'

const md = `
# Release Notes — v2.0.0

## Breaking Changes

- \`toText()\` has been removed. Use a custom \`Serializer<string>\` instead.

## New Features

- **ANSI serializer** with full theme support
- **Doc Tree** output for editor integration
- Sub-path exports: \`md-to-rich/html\`, \`md-to-rich/ansi\`, \`md-to-rich/doc-tree\`

## Bug Fixes

- Fixed heading ID collision for duplicate heading text
- Escaped ampersands in link attributes
`

// Parse once, serialize three ways
const ast = parseMarkdown(md)

const html = HtmlSerializer.serialize(ast, {})
const ansi = AnsiSerializer.serialize(ast, { columns: 70 })
const doc = DocTreeSerializer.serialize(ast, {})

console.log('=== HTML output ===')
console.log(html)

console.log('\n=== ANSI output ===')
console.log(ansi)

console.log('\n=== Doc Tree — node types ===')
console.log(doc.children.map((n) => n.type).join(', '))
