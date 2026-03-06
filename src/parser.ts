import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import type { Root } from 'mdast'
import type { BaseOptions } from './types.js'

export function parseMarkdown(md: string, opts: BaseOptions = {}): Root {
  const processor = unified().use(remarkParse)

  if (opts.gfm !== false) {
    processor.use(remarkGfm)
  }

  if (opts.remarkPlugins) {
    for (const plugin of opts.remarkPlugins) {
      processor.use(plugin)
    }
  }

  // parse() only tokenises; runSync() applies transformer plugins (e.g. user-supplied ones)
  return processor.runSync(processor.parse(md)) as Root
}
