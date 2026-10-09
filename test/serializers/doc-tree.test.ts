import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { toDocTree } from '../../src/serializers/doc-tree/index.js'
import type { DocDocument, DocHeading, DocInlineNode, DocParagraph, DocText } from '../../src/types.js'

const fixture = (name: string) =>
  readFileSync(join(import.meta.dirname, '../fixtures', name), 'utf8')

describe('toDocTree', () => {
  it('renders basic markdown', () => {
    const result = toDocTree(fixture('basic.md'))
    expect(result).toMatchSnapshot()
  })

  it('renders GFM tables', () => {
    const result = toDocTree(fixture('gfm-tables.md'))
    expect(result).toMatchSnapshot()
  })

  it('renders kitchen sink', () => {
    const result = toDocTree(fixture('kitchen-sink.md'))
    expect(result).toMatchSnapshot()
  })

  describe('document root', () => {
    it('returns a DocDocument', () => {
      const doc = toDocTree('# Hello')
      expect(doc.type).toBe('document')
      expect(Array.isArray(doc.children)).toBe(true)
    })
  })

  describe('headings', () => {
    it('maps heading depth', () => {
      const doc = toDocTree('# H1\n\n## H2\n\n### H3')
      expect((doc.children[0] as DocHeading).depth).toBe(1)
      expect((doc.children[1] as DocHeading).depth).toBe(2)
      expect((doc.children[2] as DocHeading).depth).toBe(3)
    })
  })

  describe('inline flags', () => {
    it('sets bold flag', () => {
      const doc = toDocTree('**bold**')
      const p = doc.children[0] as DocParagraph
      const t = p.children[0] as DocText
      expect(t.bold).toBe(true)
      expect(t.italic).toBe(false)
    })

    it('sets italic flag', () => {
      const doc = toDocTree('*italic*')
      const p = doc.children[0] as DocParagraph
      const t = p.children[0] as DocText
      expect(t.italic).toBe(true)
      expect(t.bold).toBe(false)
    })

    it('sets strikethrough flag', () => {
      const doc = toDocTree('~~del~~')
      const p = doc.children[0] as DocParagraph
      const t = p.children[0] as DocText
      expect(t.strikethrough).toBe(true)
    })

    it('combines bold + italic flags', () => {
      const doc = toDocTree('***both***')
      const p = doc.children[0] as DocParagraph
      const t = p.children[0] as DocText
      expect(t.bold).toBe(true)
      expect(t.italic).toBe(true)
    })
  })

  describe('table header', () => {
    it('marks first row as isHeader', () => {
      const doc = toDocTree('| A |\n| - |\n| 1 |')
      const table = doc.children.find((n) => n.type === 'table')
      expect(table).toBeDefined()
      if (table?.type === 'table') {
        expect(table.children[0]?.isHeader).toBe(true)
        expect(table.children[1]?.isHeader).toBe(false)
      }
    })
  })

  describe('task list', () => {
    it('preserves checked state', () => {
      const doc = toDocTree('- [x] done\n- [ ] todo')
      const list = doc.children.find((n) => n.type === 'list')
      expect(list?.type).toBe('list')
      if (list?.type === 'list') {
        expect(list.children[0]?.checked).toBe(true)
        expect(list.children[1]?.checked).toBe(false)
      }
    })
  })

  describe('code block', () => {
    it('captures lang and value', () => {
      const doc = toDocTree('```ts\nconst x = 1\n```')
      const code = doc.children.find((n) => n.type === 'code')
      expect(code?.type).toBe('code')
      if (code?.type === 'code') {
        expect(code.lang).toBe('ts')
        expect(code.value).toBe('const x = 1')
      }
    })
  })

  describe('URL sanitisation', () => {
    const firstInline = (md: string): DocInlineNode | undefined => {
      const para = toDocTree(md).children[0] as DocParagraph
      return para.children[0]
    }
    const linkUrl = (md: string) => {
      const node = firstInline(md)
      return node?.type === 'link' ? node.url : undefined
    }
    const imageUrl = (md: string) => {
      const node = firstInline(md)
      return node?.type === 'image' ? node.url : undefined
    }

    it('blocks javascript: URLs in links', () => {
      expect(linkUrl('[click](javascript:alert(1))')).toBe('#')
    })

    it('blocks mixed-case and whitespace-obfuscated javascript: URLs', () => {
      expect(linkUrl('[x](JavaScript:alert(1))')).toBe('#')
      expect(linkUrl('[x](java&#9;script:alert(1))')).toBe('#')
    })

    it('blocks data: and vbscript: URLs in links', () => {
      expect(linkUrl('[x](data:text/html,hi)')).toBe('#')
      expect(linkUrl('[x](vbscript:msgbox)')).toBe('#')
    })

    it('blocks javascript: and data: URLs in images', () => {
      expect(imageUrl('![x](javascript:alert(1))')).toBe('#')
      expect(imageUrl('![x](data:image/svg+xml,<svg/>)')).toBe('#')
    })

    it('allows http:, https: and mailto: URLs', () => {
      expect(linkUrl('[x](https://example.com/a?b=1)')).toBe('https://example.com/a?b=1')
      expect(linkUrl('[x](http://example.com)')).toBe('http://example.com')
      expect(linkUrl('[x](mailto:user@example.com)')).toBe('mailto:user@example.com')
      expect(imageUrl('![x](https://example.com/a.png)')).toBe('https://example.com/a.png')
    })

    it('allows relative URLs and fragments', () => {
      expect(linkUrl('[x](/path/to/page)')).toBe('/path/to/page')
      expect(linkUrl('[x](./page.md)')).toBe('./page.md')
      expect(linkUrl('[x](#section)')).toBe('#section')
      expect(imageUrl('![x](img/logo.png)')).toBe('img/logo.png')
    })

    it('sanitises links nested inside formatting', () => {
      const para = toDocTree('**[x](javascript:alert(1))**').children[0] as DocParagraph
      const link = para.children.find((n) => n.type === 'link')
      expect(link?.type === 'link' && link.url).toBe('#')
    })
  })

  describe('type-level checks', () => {
    it('DocDocument type is correct', () => {
      const doc: DocDocument = toDocTree('hello')
      expect(doc.type).toBe('document')
    })
  })
})
