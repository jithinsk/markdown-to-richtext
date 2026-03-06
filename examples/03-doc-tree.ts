/**
 * Example 03 — Markdown to Doc Tree (structured JSON)
 *
 * toDocTree() returns a plain JSON tree — no HTML, no ANSI. Useful for feeding
 * into rich-text editors (ProseMirror, Slate, Quill) or custom renderers.
 *
 * Run: npx tsx examples/03-doc-tree.ts
 */
import { toDocTree } from '../src/index.js'
import type { DocHeading, DocParagraph, DocText } from '../src/index.js'

const md = `
# Getting Started

Install the package with **npm install md-to-rich**.

## Features

- Extensible serializer interface
- GFM support (tables, task lists)
- Zero runtime dependencies beyond remark
`

const doc = toDocTree(md)

// Pretty-print the full tree
console.log(JSON.stringify(doc, null, 2))

// Example: extract all headings
const headings = doc.children.filter((n): n is DocHeading => n.type === 'heading')
console.log('\nHeadings found:')
for (const h of headings) {
  const text = h.children
    .filter((n): n is DocText => n.type === 'text')
    .map((n) => n.value)
    .join('')
  console.log(`  H${h.depth}: ${text}`)
}

// Example: check for bold text in first paragraph
const firstPara = doc.children.find((n): n is DocParagraph => n.type === 'paragraph')
if (firstPara) {
  const boldParts = firstPara.children.filter(
    (n): n is DocText => n.type === 'text' && n.bold,
  )
  console.log('\nBold text in first paragraph:', boldParts.map((n) => n.value))
}
