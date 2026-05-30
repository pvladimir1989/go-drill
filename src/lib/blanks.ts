import type { Token, Theme, Gran } from '../types'

const BL_PUNCT = ['(', ')', '{', '}', '[', ']', ':', ',', '.', ';', '&']

function eligible(t: Token): boolean {
  return ['keyword', 'ident', 'number', 'op', 'string'].includes(t.type) && t.value.length >= 1 && !BL_PUNCT.includes(t.value)
}

const TH_CH = new Set(['chan', '<-', 'close', 'make'])
const TH_SYNC = new Set(['sync', 'WaitGroup', 'Mutex', 'RWMutex', 'Cond', 'NewCond', 'Add', 'Wait', 'Lock', 'Unlock', 'RLock', 'RUnlock', 'Signal', 'Broadcast', 'Once'])
const TH_CTX = new Set(['ctx', 'context', 'WithTimeout', 'WithCancel', 'WithDeadline', 'Background', 'cancel', 'Deadline', 'TODO'])
const TH_FLOW = new Set(['for', 'range', 'select', 'case', 'default', 'if', 'else', 'switch', 'return', 'go', 'defer', 'break', 'continue', 'func'])

const W_HI = new Set(['<-', 'chan', 'select', 'go', 'defer', 'close', 'range', 'make', 'Add', 'Done', 'Wait', 'Lock', 'Unlock', 'RLock', 'RUnlock', 'Signal', 'Broadcast', 'WithTimeout', 'WithCancel', 'cancel', 'Cond'])
const W_MID = new Set(['for', 'if', 'else', 'return', 'func', 'case', 'switch', ':=', '==', '!=', '<=', '>=', '%', '&&', '||', '=', '<', '>'])

function receiver(tokens: Token[], i: number): string {
  let j = i - 1
  while (j >= 0 && tokens[j].type === 'ws') j--
  if (j >= 0 && tokens[j].value === '.') {
    j--
    while (j >= 0 && tokens[j].type === 'ws') j--
    if (j >= 0) return tokens[j].value
  }
  return ''
}

function themeOf(tokens: Token[], i: number): Theme | 'other' {
  const v = tokens[i].value
  if (v === 'Done') return /ctx|context/i.test(receiver(tokens, i)) ? 'ctx' : 'sync'
  if (TH_CH.has(v)) return 'ch'
  if (TH_SYNC.has(v)) return 'sync'
  if (TH_CTX.has(v)) return 'ctx'
  if (TH_FLOW.has(v)) return 'flow'
  return 'other'
}

function weightOf(t: Token): number {
  if (W_HI.has(t.value)) return 5
  if (W_MID.has(t.value)) return 3
  if (t.type === 'keyword') return 3
  return 1
}

function shuffle<T>(a: T[]): T[] {
  for (let k = a.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1))
    ;[a[k], a[j]] = [a[j], a[k]]
  }
  return a
}

interface Cand { idx: number; line: number; w: number }

function weightedPick(arr: Cand[]): Cand {
  const tot = arr.reduce((s, x) => s + x.w, 0)
  let r = Math.random() * tot
  for (const x of arr) { r -= x.w; if (r <= 0) return x }
  return arr[arr.length - 1]
}

export interface BlankOpts { theme?: Theme; gran?: Gran }

export function createBlanks(tokens: Token[], ratio: number, opts: BlankOpts = {}): Set<number> {
  const theme = opts.theme ?? 'all'
  const gran = opts.gran ?? 'tok'

  const line: number[] = []
  let ln = 0
  for (let i = 0; i < tokens.length; i++) { line[i] = ln; if (tokens[i].type === 'newline') ln++ }

  let cand: Cand[] = []
  for (let i = 0; i < tokens.length; i++) {
    if (!eligible(tokens[i])) continue
    if (theme !== 'all' && themeOf(tokens, i) !== theme) continue
    cand.push({ idx: i, line: line[i], w: weightOf(tokens[i]) })
  }
  if (cand.length === 0) {
    for (let i = 0; i < tokens.length; i++) {
      if (eligible(tokens[i])) cand.push({ idx: i, line: line[i], w: weightOf(tokens[i]) })
    }
  }
  if (cand.length === 0) return new Set()

  const byLine: Record<number, Cand[]> = {}
  cand.forEach((c) => { (byLine[c.line] = byLine[c.line] || []).push(c) })

  if (gran === 'line') {
    const lines = Object.keys(byLine).map(Number).sort((a, b) => a - b)
    const target = Math.max(1, Math.round(lines.length * ratio))
    const chosen = new Set<number>()
    for (let b = 0; b < target; b++) {
      const start = Math.floor((b * lines.length) / target)
      const end = Math.max(start + 1, Math.floor(((b + 1) * lines.length) / target))
      const bucket = lines.slice(start, end).filter((L) => !chosen.has(L))
      if (bucket.length) chosen.add(bucket[Math.floor(Math.random() * bucket.length)])
    }
    const res = new Set<number>()
    chosen.forEach((L) => byLine[L].forEach((c) => res.add(c.idx)))
    return res
  }

  const target = Math.max(1, Math.round(cand.length * ratio))
  const lines = Object.keys(byLine).map(Number)
  const res = new Set<number>()
  while (res.size < target) {
    let progressed = false
    shuffle(lines)
    for (const L of lines) {
      const pool = byLine[L].filter((c) => !res.has(c.idx))
      if (!pool.length) continue
      res.add(weightedPick(pool).idx)
      progressed = true
      if (res.size >= target) break
    }
    if (!progressed) break
  }
  return res
}
