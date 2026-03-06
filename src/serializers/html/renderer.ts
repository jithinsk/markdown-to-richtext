import type {
  Root, Content, PhrasingContent,
  Heading, Paragraph, Blockquote, Code, List, ListItem,
  Table, TableRow, TableCell, ThematicBreak,
  Text, InlineCode, Strong, Emphasis, Delete, Link, Image, Break,
  Html,
} from 'mdast'
import type { HtmlOptions, HtmlElement } from '../../types.js'

// ---------------------------------------------------------------------------
// Slugger — collision-safe heading ids
// ---------------------------------------------------------------------------

class Slugger {
  private seen = new Map<string, number>()

  slug(value: string): string {
    const base = value
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
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

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

/**
 * Returns the URL unchanged when it uses a safe protocol or is a relative
 * reference (path / anchor). Replaces anything else (javascript:, data:, …)
 * with '#' to prevent protocol-based XSS.
 */
function safeUrl(url: string): string {
  // Allow relative references: anchors, absolute paths, relative paths
  if (url.startsWith('#') || url.startsWith('/') || url.startsWith('.')) return url
  try {
    const parsed = new URL(url)
    return SAFE_PROTOCOLS.has(parsed.protocol) ? url : '#'
  } catch {
    // URL() throws on relative URLs in some environments — treat as safe relative ref
    return url
  }
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

export function renderToHtml(ast: Root, opts: HtmlOptions): string {
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
    const lang = node.lang ? ` class="language-${escapeHtml(node.lang)}"` : ''
    return `<pre${cls('pre')}><code${lang}${cls('code')}>${escapeHtml(node.value)}</code></pre>`
  }

  function renderList(node: List): string {
    const tag = node.ordered ? 'ol' : 'ul'
    const items = node.children.map((li) => renderListItem(li, node)).join('')
    return `<${tag}${cls(tag)}>${items}</${tag}>`
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
      default:
        return ''
    }
  }

  function plainText(nodes: PhrasingContent[]): string {
    return nodes
      .map((n) => {
        if (n.type === 'text') return (n as Text).value
        if ('children' in n && Array.isArray(n.children)) return plainText(n.children as PhrasingContent[])
        return ''
      })
      .join('')
  }

  return renderBlock(ast)
}
