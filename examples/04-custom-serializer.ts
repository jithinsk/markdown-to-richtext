/**
 * Example 04 — Custom Serializer
 *
 * Implement the Serializer<T> interface to produce any output format.
 * This example builds a plain-text extractor and a word-count serializer.
 *
 * Run: npx tsx examples/04-custom-serializer.ts
 */
import type { Root } from 'mdast'
import { serialize } from '../src/index.js'
import type { BaseOptions, Serializer } from '../src/index.js'

// ---------------------------------------------------------------------------
// 1. Plain text extractor
// ---------------------------------------------------------------------------

const PlainTextSerializer: Serializer<string> = {
  serialize(ast: Root): string {
    function extract(node: { type: string; value?: string; children?: unknown[] }): string {
      if (node.value !== undefined) return node.value
      if (node.children) {
        return (node.children as typeof node[]).map(extract).join('')
      }
      return ''
    }
    return extract(ast as unknown as { type: string; value?: string; children?: unknown[] })
  },
}

const plain = serialize('# Hello\n\nThis is **bold** and *italic* text.', PlainTextSerializer)
console.log('Plain text:')
console.log(plain)

// ---------------------------------------------------------------------------
// 2. Word-count serializer with options
// ---------------------------------------------------------------------------

interface WordCountOptions extends BaseOptions {
  /** Only count words of at least this length (default: 1) */
  minLength?: number
}

const WordCountSerializer: Serializer<number, WordCountOptions> = {
  serialize(ast: Root, options: WordCountOptions): number {
    function extract(node: { type: string; value?: string; children?: unknown[] }): string {
      if (node.value !== undefined) return node.value
      if (node.children) {
        return (node.children as typeof node[]).map(extract).join(' ')
      }
      return ''
    }
    const text = extract(ast as unknown as { type: string; value?: string; children?: unknown[] })
    const min = options.minLength ?? 1
    return text.split(/\s+/).filter((w) => w.length >= min).length
  },
}

const md = '# The Quick Brown Fox\n\nJumped over the **lazy** dog near the riverbank.'

const total = serialize(md, WordCountSerializer)
const longWords = serialize(md, WordCountSerializer, { minLength: 5 })

console.log(`\nTotal words: ${total}`)
console.log(`Words ≥ 5 chars: ${longWords}`)
