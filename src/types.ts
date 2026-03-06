import type { Root } from 'mdast'
import type { Plugin } from 'unified'

/** Core extension point — implement this to create a new output format */
export interface Serializer<TOutput, TOptions = Record<never, never>> {
  serialize(ast: Root, options: TOptions): TOutput
}

/** Shared base options for all serialize() calls */
export interface BaseOptions {
  /** Additional remark plugins applied before serialization */
  remarkPlugins?: Plugin[]
  /** Enable GitHub Flavored Markdown (default: true) */
  gfm?: boolean
}

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

export type HtmlElement =
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'p' | 'blockquote' | 'pre' | 'code' | 'hr'
  | 'ul' | 'ol' | 'li' | 'table' | 'thead' | 'tbody' | 'tr' | 'th' | 'td'
  | 'a' | 'img' | 'strong' | 'em' | 'del'

export interface HtmlOptions extends BaseOptions {
  /** Inject slug-based id attributes on headings (default: true) */
  headingIds?: boolean
  /** Map of element name → CSS class string */
  classNames?: Partial<Record<HtmlElement, string>>
  /** Render image tags (default: true) */
  renderImages?: boolean
  /**
   * Pass raw HTML nodes from the Markdown source through to output (default: false).
   * WARNING: enabling this opens XSS risk if output is injected into a browser DOM.
   * Only enable when the Markdown source is fully trusted.
   */
  allowRawHtml?: boolean
}

// ---------------------------------------------------------------------------
// ANSI
// ---------------------------------------------------------------------------

export interface AnsiStyle {
  open: string
  close: string
}

export interface AnsiTheme {
  h1: AnsiStyle
  h2: AnsiStyle
  h3: AnsiStyle
  bold: AnsiStyle
  italic: AnsiStyle
  strikethrough: AnsiStyle
  inlineCode: AnsiStyle
  codeBlock: AnsiStyle
  blockquote: AnsiStyle
  link: AnsiStyle
  listBullet: string
  hrChar: string
}

export interface AnsiOptions extends BaseOptions {
  theme?: Partial<AnsiTheme>
  /** Terminal column width for word-wrap / HR (default: process.stdout.columns ?? 80) */
  columns?: number
  /** Emit OSC 8 hyperlink sequences (default: false) */
  hyperlinks?: boolean
}

// ---------------------------------------------------------------------------
// Doc Tree
// ---------------------------------------------------------------------------

export interface DocTreeOptions extends BaseOptions {}

export interface DocDocument {
  type: 'document'
  children: DocBlockNode[]
}

export interface DocHeading {
  type: 'heading'
  depth: 1 | 2 | 3 | 4 | 5 | 6
  children: DocInlineNode[]
}

export interface DocParagraph {
  type: 'paragraph'
  children: DocInlineNode[]
}

export interface DocBlockquote {
  type: 'blockquote'
  children: DocBlockNode[]
}

export interface DocCodeBlock {
  type: 'code'
  lang: string | null
  value: string
}

export interface DocList {
  type: 'list'
  ordered: boolean
  children: DocListItem[]
}

export interface DocListItem {
  type: 'listItem'
  checked: boolean | null
  children: (DocBlockNode | DocInlineNode)[]
}

export interface DocTable {
  type: 'table'
  align: Array<'left' | 'right' | 'center' | null>
  children: DocTableRow[]
}

export interface DocTableRow {
  type: 'tableRow'
  isHeader: boolean
  children: DocTableCell[]
}

export interface DocTableCell {
  type: 'tableCell'
  children: DocInlineNode[]
}

export interface DocHorizontalRule {
  type: 'thematicBreak'
}

export interface DocText {
  type: 'text'
  value: string
  bold: boolean
  italic: boolean
  strikethrough: boolean
}

export interface DocInlineCode {
  type: 'inlineCode'
  value: string
}

export interface DocLink {
  type: 'link'
  url: string
  title: string | null
  children: DocInlineNode[]
}

export interface DocImage {
  type: 'image'
  url: string
  alt: string | null
  title: string | null
}

export interface DocBreak {
  type: 'break'
}

export type DocInlineNode =
  | DocText
  | DocInlineCode
  | DocLink
  | DocImage
  | DocBreak

export type DocBlockNode =
  | DocHeading
  | DocParagraph
  | DocBlockquote
  | DocCodeBlock
  | DocList
  | DocTable
  | DocHorizontalRule

export type DocTreeNode =
  | DocDocument
  | DocBlockNode
  | DocListItem
  | DocTableRow
  | DocTableCell
  | DocInlineNode
