import type { AnsiTheme } from '../../types.js'

// Raw ANSI escape helpers — no external dependency
const ESC = '\x1b['

function style(open: number | number[], close: number): { open: string; close: string } {
  const openCodes = Array.isArray(open) ? open : [open]
  return {
    open: `${ESC}${openCodes.join(';')}m`,
    close: `${ESC}${close}m`,
  }
}

export const defaultTheme: AnsiTheme = {
  h1: style([1, 4, 35], 0),        // bold + underline + magenta
  h2: style([1, 4, 36], 0),        // bold + underline + cyan
  h3: style([1, 36], 0),           // bold + cyan
  bold: style(1, 22),
  italic: style(3, 23),
  strikethrough: style(9, 29),
  inlineCode: style([7, 33], 0),   // reverse + yellow
  codeBlock: style(90, 39),        // dark grey
  blockquote: style(90, 39),       // dark grey
  link: style([4, 34], 0),         // underline + blue
  listBullet: '•',
  hrChar: '─',
}
