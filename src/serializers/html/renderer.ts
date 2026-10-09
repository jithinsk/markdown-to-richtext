import type {
  Root, Content, PhrasingContent,
  Heading, Paragraph, Blockquote, Code, List, ListItem,
  Table, TableRow, TableCell, ThematicBreak,
  Text, InlineCode, Strong, Emphasis, Delete, Link, Image, Break,
  Html, FootnoteReference,
} from 'mdast'
import type { HtmlOptions, HtmlElement } from '../../types.js'
import { prepareTree } from '../../references.js'
import { safeUrl } from '../../url.js'

// ---------------------------------------------------------------------------
// Slugger — collision-safe heading ids
// ---------------------------------------------------------------------------

class Slugger {
  private seen = new Map<string, number>()

  slug(value: string): string {
    const base = value
      .toLowerCase()
      // Keep letters and digits from any script, not just ASCII
      .replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, '')
      // Drop combining marks left behind by removed symbols (emoji variation selectors, keycaps)
      .replace(/(?<![\p{L}\p{M}\p{N}])\p{M}+/gu, '')
      .replace(/(?<=\p{N})[\u20e3\ufe0e\ufe0f]+/gu, '')
      .trim()
      .replace(/[\s_]+/g, '-')
    const count = this.seen.get(base) ?? 0
    this.seen.set(base, count + 1)
    return count === 0 ? base : `${base}-${count}`
  }
}

// ---------------------------------------------------------------------------
// Escape / sanitise helpers
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

export function renderToHtml(ast: Root, opts: HtmlOptions): string {
  const { tree, footnoteNumbers, footnotes } = prepareTree(ast)
  const footnoteRefCounts = new Map<number, number>()
  const slugger = new Slugger()
  const headingIds = opts.headingIds !== false
  const renderImages = opts.renderImages !== false
  const allowRawHtml = opts.allowRawHtml === true
  const classNames = opts.classNames ?? {}

  function cls(el: HtmlElement): string {
    const c = classNames[el]
    return c ? ` class="${escapeHtml(c)}"` : ''
  }

  function renderBlock(node: Content | Root): string {
    switch (node.type) {
      case 'root':
        return (node as Root).children.map(renderBlock).join('')
      case 'heading':
        return renderHeading(node as Heading)
      case 'paragraph':
        return renderParagraph(node as Paragraph)
      case 'blockquote':
        return renderBlockquote(node as Blockquote)
      case 'code':
        return renderCode(node as Code)
      case 'list':
        return renderList(node as List)
      case 'table':
        return renderTable(node as Table)
      case 'thematicBreak':
        return renderThematicBreak(node as ThematicBreak)
      case 'html':
        return allowRawHtml ? (node as Html).value : ''
      default:
        return ''
    }
  }

  function renderHeading(node: Heading): string {
    const tag = `h${node.depth}` as HtmlElement
    const inner = node.children.map(renderInline).join('')
    const idAttr = headingIds ? ` id="${slugger.slug(plainText(node.children))}"` : ''
    return `<${tag}${idAttr}${cls(tag)}>${inner}</${tag}>`
  }

  function renderParagraph(node: Paragraph): string {
    return `<p${cls('p')}>${node.children.map(renderInline).join('')}</p>`
  }

  function renderBlockquote(node: Blockquote): string {
    return `<blockquote${cls('blockquote')}>${node.children.map(renderBlock).join('')}</blockquote>`
  }

  function renderCode(node: Code): string {
    // One class attribute: the language class followed by any classNames.code
    const classes = [node.lang ? `language-${node.lang}` : '', classNames.code ?? ''].filter(Boolean).join(' ')
    const classAttr = classes ? ` class="${escapeHtml(classes)}"` : ''
    return `<pre${cls('pre')}><code${classAttr}>${escapeHtml(node.value)}</code></pre>`
  }

  function renderList(node: List): string {
    const tag = node.ordered ? 'ol' : 'ul'
    const startAttr = node.ordered && node.start != null && node.start !== 1 ? ` start="${node.start}"` : ''
    const items = node.children.map((li) => renderListItem(li, node)).join('')
    return `<${tag}${startAttr}${cls(tag)}>${items}</${tag}>`
  }

  function renderListItem(node: ListItem, parent: List): string {
    const isTask = node.checked !== null && node.checked !== undefined
    let inner: string

    if (isTask) {
      const checked = node.checked ? ' checked' : ''
      const checkbox = `<input type="checkbox" disabled${checked}> `
      const content = node.children.map(renderBlock).join('')
      inner = checkbox + content
    } else {
      // Tight list: unwrap single paragraph
      if (
        !parent.spread &&
        node.children.length === 1 &&
        node.children[0]?.type === 'paragraph'
      ) {
        inner = (node.children[0] as Paragraph).children.map(renderInline).join('')
      } else {
        inner = node.children.map(renderBlock).join('')
      }
    }
    return `<li${cls('li')}>${inner}</li>`
  }

  function renderTable(node: Table): string {
    const align = node.align ?? []
    const [headerRow, ...bodyRows] = node.children

    const thead = headerRow
      ? `<thead${cls('thead')}>${renderTableRow(headerRow, align, true)}</thead>`
      : ''
    const tbody =
      bodyRows.length > 0
        ? `<tbody${cls('tbody')}>${bodyRows.map((r) => renderTableRow(r, align, false)).join('')}</tbody>`
        : ''

    return `<table${cls('table')}>${thead}${tbody}</table>`
  }

  function renderTableRow(
    node: TableRow,
    align: Array<'left' | 'right' | 'center' | null | undefined>,
    isHeader: boolean,
  ): string {
    const cells = node.children.map((cell, i) => {
      const a = align[i]
      const styleAttr = a ? ` style="text-align:${a}"` : ''
      const tag = isHeader ? 'th' : 'td'
      return `<${tag}${styleAttr}${cls(tag)}>${cell.children.map(renderInline).join('')}</${tag}>`
    })
    return `<tr${cls('tr')}>${cells.join('')}</tr>`
  }

  function renderThematicBreak(_node: ThematicBreak): string {
    return `<hr${cls('hr')}>`
  }

  function renderInline(node: PhrasingContent): string {
    switch (node.type) {
      case 'text':
        return escapeHtml((node as Text).value)
      case 'inlineCode':
        return `<code${cls('code')}>${escapeHtml((node as InlineCode).value)}</code>`
      case 'strong':
        return `<strong${cls('strong')}>${(node as Strong).children.map(renderInline).join('')}</strong>`
      case 'emphasis':
        return `<em${cls('em')}>${(node as Emphasis).children.map(renderInline).join('')}</em>`
      case 'delete':
        return `<del${cls('del')}>${(node as Delete).children.map(renderInline).join('')}</del>`
      case 'link': {
        const l = node as Link
        const titleAttr = l.title ? ` title="${escapeHtml(l.title)}"` : ''
        return `<a href="${escapeHtml(safeUrl(l.url))}"${titleAttr}${cls('a')}>${l.children.map(renderInline).join('')}</a>`
      }
      case 'image': {
        if (!renderImages) return ''
        const img = node as Image
        const altAttr = img.alt ? ` alt="${escapeHtml(img.alt)}"` : ''
        const titleAttr = img.title ? ` title="${escapeHtml(img.title)}"` : ''
        return `<img src="${escapeHtml(safeUrl(img.url))}"${altAttr}${titleAttr}${cls('img')}>`
      }
      case 'break':
        return '<br>'
      case 'html':
        return allowRawHtml ? (node as Html).value : ''
      case 'footnoteReference': {
        const n = footnoteNumbers.get((node as FootnoteReference).identifier)
        if (n === undefined) return ''
        // Repeat references get their own id so each back-link target is unique
        const seen = (footnoteRefCounts.get(n) ?? 0) + 1
        footnoteRefCounts.set(n, seen)
        const id = seen === 1 ? `fnref-${n}` : `fnref-${n}-${seen}`
        return `<sup><a href="#fn-${n}" id="${id}" data-footnote-ref>${n}</a></sup>`
      }
      default:
        return ''
    }
  }

  function renderFootnotes(): string {
    if (footnotes.length === 0) return ''
    const items = footnotes.map(({ number, definition }) => {
      const backref = `<a href="#fnref-${number}" data-footnote-backref aria-label="Back to reference ${number}">↩</a>`
      const blocks = definition.children.map(renderBlock)
      // Put the back-link inside the last paragraph, as GitHub does
      const last = blocks.length - 1
      if (definition.children[last]?.type === 'paragraph') {
        blocks[last] = blocks[last]!.replace(/<\/p>$/, ` ${backref}</p>`)
      } else {
        blocks.push(backref)
      }
      return `<li id="fn-${number}"${cls('li')}>${blocks.join('')}</li>`
    })
    return `<section class="footnotes" data-footnotes><ol${cls('ol')}>${items.join('')}</ol></section>`
  }

  function plainText(nodes: PhrasingContent[]): string {
    return nodes
      .map((n) => {
        if (n.type === 'text' || n.type === 'inlineCode') return n.value
        if ('children' in n && Array.isArray(n.children)) return plainText(n.children as PhrasingContent[])
        return ''
      })
      .join('')
  }

  return renderBlock(tree) + renderFootnotes()
}
