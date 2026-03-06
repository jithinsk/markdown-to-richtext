import type { Root } from 'mdast'
import { serialize } from '../../serialize.js'
import type { HtmlOptions, Serializer } from '../../types.js'
import { renderToHtml } from './renderer.js'

export const HtmlSerializer: Serializer<string, HtmlOptions> = {
  serialize(ast: Root, options: HtmlOptions): string {
    return renderToHtml(ast, options)
  },
}

export function toHtml(md: string, options?: HtmlOptions): string {
  return serialize(md, HtmlSerializer, options)
}

export type { HtmlOptions }
