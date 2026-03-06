import { parseMarkdown } from './parser.js'
import type { BaseOptions, Serializer } from './types.js'

export function serialize<TOutput, TOptions extends BaseOptions = BaseOptions>(
  md: string,
  serializer: Serializer<TOutput, TOptions>,
  options?: TOptions,
): TOutput {
  const opts = options ?? ({} as TOptions)
  const ast = parseMarkdown(md, opts)
  return serializer.serialize(ast, opts)
}
