/**
 * Example 10 — URL Safety
 *
 * The HTML serializer blocks dangerous URL protocols (javascript:, data:, etc.)
 * by default. This example shows what is allowed and what gets replaced with '#'.
 *
 * Run: npx tsx examples/10-url-safety.ts
 */
import { toHtml } from '../src/index.js'

const cases: Array<{ label: string; md: string }> = [
  { label: 'https (safe)',      md: '[link](https://example.com)' },
  { label: 'http (safe)',       md: '[link](http://example.com)' },
  { label: 'mailto (safe)',     md: '[link](mailto:user@example.com)' },
  { label: 'anchor (safe)',     md: '[link](#section)' },
  { label: 'abs path (safe)',   md: '[link](/about)' },
  { label: 'rel path (safe)',   md: '[link](./docs/intro.md)' },
  { label: 'javascript (BLOCKED)', md: '[link](javascript:alert(1))' },
  { label: 'data URL (BLOCKED)',   md: '[link](data:text/html,<h1>hi</h1>)' },
  { label: 'vbscript (BLOCKED)',   md: '[link](vbscript:msgbox(1))' },
  { label: 'img javascript (BLOCKED)', md: '![x](javascript:alert(1))' },
  { label: 'img data (BLOCKED)',       md: '![x](data:image/svg+xml,<svg/>)' },
]

for (const { label, md } of cases) {
  const html = toHtml(md)
  // Extract href or src from the output
  const match = html.match(/(?:href|src)="([^"]*)"/)
  console.log(`${label.padEnd(28)} → ${match?.[1] ?? '(no attr)'}`)
}
