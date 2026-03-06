/**
 * Example 06 — GFM Task Lists
 *
 * Shows how checked/unchecked task list items render in HTML, ANSI, and
 * the Doc Tree (where checked is a boolean | null on DocListItem).
 *
 * Run: npx tsx examples/06-task-lists.ts
 */
import { toAnsi, toDocTree, toHtml } from '../src/index.js'
import type { DocList, DocListItem } from '../src/index.js'

const md = `
## Sprint Tasks

- [x] Set up repository
- [x] Write core parser
- [x] HTML serializer
- [x] ANSI serializer
- [x] Doc Tree serializer
- [ ] Publish to npm
- [ ] Write blog post
`

console.log('=== HTML ===')
console.log(toHtml(md))

console.log('\n=== ANSI ===')
console.log(toAnsi(md, { columns: 60 }))

console.log('\n=== Doc Tree — task status ===')
const doc = toDocTree(md)
const list = doc.children.find((n): n is DocList => n.type === 'list')
if (list) {
  for (const item of list.children as DocListItem[]) {
    const label = item.children
      .flatMap((c) => ('children' in c ? c.children : [c]))
      .filter((n) => n.type === 'text')
      .map((n) => (n as { value: string }).value)
      .join('')
    const status = item.checked === true ? '✓' : item.checked === false ? '✗' : '–'
    console.log(`  [${status}] ${label}`)
  }
}
