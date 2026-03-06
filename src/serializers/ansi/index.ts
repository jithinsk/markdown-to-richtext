import type { Root } from 'mdast'
import { serialize } from '../../serialize.js'
import type { AnsiOptions, Serializer } from '../../types.js'
import { renderToAnsi } from './renderer.js'

export const AnsiSerializer: Serializer<string, AnsiOptions> = {
  serialize(ast: Root, options: AnsiOptions): string {
    return renderToAnsi(ast, options)
  },
}

export function toAnsi(md: string, options?: AnsiOptions): string {
  return serialize(md, AnsiSerializer, options)
}

export type { AnsiOptions }
