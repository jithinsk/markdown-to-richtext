import type {
  Root, Parent, Content,
  Definition, FootnoteDefinition, FootnoteReference,
  LinkReference, ImageReference, Link, Image, Text,
} from 'mdast'

export interface Footnote {
  /** 1-based number, in order of first reference */
  number: number
  definition: FootnoteDefinition
}

export interface PreparedTree {
  /** Copy of the input tree with references resolved and definitions removed */
  tree: Root
  /** Number for each referenced footnote, keyed by identifier */
  footnoteNumbers: Map<string, number>
  /** Referenced footnote definitions, in order of first reference */
  footnotes: Footnote[]
  /** Footnote definitions that are never referenced, in source order */
  unreferencedFootnotes: FootnoteDefinition[]
}

/**
 * Prepares a parsed tree for the built-in serializers:
 *
 * - `linkReference` / `imageReference` nodes become `link` / `image` nodes
 *   using the matching `definition` (`[text][ref]` … `[ref]: url`).
 * - `definition` and `footnoteDefinition` nodes are taken out of the flow;
 *   footnotes are numbered in the order they are first referenced.
 *
 * Works on a copy, so a tree passed in by the caller is never modified.
 */
export function prepareTree(ast: Root): PreparedTree {
  const tree = structuredClone(ast)
  const definitions = new Map<string, Definition>()
  const footnoteDefinitions = new Map<string, FootnoteDefinition>()

  collectDefinitions(tree, definitions, footnoteDefinitions)

  const footnoteNumbers = new Map<string, number>()
  // Number references in the body first, then those inside footnotes, as GitHub does
  const pending: FootnoteDefinition[] = []
  resolve(tree, definitions, footnoteDefinitions, footnoteNumbers, pending)
  for (let i = 0; i < pending.length; i++) {
    resolve(pending[i]!, definitions, footnoteDefinitions, footnoteNumbers, pending)
  }

  const footnotes: Footnote[] = []
  for (const [identifier, number] of footnoteNumbers) {
    const definition = footnoteDefinitions.get(identifier)
    if (definition) footnotes.push({ number, definition })
  }
  const unreferencedFootnotes = [...footnoteDefinitions.values()].filter(
    (d) => !footnoteNumbers.has(d.identifier),
  )
  // Resolve references inside unreferenced definitions too (the Doc Tree keeps them)
  for (const definition of unreferencedFootnotes) {
    resolve(definition, definitions, footnoteDefinitions, new Map(), [])
  }

  return { tree, footnoteNumbers, footnotes, unreferencedFootnotes }
}

function collectDefinitions(
  node: Parent,
  definitions: Map<string, Definition>,
  footnoteDefinitions: Map<string, FootnoteDefinition>,
): void {
  node.children = node.children.filter((child) => {
    if (child.type === 'definition') {
      // First definition wins, as in CommonMark
      if (!definitions.has(child.identifier)) definitions.set(child.identifier, child)
      return false
    }
    if (child.type === 'footnoteDefinition') {
      if (!footnoteDefinitions.has(child.identifier)) footnoteDefinitions.set(child.identifier, child)
      collectDefinitions(child, definitions, footnoteDefinitions)
      return false
    }
    if ('children' in child) collectDefinitions(child as Parent, definitions, footnoteDefinitions)
    return true
  }) as Content[]
}

function resolve(
  node: Parent,
  definitions: Map<string, Definition>,
  footnoteDefinitions: Map<string, FootnoteDefinition>,
  footnoteNumbers: Map<string, number>,
  pending: FootnoteDefinition[],
): void {
  const resolved: Content[] = []
  for (const child of node.children as Content[]) {
    if (child.type === 'linkReference') {
      const ref = child as LinkReference
      resolve(ref, definitions, footnoteDefinitions, footnoteNumbers, pending)
      const def = definitions.get(ref.identifier)
      if (def) {
        resolved.push({ type: 'link', url: def.url, title: def.title ?? null, children: ref.children } satisfies Link)
      } else {
        // No definition (e.g. a plugin-built reference): keep the visible text
        resolved.push(...(ref.children as Content[]))
      }
      continue
    }
    if (child.type === 'imageReference') {
      const ref = child as ImageReference
      const def = definitions.get(ref.identifier)
      if (def) {
        resolved.push({ type: 'image', url: def.url, title: def.title ?? null, alt: ref.alt ?? null } satisfies Image)
      } else if (ref.alt) {
        resolved.push({ type: 'text', value: ref.alt } satisfies Text)
      }
      continue
    }
    if (child.type === 'footnoteReference') {
      const ref = child as FootnoteReference
      const definition = footnoteDefinitions.get(ref.identifier)
      if (definition && !footnoteNumbers.has(ref.identifier)) {
        footnoteNumbers.set(ref.identifier, footnoteNumbers.size + 1)
        // Resolved after the current pass, so nested references number after the body's
        pending.push(definition)
      }
      resolved.push(child)
      continue
    }
    if ('children' in child) resolve(child as Parent, definitions, footnoteDefinitions, footnoteNumbers, pending)
    resolved.push(child)
  }
  node.children = resolved as typeof node.children
}

