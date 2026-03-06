import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { toHtml } from '../../src/serializers/html/index.js'

const fixture = (name: string) =>
  readFileSync(join(import.meta.dirname, '../fixtures', name), 'utf8')

describe('toHtml', () => {
  it('renders basic markdown', () => {
    const result = toHtml(fixture('basic.md'))
    expect(result).toMatchSnapshot()
  })

  it('renders GFM tables', () => {
    const result = toHtml(fixture('gfm-tables.md'))
    expect(result).toMatchSnapshot()
  })

  it('renders GFM task lists', () => {
    const result = toHtml(fixture('gfm-tasklist.md'))
    expect(result).toMatchSnapshot()
  })

  it('renders nested lists', () => {
    const result = toHtml(fixture('nested-lists.md'))
    expect(result).toMatchSnapshot()
  })

  it('renders code blocks', () => {
    const result = toHtml(fixture('code-blocks.md'))
    expect(result).toMatchSnapshot()
  })

  it('renders kitchen sink', () => {
    const result = toHtml(fixture('kitchen-sink.md'))
    expect(result).toMatchSnapshot()
  })

  describe('heading ids', () => {
    it('generates slug ids by default', () => {
      const html = toHtml('# Hello World')
      expect(html).toContain('id="hello-world"')
    })

    it('handles duplicate headings', () => {
      const html = toHtml('# Hello\n\n# Hello')
      expect(html).toContain('id="hello"')
      expect(html).toContain('id="hello-1"')
    })

    it('can disable heading ids', () => {
      const html = toHtml('# Hello', { headingIds: false })
      expect(html).not.toContain('id=')
    })
  })

  describe('inline elements', () => {
    it('renders bold', () => {
      expect(toHtml('**bold**')).toContain('<strong>bold</strong>')
    })

    it('renders italic', () => {
      expect(toHtml('*italic*')).toContain('<em>italic</em>')
    })

    it('renders strikethrough', () => {
      expect(toHtml('~~del~~')).toContain('<del>del</del>')
    })

    it('renders inline code', () => {
      expect(toHtml('`code`')).toContain('<code>code</code>')
    })

    it('renders links', () => {
      const html = toHtml('[text](https://example.com)')
      expect(html).toContain('<a href="https://example.com"')
      expect(html).toContain('>text</a>')
    })

    it('renders images', () => {
      const html = toHtml('![alt](https://example.com/img.png)')
      expect(html).toContain('<img src="https://example.com/img.png"')
    })

    it('omits images when renderImages=false', () => {
      const html = toHtml('![alt](https://example.com/img.png)', { renderImages: false })
      expect(html).not.toContain('<img')
    })
  })

  describe('classNames option', () => {
    it('adds custom class to headings', () => {
      const html = toHtml('# Hello', { classNames: { h1: 'title' } })
      expect(html).toContain('class="title"')
    })
  })

  describe('escaping', () => {
    it('escapes ampersands in text', () => {
      const html = toHtml('A & B')
      expect(html).toContain('&amp;')
      expect(html).not.toContain(' & ')
    })

    it('escapes quotes in link attributes', () => {
      const html = toHtml('[text](https://example.com?a=1&b=2)')
      expect(html).toContain('&amp;')
    })
  })

  describe('GFM table alignment', () => {
    it('applies text-align style on cells', () => {
      const html = toHtml('| A |\n| :- |\n| 1 |')
      expect(html).toContain('style="text-align:left"')
    })
  })

  describe('raw HTML passthrough (allowRawHtml)', () => {
    it('suppresses raw block HTML by default', () => {
      const html = toHtml('<script>alert(1)</script>')
      expect(html).not.toContain('<script>')
    })

    it('suppresses raw inline HTML by default', () => {
      const html = toHtml('hello <b>world</b>')
      expect(html).not.toContain('<b>')
    })

    it('passes through raw HTML when allowRawHtml is true', () => {
      const html = toHtml('<em>hi</em>', { allowRawHtml: true })
      expect(html).toContain('<em>hi</em>')
    })
  })

  describe('URL sanitisation', () => {
    it('blocks javascript: URLs in links', () => {
      const html = toHtml('[click](javascript:alert(1))')
      expect(html).not.toContain('javascript:')
      expect(html).toContain('href="#"')
    })

    it('blocks data: URLs in links', () => {
      const html = toHtml('[x](data:text/html,<h1>hi</h1>)')
      expect(html).not.toContain('data:')
      expect(html).toContain('href="#"')
    })

    it('blocks javascript: URLs in images', () => {
      const html = toHtml('![x](javascript:alert(1))')
      expect(html).not.toContain('javascript:')
    })

    it('allows https: URLs', () => {
      const html = toHtml('[x](https://example.com)')
      expect(html).toContain('href="https://example.com"')
    })

    it('allows relative URLs', () => {
      const html = toHtml('[x](/path/to/page)')
      expect(html).toContain('href="/path/to/page"')
    })

    it('allows anchor URLs', () => {
      const html = toHtml('[x](#section)')
      expect(html).toContain('href="#section"')
    })

    it('allows mailto: URLs', () => {
      const html = toHtml('[x](mailto:a@b.com)')
      expect(html).toContain('href="mailto:a@b.com"')
    })
  })
})
