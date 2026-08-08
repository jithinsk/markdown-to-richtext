# md-to-rich

Convert Markdown to rich text output formats. TypeScript-first, tree-shakeable, ESM + CJS dual output.

**Built-in serializers:** HTML string · ANSI terminal string · Doc Tree (structured JSON)

**Extensible:** implement `Serializer<T>` to add any output format without touching this package.

---

## Install

```sh
npm install md-to-rich
```

Requires Node.js ≥ 20.

---

## Quick Start

```typescript
import { toHtml, toAnsi, toDocTree } from 'md-to-rich'

toHtml('# Hello\n\n**bold**')
// → '<h1 id="hello">Hello</h1><p><strong>bold</strong></p>'

toAnsi('# Hello\n\n**bold**', { columns: 80 })
// → ANSI-escaped terminal string

toDocTree('# Hello')
// → { type: 'document', children: [{ type: 'heading', depth: 1, ... }] }
```

---

## API

### `toHtml(md, options?): string`

Converts Markdown to an HTML string.

```typescript
import { toHtml } from 'md-to-rich'
// or sub-path:
import { toHtml } from 'md-to-rich/html'
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `headingIds` | `boolean` | `true` | Add slug-based `id` attributes to headings (collision-safe) |
| `classNames` | `Partial<Record<HtmlElement, string>>` | `{}` | Custom CSS class per element |
| `renderImages` | `boolean` | `true` | Render `<img>` tags |
| `gfm` | `boolean` | `true` | Enable GitHub Flavored Markdown |
| `remarkPlugins` | `Plugin[]` | `[]` | Extra remark plugins |

### `toAnsi(md, options?): string`

Converts Markdown to an ANSI-escaped terminal string.

```typescript
import { toAnsi } from 'md-to-rich'
// or:
import { toAnsi } from 'md-to-rich/ansi'
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `columns` | `number` | `process.stdout.columns ?? 80` | Terminal width for word-wrap and HR |
| `hyperlinks` | `boolean` | `false` | Emit OSC 8 hyperlink sequences |
| `theme` | `Partial<AnsiTheme>` | built-in | Override ANSI styles |
| `gfm` | `boolean` | `true` | Enable GFM |
| `remarkPlugins` | `Plugin[]` | `[]` | Extra remark plugins |

**Default theme** uses bold/underline for headings, italic, strikethrough, reverse-video for inline code, and box-drawing characters for tables and code blocks. No external chalk dependency — inline ANSI constants only.

### `toDocTree(md, options?): DocDocument`

Converts Markdown to a structured `DocDocument` tree (plain JSON, no ANSI, no HTML).

```typescript
import { toDocTree } from 'md-to-rich'
// or:
import { toDocTree } from 'md-to-rich/doc-tree'
```

The tree is suitable for feeding into rich-text editors (ProseMirror, Slate, Quill, etc.) — see the adapter guide below.

---

### `serialize(md, serializer, options?): T`

Generic dispatch function — works with any `Serializer<T>` implementation.

```typescript
import { serialize } from 'md-to-rich'
import type { Serializer } from 'md-to-rich'

const PlainText: Serializer<string> = {
  serialize(ast) {
    // ast is an MDAST Root node
    return myCustomWalker(ast)
  },
}

serialize('# Hello\n\nWorld', PlainText) // → 'Hello\nWorld'
```

---

## Building a Custom Serializer

Implement the `Serializer<TOutput, TOptions>` interface:

```typescript
import type { Root } from 'mdast'
import { serialize } from 'md-to-rich'
import type { BaseOptions, Serializer } from 'md-to-rich'

interface MyOptions extends BaseOptions {
  uppercase?: boolean
}

export const MySerializer: Serializer<string, MyOptions> = {
  serialize(ast: Root, options: MyOptions): string {
    // Walk the MDAST using your own logic, remark-stringify, unist-util-visit, etc.
    const result = walkAst(ast)
    return options.uppercase ? result.toUpperCase() : result
  },
}

export function toMy(md: string, options?: MyOptions): string {
  return serialize(md, MySerializer, options)
}
```

The `Serializer` interface is the only contract. No inheritance, no registration — just pass your serializer to `serialize()`.

---

## Doc Tree Node Types

```
DocDocument          { type: 'document', children: DocBlockNode[] }
DocHeading           { type: 'heading', depth: 1-6, children: DocInlineNode[] }
DocParagraph         { type: 'paragraph', children: DocInlineNode[] }
DocBlockquote        { type: 'blockquote', children: DocBlockNode[] }
DocCodeBlock         { type: 'code', lang: string|null, value: string }
DocList              { type: 'list', ordered: boolean, children: DocListItem[] }
DocListItem          { type: 'listItem', checked: boolean|null, children: [...] }
DocTable             { type: 'table', align: [...], children: DocTableRow[] }
DocTableRow          { type: 'tableRow', isHeader: boolean, children: DocTableCell[] }
DocTableCell         { type: 'tableCell', children: DocInlineNode[] }
DocHorizontalRule    { type: 'thematicBreak' }

DocText              { type: 'text', value: string, bold: boolean, italic: boolean, strikethrough: boolean }
DocInlineCode        { type: 'inlineCode', value: string }
DocLink              { type: 'link', url: string, title: string|null, children: DocInlineNode[] }
DocImage             { type: 'image', url: string, alt: string|null, title: string|null }
DocBreak             { type: 'break' }
```

Nested `strong`/`emphasis`/`delete` marks are flattened into `DocText` boolean flags, making it straightforward to map into ProseMirror marks or Slate leaf properties.

---

## ProseMirror / Slate Adapter Guide

`toDocTree` outputs a plain JSON tree. Mapping to ProseMirror:

```typescript
import { toDocTree } from 'md-to-rich'
import type { DocBlockNode, DocInlineNode } from 'md-to-rich'
import { schema } from 'prosemirror-schema-basic'

function blockToNode(node: DocBlockNode) {
  if (node.type === 'paragraph') {
    return schema.nodes.paragraph!.create(null, node.children.map(inlineToNode))
  }
  if (node.type === 'heading') {
    return schema.nodes.heading!.create({ level: node.depth }, node.children.map(inlineToNode))
  }
  // ... other block types
}

function inlineToNode(node: DocInlineNode) {
  if (node.type === 'text') {
    const marks = []
    if (node.bold) marks.push(schema.marks.strong!.create())
    if (node.italic) marks.push(schema.marks.em!.create())
    return schema.text(node.value, marks)
  }
  // ... other inline types
}

const doc = toDocTree(markdownString)
const pmDoc = schema.nodes.doc!.create(null, doc.children.map(blockToNode))
```

---

## License

MIT
