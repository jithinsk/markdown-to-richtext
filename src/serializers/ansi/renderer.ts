import type {
  Root, Content, PhrasingContent,
  Heading, Paragraph, Blockquote, Code, List, ListItem,
  Table, TableRow, ThematicBreak,
  Text, InlineCode, Strong, Emphasis, Delete, Link, Image, Break,
} from 'mdast'
import type { AnsiOptions, AnsiStyle, AnsiTheme } from '../../types.js'
import { defaultTheme } from './theme.js'

// ---------------------------------------------------------------------------
// ANSI escape sequence width — strip sequences for width calc
// ---------------------------------------------------------------------------

const ANSI_RE = /\x1b\[[^m]*m|\x1b\][^\x07]*\x07/g

function visibleWidth(s: string): number {
  return s.replace(ANSI_RE, '').length
}

// ---------------------------------------------------------------------------
// Word-wrap that respects invisible ANSI sequences
// ---------------------------------------------------------------------------

function wordWrap(text: string, columns: number, indent = ''): string {
  const indentWidth = visibleWidth(indent)
  const maxWidth = columns - indentWidth
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? current + ' ' + word : word
    if (visibleWidth(candidate) > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines.map((l) => indent + l).join('\n')
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

export function renderToAnsi(ast: Root, opts: AnsiOptions): string {
  const columns = opts.columns ?? (process.stdout.columns ?? 80)
  const hyperlinks = opts.hyperlinks ?? false
  const theme: AnsiTheme = { ...defaultTheme, ...(opts.theme ?? {}) }

  function applyStyle(s: AnsiStyle, text: string): string {
    return `${s.open}${text}${s.close}`
  }

  function renderBlocks(nodes: Content[]): string {
    return nodes.map((n) => renderBlock(n)).filter(Boolean).join('\n\n')
  }

  function renderBlock(node: Content | Root): string {
    switch (node.type) {
      case 'root':
        return renderBlocks((node as Root).children)
      case 'heading':
        return renderHeading(node as Heading)
      case 'paragraph':
        return renderParagraph(node as Paragraph)
      case 'blockquote':
        return renderBlockquote(node as Blockquote)
      case 'code':
        return renderCode(node as Code)
      case 'list':
        return renderList(node as List, 0)
      case 'table':
        return renderTable(node as Table)
      case 'thematicBreak':
        return renderHr(node as ThematicBreak)
      default:
        return ''
    }
  }

  function renderHeading(node: Heading): string {
    const text = renderInlines(node.children)
    const styleKey = (`h${node.depth}`) as keyof Pick<AnsiTheme, 'h1' | 'h2' | 'h3'>
    const s = (theme[styleKey] ?? theme.h3) as AnsiStyle
    return applyStyle(s, text)
  }

  function renderParagraph(node: Paragraph): string {
    const text = renderInlines(node.children)
    return wordWrap(text, columns)
  }

  function renderBlockquote(node: Blockquote): string {
    const inner = renderBlocks(node.children)
    const prefix = applyStyle(theme.blockquote, '│ ')
    return inner
      .split('\n')
      .map((line) => prefix + line)
      .join('\n')
  }

  function renderCode(node: Code): string {
    const lang = node.lang ? ` (${node.lang})` : ''
    const header = applyStyle(theme.codeBlock, `┌─ code${lang}`)
    const lines = node.value.split('\n').map((l) => applyStyle(theme.codeBlock, `│ ${l}`))
    const footer = applyStyle(theme.codeBlock, '└─')
    return [header, ...lines, footer].join('\n')
  }

  function renderList(node: List, depth: number): string {
    return node.children.map((li, i) => renderListItem(li, node, i + 1, depth)).join('\n')
  }

  function renderListItem(node: ListItem, parent: List, index: number, depth: number): string {
    const indent = '  '.repeat(depth)
    const bullet = parent.ordered
      ? `${index}.`
      : applyStyle({ open: '', close: '' }, theme.listBullet)
    const prefix = `${indent}${bullet} `

    const nestedLists: List[] = []
    const textParts: string[] = []

    for (const child of node.children) {
      if (child.type === 'list') {
        nestedLists.push(child as List)
      } else if (child.type === 'paragraph') {
        textParts.push(renderInlines((child as Paragraph).children))
      }
    }

    const taskPrefix =
      node.checked !== null && node.checked !== undefined
        ? node.checked
          ? '[x] '
          : '[ ] '
        : ''

    const mainText = wordWrap(
      taskPrefix + textParts.join(' '),
      columns,
      ' '.repeat(visibleWidth(prefix)),
    ).replace(/^\s+/, '')

    const nested = nestedLists.map((l) => renderList(l, depth + 1)).join('\n')
    return prefix + mainText + (nested ? '\n' + nested : '')
  }

  function renderTable(node: Table): string {
    const [headerRow, ...bodyRows] = node.children
    if (!headerRow) return ''

    const allRows: TableRow[] = [headerRow, ...bodyRows]
    // Compute column widths
    const widths: number[] = []
    for (const row of allRows) {
      for (let i = 0; i < row.children.length; i++) {
        const cell = row.children[i]
        const w = cell ? visibleWidth(renderInlines(cell.children as PhrasingContent[])) : 0
        widths[i] = Math.max(widths[i] ?? 0, w)
      }
    }

    function renderRow(row: TableRow, isHeader: boolean): string {
      const cells = row.children.map((cell, i) => {
        const text = renderInlines(cell.children as PhrasingContent[])
        const pad = (widths[i] ?? 0) - visibleWidth(text)
        const padded = text + ' '.repeat(Math.max(0, pad))
        return isHeader ? applyStyle(theme.bold, padded) : padded
      })
      return '│ ' + cells.join(' │ ') + ' │'
    }

    function separator(char: string): string {
      return '├' + widths.map((w) => char.repeat((w ?? 0) + 2)).join('┼') + '┤'
    }

    const top = '┌' + widths.map((w) => '─'.repeat((w ?? 0) + 2)).join('┬') + '┐'
    const bottom = '└' + widths.map((w) => '─'.repeat((w ?? 0) + 2)).join('┴') + '┘'
    const lines = [top, renderRow(headerRow, true), separator('─')]
    for (const row of bodyRows) {
      lines.push(renderRow(row, false))
    }
    lines.push(bottom)
    return lines.join('\n')
  }

  function renderHr(_node: ThematicBreak): string {
    return theme.hrChar.repeat(columns)
  }

  function renderInlines(nodes: PhrasingContent[]): string {
    return nodes.map(renderInline).join('')
  }

  function renderInline(node: PhrasingContent): string {
    switch (node.type) {
      case 'text':
        return (node as Text).value
      case 'inlineCode':
        return applyStyle(theme.inlineCode, (node as InlineCode).value)
      case 'strong':
        return applyStyle(theme.bold, renderInlines((node as Strong).children))
      case 'emphasis':
        return applyStyle(theme.italic, renderInlines((node as Emphasis).children))
      case 'delete':
        return applyStyle(theme.strikethrough, renderInlines((node as Delete).children))
      case 'link': {
        const l = node as Link
        const label = renderInlines(l.children)
        if (hyperlinks) {
          // OSC 8 hyperlink — strip control chars to prevent sequence injection
          const safeUrl = l.url.replace(/[\x00-\x1f\x7f]/g, '')
          return `\x1b]8;;${safeUrl}\x07${applyStyle(theme.link, label)}\x1b]8;;\x07`
        }
        return `${applyStyle(theme.link, label)} (${l.url})`
      }
      case 'image': {
        const img = node as Image
        return `[image: ${img.alt ?? img.url}]`
      }
      case 'break':
        return '\n'
      default:
        return ''
    }
  }

  return renderBlocks(ast.children)
}
