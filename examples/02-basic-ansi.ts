/**
 * Example 02 — Basic Markdown to ANSI terminal output
 *
 * Run: npx tsx examples/02-basic-ansi.ts
 */
import { toAnsi } from '../src/index.js'

const md = `
# Hello Terminal

A paragraph with **bold**, *italic*, ~~strikethrough~~, and \`inline code\`.

> A blockquote.
> It can span multiple lines.

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`
}
\`\`\`

- Item one
- Item two
  - Nested item
- Item three
`

const output = toAnsi(md, { columns: 80 })
console.log(output)
