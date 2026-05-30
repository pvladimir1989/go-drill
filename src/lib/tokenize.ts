import type { Lang, Token } from '../types'
import { KEYWORDS } from '../constants'

const MULTI_OPS = [':=', '==', '!=', '<=', '>=', '+=', '-=', '*=', '&&', '||', '<<', '>>', '<-', '++', '--', '//', '**', '->', '..=', '..', '::', '=>']

export function tokenize(code: string, lang: Lang): Token[] {
  const tokens: Token[] = []
  const kw = KEYWORDS[lang] || KEYWORDS.ts
  let i = 0
  while (i < code.length) {
    const ch = code[i]
    if (ch === '\n') { tokens.push({ type: 'newline', value: '\n' }); i++; continue }
    if (ch === ' ' || ch === '\t') {
      let w = ''
      while (i < code.length && (code[i] === ' ' || code[i] === '\t')) { w += code[i]; i++ }
      tokens.push({ type: 'ws', value: w }); continue
    }
    if ((lang === 'python' && ch === '#') || (lang !== 'python' && ch === '/' && code[i + 1] === '/')) {
      let c = ''
      while (i < code.length && code[i] !== '\n') { c += code[i]; i++ }
      tokens.push({ type: 'comment', value: c }); continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      const q = ch; let str = q; i++
      while (i < code.length && code[i] !== q) {
        if (code[i] === '\\') { str += code[i]; i++ }
        str += code[i]; i++
      }
      if (i < code.length) { str += code[i]; i++ }
      tokens.push({ type: 'string', value: str }); continue
    }
    if (/[0-9]/.test(ch)) {
      let n = ''
      while (i < code.length && /[0-9.x]/.test(code[i])) { n += code[i]; i++ }
      tokens.push({ type: 'number', value: n }); continue
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let w = ''
      while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) { w += code[i]; i++ }
      tokens.push({ type: kw.includes(w) ? 'keyword' : 'ident', value: w }); continue
    }
    let found = false
    for (const op of MULTI_OPS) {
      if (code.substring(i, i + op.length) === op) { tokens.push({ type: 'op', value: op }); i += op.length; found = true; break }
    }
    if (found) continue
    tokens.push({ type: 'op', value: ch }); i++
  }
  return tokens
}
