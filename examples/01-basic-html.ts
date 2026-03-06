/**
 * Example 01 — Basic Markdown to HTML
 *
 * Run: npx tsx examples/01-basic-html.ts
 */
import { toHtml } from '../src/index.js'

const md = `
# Hello World

A paragraph with **bold**, *italic*, ~~strikethrough~~, and \`inline code\`.

> A blockquote with a [link](https://example.com).

---

Plain paragraph after a horizontal rule.
`

const html = toHtml(md)
console.log(html)
