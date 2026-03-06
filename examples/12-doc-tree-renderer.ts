/**
 * Example 12 — Custom Renderer over Doc Tree
 *
 * toDocTree() produces a serializer-agnostic JSON tree. This example walks
 * the tree manually to produce a simple Markdown-like plain text summary —
 * demonstrating how you might build a ProseMirror / Slate adapter.
 *
 * Run: npx tsx examples/12-doc-tree-renderer.ts
 */
import { toDocTree } from '../src/index.js'
import type {
  DocBlockNode, DocInlineNode,
  DocHeading, DocParagraph, DocBlockquote,
  DocCodeBlock, DocList, DocTable, DocText,
} from '../src/index.js'

const md = `
# Document Title

An intro paragraph with **bold** and *italic* text.

## Features

- First feature with \`inline code\`
- Second feature
  - Nested bullet

| Name  | Value |
| ----- | ----- |
| alpha | 1     |
| beta  | 2     |

> Important note inside a blockquote.

\`\`\`ts
const result = toDocTree(md)
\`\`\`
`

// ---------------------------------------------------------------------------
// Hand-written walker — shows how any consumer can traverse DocTree
// ---------------------------------------------------------------------------

function renderInline(node: DocInlineNode): string {
  switch (node.type) {
    case 'text': {
      const t = node as DocText
      let v = t.value
      if (t.bold) v = `**${v}**`
      if (t.italic) v = `_${v}_`
      if (t.strikethrough) v = `~~${v}~~`
      return v
    }
    case 'inlineCode':
      return `\`${node.value}\``
    case 'link':
      return `[${node.children.map(renderInline).join('')}](${node.url})`
    case 'image':
      return `![${node.alt ?? ''}](${node.url})`
    case 'break':
      return '\n'
    default:
      return ''
  }
}

function renderBlock(node: DocBlockNode, depth = 0): string {
  const indent = '  '.repeat(depth)
  switch (node.type) {
    case 'heading': {
      const h = node as DocHeading
      return `${'#'.repeat(h.depth)} ${h.children.map(renderInline).join('')}`
    }
    case 'paragraph': {
      const p = node as DocParagraph
      return p.children.map(renderInline).join('')
    }
    case 'blockquote': {
      const bq = node as DocBlockquote
      return bq.children
        .map((c) => renderBlock(c, depth))
        .map((line) => `> ${line}`)
        .join('\n')
    }
    case 'code': {
      const c = node as DocCodeBlock
      return `\`\`\`${c.lang ?? ''}\n${c.value}\n\`\`\``
    }
    case 'list': {
      const l = node as DocList
      return l.children
        .map((item, i) => {
          const bullet = l.ordered ? `${i + 1}.` : '-'
          const text = item.children.map((c) => {
            if ('children' in c && c.type !== 'list') {
              return renderBlock(c as DocBlockNode, depth)
            }
            if (c.type === 'list') return '\n' + renderBlock(c, depth + 1)
            return renderInline(c as DocInlineNode)
          }).join('')
          return `${indent}${bullet} ${text.trim()}`
        })
        .join('\n')
    }
    case 'table': {
      const t = node as DocTable
      return t.children
        .map((row) =>
          '| ' + row.children.map((cell) => cell.children.map(renderInline).join('')).join(' | ') + ' |',
        )
        .join('\n')
    }
    case 'thematicBreak':
      return '---'
    default:
      return ''
  }
}

const doc = toDocTree(md)
const output = doc.children.map((n) => renderBlock(n)).join('\n\n')

console.log('=== Reconstructed from Doc Tree ===')
console.log(output)
