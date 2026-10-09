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


  describe('reference-style links and images', () => {
    it('resolves full, collapsed and shortcut link references', () => {
      const html = toHtml('[full][ref], [ref][] and [ref]\n\n[ref]: https://example.com "Title"')
      expect(html).toBe(
        '<p><a href="https://example.com" title="Title">full</a>, ' +
          '<a href="https://example.com" title="Title">ref</a> and ' +
          '<a href="https://example.com" title="Title">ref</a></p>',
      )
    })

    it('resolves image references', () => {
      const html = toHtml('![logo][img]\n\n[img]: https://example.com/logo.png')
      expect(html).toBe('<p><img src="https://example.com/logo.png" alt="logo"></p>')
    })

    it('matches definitions case-insensitively', () => {
      expect(toHtml('[x][REF]\n\n[ref]: /path')).toBe('<p><a href="/path">x</a></p>')
    })

    it('sanitises URLs from definitions', () => {
      expect(toHtml('[x][r]\n\n[r]: javascript:alert(1)')).toBe('<p><a href="#">x</a></p>')
    })
  })

  describe('footnotes', () => {
    const md = 'One[^a] and two[^b], one again[^a].\n\n[^b]: Second note.\n\n[^a]: First note.\n\n[^unused]: Never referenced.'

    it('numbers references in order of first use', () => {
      const html = toHtml(md)
      expect(html).toContain('One<sup><a href="#fn-1" id="fnref-1" data-footnote-ref>1</a></sup>')
      expect(html).toContain('two<sup><a href="#fn-2" id="fnref-2" data-footnote-ref>2</a></sup>')
      expect(html).toContain('again<sup><a href="#fn-1" id="fnref-1-2" data-footnote-ref>1</a></sup>')
    })

    it('renders referenced definitions in a footnotes section with back-links', () => {
      const html = toHtml(md)
      expect(html).toContain(
        '<section class="footnotes" data-footnotes><ol>' +
          '<li id="fn-1"><p>First note. <a href="#fnref-1" data-footnote-backref aria-label="Back to reference 1">↩</a></p></li>' +
          '<li id="fn-2"><p>Second note. <a href="#fnref-2" data-footnote-backref aria-label="Back to reference 2">↩</a></p></li>' +
          '</ol></section>',
      )
      expect(html).not.toContain('Never referenced')
    })

    it('places the footnotes section at the end', () => {
      expect(toHtml(md).endsWith('</section>')).toBe(true)
    })

    it('renders nothing extra without footnotes', () => {
      expect(toHtml('plain')).toBe('<p>plain</p>')
    })

    it('numbers body references before references nested in footnotes', () => {
      const html = toHtml('A[^1] B[^2]\n\n[^1]: see[^3]\n\n[^2]: x\n\n[^3]: y')
      expect(html).toContain('A<sup><a href="#fn-1"')
      expect(html).toContain('B<sup><a href="#fn-2"')
      expect(html).toContain('see<sup><a href="#fn-3"')
    })

    it('handles self-referencing footnotes without looping', () => {
      expect(toHtml('x[^a]\n\n[^a]: see[^a]')).toContain('<li id="fn-1">')
    })

    it('applies classNames to the footnote list and paragraphs', () => {
      const html = toHtml('x[^a]\n\n[^a]: note', { classNames: { ol: 'notes', li: 'note', p: 'para' } })
      expect(html).toContain('<ol class="notes"><li id="fn-1" class="note"><p class="para">note <a href="#fnref-1"')
    })

    it('appends the back-link after a non-paragraph last block', () => {
      const html = toHtml('x[^a]\n\n[^a]:\n    ```\n    code\n    ```')
      expect(html).toMatch(/<\/pre><a href="#fnref-1" data-footnote-backref/)
    })

    it('resolves definitions nested in blockquotes and references inside link text', () => {
      expect(toHtml('[![a][i]][l]\n\n> [i]: /i.png\n\n[l]: /page')).toBe(
        '<p><a href="/page"><img src="/i.png" alt="a"></a></p><blockquote></blockquote>',
      )
    })

    it('leaves [^1] as text when GFM is off', () => {
      expect(toHtml('x[^1]\n\n[^1]: n', { gfm: false })).not.toContain('<sup>')
    })
  })

  describe('heading id slugs', () => {
    it('includes inline code text', () => {
      expect(toHtml('## Use `foo` here')).toBe('<h2 id="use-foo-here">Use <code>foo</code> here</h2>')
    })

    it('keeps non-ASCII letters', () => {
      expect(toHtml('# Café au lait')).toContain('id="café-au-lait"')
      expect(toHtml('# 日本語 テキスト')).toContain('id="日本語-テキスト"')
    })

    it('drops emoji and their variation selectors', () => {
      expect(toHtml('# ❤️ Love')).toContain('id="love"')
      expect(toHtml('# 1️⃣ Step')).toContain('id="1-step"')
    })

    it('keeps underscores as hyphens and ignores footnote markers', () => {
      expect(toHtml('# snake_case name')).toContain('id="snake-case-name"')
      expect(toHtml('# Title[^a]\n\n[^a]: n')).toContain('id="title"')
    })
  })

  describe('ordered list start', () => {
    it('emits a start attribute when the list does not start at 1', () => {
      expect(toHtml('3. three\n4. four')).toBe('<ol start="3"><li>three</li><li>four</li></ol>')
    })

    it('omits the start attribute for lists starting at 1', () => {
      expect(toHtml('1. one')).toBe('<ol><li>one</li></ol>')
    })
  })

  describe('code block classes', () => {
    it('merges the language class with classNames.code', () => {
      expect(toHtml('```ts\nx\n```', { classNames: { code: 'mono' } })).toBe(
        '<pre><code class="language-ts mono">x</code></pre>',
      )
    })
  })
})
