import type { Lang, Difficulty } from './types'

export const LANGS: Lang[] = ['python', 'go', 'rust', 'ts']

export const LM: Record<Lang, { l: string; c: string }> = {
  python: { l: '🐍 Py', c: '#3b82f6' },
  go: { l: '🐹 Go', c: '#06b6d4' },
  rust: { l: '🦀 Rs', c: '#f97316' },
  ts: { l: '🔷 TS', c: '#3178c6' },
}

export const DC: Record<Difficulty, { bg: string; t: string; b: string }> = {
  easy: { bg: '#0d2818', t: '#4ade80', b: '#166534' },
  medium: { bg: '#2a210a', t: '#facc15', b: '#854d0e' },
  hard: { bg: '#2a0a0a', t: '#f87171', b: '#7f1d1d' },
}

// syntax-highlight colors by token type
export const SY: Record<string, string> = {
  keyword: '#c084fc',
  string: '#86efac',
  number: '#fbbf24',
  comment: '#4b5563',
  ident: '#e8e6e3',
  op: '#94a3b8',
}

export const KEYWORDS: Record<Lang, string[]> = {
  python: ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'not', 'and', 'or', 'True', 'False', 'None', 'import', 'from', 'break', 'continue', 'pass', 'lambda'],
  go: ['func', 'return', 'if', 'else', 'for', 'range', 'var', 'type', 'struct', 'switch', 'case', 'default', 'break', 'continue', 'go', 'defer', 'select', 'chan', 'map', 'make', 'append', 'len', 'nil', 'true', 'false', 'const'],
  rust: ['fn', 'let', 'mut', 'return', 'if', 'else', 'for', 'while', 'loop', 'in', 'match', 'struct', 'enum', 'impl', 'pub', 'use', 'self', 'Self', 'Some', 'None', 'Ok', 'Err', 'vec', 'true', 'false', 'const', 'unsafe', 'move', 'ref', 'as', 'where'],
  ts: ['function', 'return', 'if', 'else', 'for', 'while', 'const', 'let', 'var', 'new', 'class', 'interface', 'type', 'import', 'export', 'true', 'false', 'null', 'undefined', 'void', 'number', 'string', 'boolean', 'of', 'in', 'break', 'continue', 'switch', 'case'],
}
