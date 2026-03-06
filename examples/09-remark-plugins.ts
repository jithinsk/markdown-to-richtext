/**
 * Example 09 — Custom remark Plugins
 *
 * Pass additional remark plugins via the remarkPlugins option. They run after
 * remark-parse (and remark-gfm if enabled) but before serialization, so you
 * can transform the MDAST before it reaches any serializer.
 *
 * This example uses remark-frontmatter to strip YAML front matter before
 * rendering, so it doesn't bleed into the HTML output.
 *
 * Install the extra dep first:
 *   npm install remark-frontmatter
 *
 * Run: npx tsx examples/09-remark-plugins.ts
 */
import { toHtml, toDocTree } from '../src/index.js'

// ---------------------------------------------------------------------------
// A hand-rolled no-dependency plugin that uppercases all heading text —
// demonstrates the MDAST transform API without needing an extra package.
// ---------------------------------------------------------------------------

import type { Plugin } from 'unified'
import type { Root, Text } from 'mdast'
import { visit } from 'unist-util-visit'

const uppercaseHeadings: Plugin<[], Root> = () => (tree: Root) => {
  visit(tree, 'heading', (heading) => {
    visit(heading, 'text', (textNode: Text) => {
      textNode.value = textNode.value.toUpperCase()
    })
  })
}

const md = `
# hello world

A normal paragraph.

## section two

Another paragraph.
`

console.log('=== Without plugin ===')
console.log(toHtml(md))

console.log('\n=== With uppercaseHeadings plugin ===')
console.log(toHtml(md, { remarkPlugins: [uppercaseHeadings] }))

// Plugins also work with other serializers
console.log('\n=== Doc Tree with plugin ===')
const doc = toDocTree(md, { remarkPlugins: [uppercaseHeadings] })
console.log(JSON.stringify(doc.children[0], null, 2))
