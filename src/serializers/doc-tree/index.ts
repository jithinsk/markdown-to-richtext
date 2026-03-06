import type {
  Root, Content, PhrasingContent,
  Heading, Paragraph, Blockquote, Code, List, ListItem,
  Table, TableRow, TableCell, ThematicBreak,
  Text, InlineCode, Strong, Emphasis, Delete, Link, Image, Break,
} from 'mdast'
import { serialize } from '../../serialize.js'
import type {
  Serializer, DocTreeOptions,
  DocDocument, DocBlockNode, DocInlineNode,
  DocHeading, DocParagraph, DocBlockquote, DocCodeBlock, DocList, DocListItem,
  DocTable, DocTableRow, DocTableCell, DocHorizontalRule,
  DocText, DocInlineCode, DocLink, DocImage, DocBreak,
} from '../../types.js'

// ---------------------------------------------------------------------------
// Inline rendering with bold/italic/strikethrough flag propagation
// ---------------------------------------------------------------------------

interface InlineFlags {
  bold: boolean
  italic: boolean
  strikethrough: boolean
}

function renderInline(node: PhrasingContent, flags: InlineFlags): DocInlineNode[] {
  switch (node.type) {
    case 'text': {
      const t = node as Text
      return [{ type: 'text', value: t.value, ...flags }]
    }
    case 'inlineCode': {
      const ic = node as InlineCode
      return [{ type: 'inlineCode', value: ic.value } satisfies DocInlineCode]
    }
    case 'strong': {
      const s = node as Strong
      return s.children.flatMap((c) =>
        renderInline(c, { ...flags, bold: true }),
      )
    }
    case 'emphasis': {
      const e = node as Emphasis
      return e.children.flatMap((c) =>
        renderInline(c, { ...flags, italic: true }),
      )
    }
    case 'delete': {
      const d = node as Delete
      return d.children.flatMap((c) =>
        renderInline(c, { ...flags, strikethrough: true }),
      )
    }
    case 'link': {
      const l = node as Link
      const children = l.children.flatMap((c) => renderInline(c, flags))
      return [
        {
          type: 'link',
          url: l.url,
          title: l.title ?? null,
          children,
        } satisfies DocLink,
      ]
    }
    case 'image': {
      const img = node as Image
      return [
        {
          type: 'image',
          url: img.url,
          alt: img.alt ?? null,
          title: img.title ?? null,
        } satisfies DocImage,
      ]
    }
    case 'break':
      return [{ type: 'break' } satisfies DocBreak]
    default:
      return []
  }
}

function renderInlines(nodes: PhrasingContent[]): DocInlineNode[] {
  const base: InlineFlags = { bold: false, italic: false, strikethrough: false }
  return nodes.flatMap((n) => renderInline(n, base))
}

// ---------------------------------------------------------------------------
// Block rendering
// ---------------------------------------------------------------------------

function renderBlock(node: Content): DocBlockNode | null {
  switch (node.type) {
    case 'heading': {
      const h = node as Heading
      return {
        type: 'heading',
        depth: h.depth as 1 | 2 | 3 | 4 | 5 | 6,
        children: renderInlines(h.children),
      } satisfies DocHeading
    }
    case 'paragraph': {
      const p = node as Paragraph
      return {
        type: 'paragraph',
        children: renderInlines(p.children),
      } satisfies DocParagraph
    }
    case 'blockquote': {
      const bq = node as Blockquote
      return {
        type: 'blockquote',
        children: bq.children.map(renderBlock).filter(Boolean) as DocBlockNode[],
      } satisfies DocBlockquote
    }
    case 'code': {
      const c = node as Code
      return {
        type: 'code',
        lang: c.lang ?? null,
        value: c.value,
      } satisfies DocCodeBlock
    }
    case 'list': {
      const l = node as List
      return {
        type: 'list',
        ordered: l.ordered ?? false,
        children: l.children.map(renderListItem),
      } satisfies DocList
    }
    case 'table': {
      const t = node as Table
      const align = (t.align ?? []) as Array<'left' | 'right' | 'center' | null>
      const [headerRow, ...bodyRows] = t.children
      const rows: DocTableRow[] = []
      if (headerRow) {
        rows.push(renderTableRow(headerRow, true))
      }
      for (const row of bodyRows) {
        rows.push(renderTableRow(row, false))
      }
      return {
        type: 'table',
        align,
        children: rows,
      } satisfies DocTable
    }
    case 'thematicBreak':
      return { type: 'thematicBreak' } satisfies DocHorizontalRule
    default:
      return null
  }
}

function renderListItem(node: ListItem): DocListItem {
  const children: (DocBlockNode | DocInlineNode)[] = []
  for (const child of node.children) {
    const block = renderBlock(child)
    if (block) children.push(block)
  }
  return {
    type: 'listItem',
    checked: node.checked ?? null,
    children,
  }
}

function renderTableRow(node: TableRow, isHeader: boolean): DocTableRow {
  const cells: DocTableCell[] = node.children.map((cell: TableCell) => ({
    type: 'tableCell' as const,
    children: renderInlines(cell.children as PhrasingContent[]),
  }))
  return { type: 'tableRow', isHeader, children: cells }
}

// ---------------------------------------------------------------------------
// Serializer
// ---------------------------------------------------------------------------

function buildDocDocument(ast: Root): DocDocument {
  const children = ast.children
    .map(renderBlock)
    .filter(Boolean) as DocBlockNode[]
  return { type: 'document', children }
}

export const DocTreeSerializer: Serializer<DocDocument, DocTreeOptions> = {
  serialize(ast: Root, _options: DocTreeOptions): DocDocument {
    return buildDocDocument(ast)
  },
}

export function toDocTree(md: string, options?: DocTreeOptions): DocDocument {
  return serialize(md, DocTreeSerializer, options)
}

export type { DocTreeOptions }
