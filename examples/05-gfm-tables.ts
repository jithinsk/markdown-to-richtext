/**
 * Example 05 — GFM Tables
 *
 * Demonstrates table rendering across all three built-in serializers.
 *
 * Run: npx tsx examples/05-gfm-tables.ts
 */
import { toAnsi, toDocTree, toHtml } from '../src/index.js'

const md = `
# Comparison Table

| Framework | Language   | Stars |
| :-------- | :--------: | ----: |
| React     | JavaScript | 220k  |
| Vue       | JavaScript | 210k  |
| Svelte    | JavaScript | 78k   |
| SolidJS   | JavaScript | 32k   |
`

console.log('=== HTML ===')
console.log(toHtml(md))

console.log('\n=== ANSI ===')
console.log(toAnsi(md, { columns: 60 }))

console.log('\n=== Doc Tree (table node) ===')
const doc = toDocTree(md)
const table = doc.children.find((n) => n.type === 'table')
console.log(JSON.stringify(table, null, 2))
