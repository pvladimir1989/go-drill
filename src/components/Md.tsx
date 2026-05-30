import type { ReactNode } from 'react'

function MdInline({ txt }: { txt: string }): ReactNode {
  const parts: ReactNode[] = []
  let rest = String(txt)
  let k = 0
  const re = /(\*\*([^*]+)\*\*|`([^`]+)`)/
  let m: RegExpExecArray | null
  while ((m = re.exec(rest))) {
    if (m.index > 0) parts.push(rest.slice(0, m.index))
    if (m[2] !== undefined) {
      parts.push(<strong key={k++} style={{ color: '#e8e8e8', fontWeight: 600 }}>{m[2]}</strong>)
    } else {
      parts.push(<code key={k++} style={{ background: '#1a1a22', padding: '1px 5px', borderRadius: 4, fontFamily: "'JetBrains Mono',ui-monospace,monospace", fontSize: '0.88em', color: '#f59e0b' }}>{m[3]}</code>)
    }
    rest = rest.slice(m.index + m[0].length)
  }
  if (rest) parts.push(rest)
  return <>{parts}</>
}

export function Md({ src }: { src?: string }) {
  if (!src) return null
  const lines = String(src).replace(/\r/g, '').split('\n')
  const out: ReactNode[] = []
  let i = 0
  let k = 0
  while (i < lines.length) {
    const ln = lines[i]
    if (/^```/.test(ln)) {
      const code: string[] = []
      i++
      while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++ }
      if (i < lines.length) i++
      out.push(
        <pre key={k++} style={{ background: '#0f0f14', border: '1px solid #1f1f28', borderRadius: 8, padding: '12px 14px', margin: '8px 0', overflowX: 'auto', fontSize: 12.5, lineHeight: 1.55, color: '#cbd5b5', fontFamily: "'JetBrains Mono',ui-monospace,monospace" }}>{code.join('\n')}</pre>,
      )
      continue
    }
    if (/^#{1,6}\s+/.test(ln)) {
      out.push(<div key={k++} style={{ fontWeight: 600, fontSize: 13, color: '#f59e0b', margin: k === 1 ? '0 0 6px' : '18px 0 6px', fontFamily: "'Space Grotesk',sans-serif" }}><MdInline txt={ln.replace(/^#{1,6}\s+/, '')} /></div>)
      i++
      continue
    }
    if (/^[-*]\s+/.test(ln)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^[-*]\s+/, '')); i++ }
      out.push(<ul key={k++} style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{items.map((it, j) => <li key={j} style={{ marginBottom: 4, lineHeight: 1.6 }}><MdInline txt={it} /></li>)}</ul>)
      continue
    }
    if (ln.trim() === '') { i++; continue }
    out.push(<p key={k++} style={{ margin: '0 0 8px', lineHeight: 1.65 }}><MdInline txt={ln} /></p>)
    i++
  }
  return <>{out}</>
}
