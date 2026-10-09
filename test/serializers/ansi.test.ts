import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { toAnsi } from '../../src/serializers/ansi/index.js'

const fixture = (name: string) =>
  readFileSync(join(import.meta.dirname, '../fixtures', name), 'utf8')

const ANSI_RE = /\x1b\[[^m]*m|\x1b\][^\x07]*\x07/g
const strip = (s: string) => s.replace(ANSI_RE, '')

describe('toAnsi', () => {
  it('renders basic markdown', () => {
    const result = toAnsi(fixture('basic.md'), { columns: 80 })
    expect(result).toMatchSnapshot()
  })

  it('renders GFM tables', () => {
    const result = toAnsi(fixture('gfm-tables.md'), { columns: 80 })
    expect(result).toMatchSnapshot()
  })

  it('renders kitchen sink', () => {
    const result = toAnsi(fixture('kitchen-sink.md'), { columns: 80 })
    expect(result).toMatchSnapshot()
  })

  describe('headings', () => {
    it('applies ANSI styling to h1', () => {
      const result = toAnsi('# Hello')
      expect(result).toContain('\x1b[')
      expect(strip(result)).toContain('Hello')
    })
  })

  describe('inline elements', () => {
    it('renders bold text', () => {
      const result = toAnsi('**bold**', { columns: 80 })
      expect(strip(result)).toContain('bold')
      expect(result).toContain('\x1b[1m')
    })

    it('renders italic text', () => {
      const result = toAnsi('*italic*', { columns: 80 })
      expect(strip(result)).toContain('italic')
      expect(result).toContain('\x1b[3m')
    })

    it('renders inline code', () => {
      const result = toAnsi('`code`', { columns: 80 })
      expect(strip(result)).toContain('code')
    })

    it('renders links with url', () => {
      const result = toAnsi('[label](https://example.com)', { columns: 80 })
      expect(strip(result)).toContain('label')
      expect(strip(result)).toContain('https://example.com')
    })

    it('renders OSC 8 hyperlinks when enabled', () => {
      const result = toAnsi('[label](https://example.com)', {
        columns: 80,
        hyperlinks: true,
      })
      expect(result).toContain('\x1b]8;;https://example.com\x07')
    })

    it('strips control characters from OSC 8 URLs to prevent injection', () => {
      // BEL (\x07) inside the URL would terminate the OSC sequence early
      const malicious = 'https://example.com\x07\x1b[31m injected'
      const result = toAnsi(`[label](${malicious})`, {
        columns: 80,
        hyperlinks: true,
      })
      // The injected BEL and ESC must not appear inside the OSC parameter
      const oscParam = result.match(/\x1b\]8;;([^\x07]*)\x07/)?.[1] ?? ''
      expect(oscParam).not.toContain('\x07')
      expect(oscParam).not.toContain('\x1b')
    })
  })

  describe('blockquote', () => {
    it('prefixes lines with vertical bar', () => {
      const result = toAnsi('> quote', { columns: 80 })
      expect(strip(result)).toContain('│')
    })
  })

  describe('thematic break', () => {
    it('fills columns with hr char', () => {
      const result = toAnsi('---', { columns: 20 })
      expect(result).toContain('─'.repeat(20))
    })
  })

  describe('code blocks', () => {
    it('renders code block with border', () => {
      const result = toAnsi('```js\nconsole.log(1)\n```', { columns: 80 })
      expect(strip(result)).toContain('┌─')
      expect(strip(result)).toContain('console.log(1)')
    })
  })

  describe('task list', () => {
    it('renders checked items', () => {
      const result = toAnsi('- [x] done\n- [ ] todo', { columns: 80 })
      expect(strip(result)).toContain('[x]')
      expect(strip(result)).toContain('[ ]')
    })
  })

  describe('custom theme', () => {
    it('uses custom hrChar', () => {
      const result = toAnsi('---', {
        columns: 5,
        theme: { hrChar: '=' },
      })
      expect(result).toContain('=====')
    })
  })


  describe('reference-style links and images', () => {
    it('resolves link references', () => {
      expect(strip(toAnsi('[full][ref]\n\n[ref]: https://example.com', { columns: 80 }))).toBe(
        'full (https://example.com)',
      )
    })

    it('resolves image references', () => {
      expect(strip(toAnsi('![logo][img]\n\n[img]: https://example.com/logo.png', { columns: 80 }))).toBe(
        '[image: logo]',
      )
    })
  })

  describe('footnotes', () => {
    it('marks references and lists referenced notes at the end', () => {
      const out = strip(toAnsi('One[^a] two[^b].\n\n[^b]: Second.\n\n[^a]: First.\n\n[^x]: Unused.', { columns: 80 }))
      expect(out).toBe('One[1] two[2].\n\n[1] First.\n[2] Second.')
    })

    it('keeps wrapped footnote text within the column limit', () => {
      const out = strip(toAnsi('Text[^a].\n\n[^a]: ' + 'word '.repeat(30), { columns: 30 }))
      for (const line of out.split('\n')) expect(line.length).toBeLessThanOrEqual(30)
    })
  })

  describe('ordered list start', () => {
    it('numbers from the list start', () => {
      expect(strip(toAnsi('3. three\n4. four', { columns: 80 }))).toBe('3. three\n4. four')
    })
  })

  describe('list items with block content', () => {
    it('keeps code blocks inside list items', () => {
      const out = strip(toAnsi('- item\n\n  ```\n  code\n  ```', { columns: 80 }))
      expect(out).toContain('• item')
      expect(out).toContain('code')
    })
  })

  describe('hyperlink safety', () => {
    it('does not emit OSC 8 hyperlinks for unsafe URLs', () => {
      const out = toAnsi('[x](javascript:alert(1))', { columns: 80, hyperlinks: true })
      expect(out).not.toContain('javascript:')
      expect(out).not.toContain('\x1b]8;;')
      expect(strip(out)).toBe('x')
    })

    it('omits unsafe URLs from plain link output', () => {
      expect(strip(toAnsi('[x](javascript:alert(1))', { columns: 80 }))).toBe('x')
    })

    it('still emits OSC 8 hyperlinks for safe URLs', () => {
      expect(toAnsi('[x](https://example.com)', { columns: 80, hyperlinks: true })).toContain(
        '\x1b]8;;https://example.com\x07',
      )
    })
  })

  describe('images', () => {
    it('falls back to the URL when alt text is empty', () => {
      expect(strip(toAnsi('![](https://example.com/a.png)', { columns: 80 }))).toBe(
        '[image: https://example.com/a.png]',
      )
    })
  })

  describe('blockquote width', () => {
    it('keeps prefixed lines within the column limit', () => {
      const out = strip(toAnsi('> ' + 'word '.repeat(40), { columns: 30 }))
      for (const line of out.split('\n')) expect(line.length).toBeLessThanOrEqual(30)
    })
  })
})
