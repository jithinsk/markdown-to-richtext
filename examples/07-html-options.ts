/**
 * Example 07 — HTML Options
 *
 * Demonstrates headingIds, classNames, renderImages, and allowRawHtml.
 *
 * Run: npx tsx examples/07-html-options.ts
 */
import { toHtml } from '../src/index.js'

const md = `
# Main Title

## Section One

A paragraph with an ![inline image](https://example.com/img.png) inside it.

### Section Three

Another paragraph.
`

// Default: heading IDs on, images rendered
console.log('=== Default ===')
console.log(toHtml(md))

// Custom CSS class names for integration with a design system
console.log('\n=== With classNames ===')
console.log(
  toHtml(md, {
    classNames: {
      h1: 'text-4xl font-bold',
      h2: 'text-2xl font-semibold',
      h3: 'text-xl font-medium',
      p: 'text-base leading-relaxed',
      a: 'underline text-blue-600',
    },
  }),
)

// Disable heading IDs (e.g. when embedding a fragment inside a larger page)
console.log('\n=== headingIds: false ===')
console.log(toHtml(md, { headingIds: false }))

// Suppress images (e.g. for email-safe HTML or plain text contexts)
console.log('\n=== renderImages: false ===')
console.log(toHtml(md, { renderImages: false }))

// allowRawHtml: raw HTML nodes in the Markdown source pass through
// WARNING: only use with fully trusted input
const mdWithHtml = '# Title\n\n<div class="callout">Raw <strong>HTML</strong> block</div>'
console.log('\n=== allowRawHtml: true (trusted source only) ===')
console.log(toHtml(mdWithHtml, { allowRawHtml: true }))

// Same input without the flag — raw HTML is suppressed
console.log('\n=== allowRawHtml: false (default, safe) ===')
console.log(toHtml(mdWithHtml))
