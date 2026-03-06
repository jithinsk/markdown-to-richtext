import { describe, expect, it } from 'vitest'
import { expectTypeOf } from 'vitest'
import { serialize } from '../src/serialize.js'
import type { Root } from 'mdast'
import type { BaseOptions, Serializer } from '../src/types.js'

// Minimal custom serializer for testing the extension point
const PlainTextSerializer: Serializer<string> = {
  serialize(ast: Root): string {
    function extractText(node: { type: string; value?: string; children?: unknown[] }): string {
      if (node.value !== undefined) return node.value
      if (node.children) {
        return (node.children as { type: string; value?: string; children?: unknown[] }[])
          .map(extractText)
          .join('')
      }
      return ''
    }
    return extractText(ast as unknown as { type: string; value?: string; children?: unknown[] })
  },
}

// Custom serializer with options
interface CountOptions extends BaseOptions { minLength?: number }
const WordCountSerializer: Serializer<number, CountOptions> = {
  serialize(ast: Root, options: CountOptions): number {
    function getText(node: { type: string; value?: string; children?: unknown[] }): string {
      if (node.value !== undefined) return node.value
      if (node.children) {
        return (node.children as { type: string; value?: string; children?: unknown[] }[])
          .map(getText)
          .join(' ')
      }
      return ''
    }
    const words = getText(ast as unknown as { type: string; value?: string; children?: unknown[] })
      .split(/\s+/)
      .filter(Boolean)
    const min = options.minLength ?? 0
    return words.filter((w) => w.length >= min).length
  },
}

describe('serialize()', () => {
  it('works with a minimal custom serializer', () => {
    const result = serialize('Hello World', PlainTextSerializer)
    expect(result).toContain('Hello')
    expect(result).toContain('World')
  })

  it('returns the correct type', () => {
    const result = serialize('# Hi', PlainTextSerializer)
    expectTypeOf(result).toBeString()
  })

  it('passes options to the serializer', () => {
    const count = serialize('one two three', WordCountSerializer, { minLength: 4 })
    expect(count).toBe(1) // only "three" (5 chars) meets minLength:4; "one" and "two" are 3 chars
  })

  it('works without options', () => {
    const count = serialize('one two three', WordCountSerializer)
    expect(count).toBe(3)
  })

  it('supports gfm: false', () => {
    // With GFM disabled, tables are not parsed
    const result = serialize('| A |\n| - |\n| 1 |', PlainTextSerializer, { gfm: false })
    expect(result).toContain('A')
  })

  it('respects remarkPlugins option', () => {
    // A no-op plugin that should not throw
    const noop = () => {}
    const result = serialize('hello', PlainTextSerializer, { remarkPlugins: [noop as never] })
    expect(result).toContain('hello')
  })
})
