/**
 * Example 08 — Custom ANSI Theme
 *
 * Override individual style entries in AnsiTheme to match your terminal
 * colour scheme or brand palette. Only the keys you provide are overridden;
 * the rest fall back to the built-in defaults.
 *
 * Run: npx tsx examples/08-ansi-custom-theme.ts
 */
import { toAnsi } from '../src/index.js'
import type { AnsiTheme } from '../src/index.js'

const md = `
# Custom Theme Demo

A paragraph with **bold**, *italic*, and \`inline code\`.

> Blockquote text.

\`\`\`js
const x = 42
\`\`\`

- List item one
- List item two

---
`

// Minimalist monochrome theme — bold only, no colour
const monochromeTheme: Partial<AnsiTheme> = {
  h1: { open: '\x1b[1m', close: '\x1b[0m' },
  h2: { open: '\x1b[1m', close: '\x1b[0m' },
  h3: { open: '\x1b[1m', close: '\x1b[0m' },
  inlineCode: { open: '\x1b[7m', close: '\x1b[27m' },   // reverse video
  codeBlock: { open: '', close: '' },
  blockquote: { open: '\x1b[2m', close: '\x1b[22m' },   // dim
  link: { open: '\x1b[4m', close: '\x1b[24m' },          // underline only
  hrChar: '─',
  listBullet: '-',
}

console.log('=== Default theme ===')
console.log(toAnsi(md, { columns: 60 }))

console.log('\n=== Monochrome theme ===')
console.log(toAnsi(md, { columns: 60, theme: monochromeTheme }))

// Emoji bullet points with a custom HR character
const funTheme: Partial<AnsiTheme> = {
  listBullet: '→',
  hrChar: '·',
}
console.log('\n=== Fun theme (custom bullets and HR) ===')
console.log(toAnsi('- Alpha\n- Beta\n- Gamma\n\n---', { columns: 40, theme: funTheme }))
