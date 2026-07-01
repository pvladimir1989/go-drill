import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Dataset, Gran, Lang, Problem, Tab, Theme } from './types'
import { DC, LANGS, LM, SY } from './constants'
import { tokenize } from './lib/tokenize'
import { createBlanks } from './lib/blanks'
import { Md } from './components/Md'
import { loadDataset } from './data'

function useMobile(): boolean {
  const [m, setM] = useState(typeof window !== 'undefined' && window.innerWidth < 640)
  useEffect(() => {
    const onResize = () => setM(window.innerWidth < 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return m
}

const TABS: { k: Tab; l: string }[] = [
  { k: 'leet', l: '⚡ LeetCode' },
  { k: 'iv', l: '🎯 Собеседования' },
  { k: 'go', l: '🧩 Go-задачи' },
  { k: 'rp', l: '📚 Go Practice' },
  { k: 'bug', l: '🐛 Найди баг' },
  { k: 'arch', l: '🏛 Архитектура' },
]
const RATIOS = [{ l: '20%', v: 0.2 }, { l: '35%', v: 0.35 }, { l: '55%', v: 0.55 }]
const GRANS: { k: Gran; l: string }[] = [{ k: 'tok', l: 'слова' }, { k: 'line', l: 'строки' }]
const THEMES: { k: Theme; l: string }[] = [
  { k: 'all', l: 'Все' }, { k: 'ch', l: 'Каналы' }, { k: 'sync', l: 'Синхр' }, { k: 'ctx', l: 'Контекст' }, { k: 'flow', l: 'Поток' },
]

const BS: CSSProperties = { minHeight: '100vh', background: '#0a0a0c', color: '#e8e6e3', fontFamily: "'JetBrains Mono','Fira Code',monospace" }

export default function App() {
  const mob = useMobile()
  const px = mob ? 12 : 24

  const [tab, setTab] = useState<Tab>('leet')
  const [DS, setDS] = useState<Dataset>([])
  const [loading, setLoading] = useState(true)
  const [selCat, setSelCat] = useState<number | null>(null)
  const [selP, setSelP] = useState<Problem | null>(null)
  const [lang, setLang] = useState<Lang>('python')
  const [mode, setMode] = useState<'view' | 'practice'>('view')
  const [blanks, setBlanks] = useState<Set<number>>(new Set())
  const [ans, setAns] = useState<Record<number, string>>({})
  const [showR, setShowR] = useState(false)
  const [ratio, setRatio] = useState(0.3)
  const [gran, setGran] = useState<Gran>('tok')
  const [theme, setTheme] = useState<Theme>('all')
  const [search, setSearch] = useState('')
  const [done, setDone] = useState<Set<string>>(new Set())
  const [panel, setPanel] = useState(true)
  const [solOpen, setSolOpen] = useState(false)
  const [archPick, setArchPick] = useState<number | null>(null)
  const refs = useRef<Record<number, HTMLInputElement | null>>({})

  useEffect(() => {
    let live = true
    setLoading(true)
    loadDataset(tab).then((d) => { if (live) { setDS(d); setLoading(false) } }).catch(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [tab])

  const allP = useMemo(() => {
    const a: Problem[] = []
    DS.forEach((c) => c.problems.forEach((p) => a.push({ ...p, category: c.name, icon: c.icon })))
    return a
  }, [DS])
  const filtered = useMemo(() => {
    if (!search.trim()) return null
    const q = search.toLowerCase()
    return allP.filter((p) => p.t.toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q))
  }, [search, allP])

  const code = selP ? (selP[lang] || selP[LANGS.find((l) => selP[l]) ?? 'python'] || selP.python || '') : ''
  const tokens = useMemo(() => (code ? tokenize(code, lang) : []), [code, lang])

  const startP = useCallback(() => {
    const t = tokenize(code, lang)
    const b = createBlanks(t, ratio, { theme: lang === 'go' ? theme : 'all', gran })
    setBlanks(b); setAns({}); setShowR(false); setMode('practice')
    setTimeout(() => {
      const f = [...b].sort((a, c) => a - c)[0]
      if (f !== undefined && refs.current[f]) refs.current[f]!.focus()
    }, 100)
  }, [code, lang, ratio, theme, gran])

  const check = useCallback(() => {
    setShowR(true)
    if ([...blanks].every((i) => (ans[i] || '').trim() === tokens[i].value) && selP) {
      setDone((p) => new Set([...p, `${selP.category}-${selP.t}-${lang}`]))
    }
  }, [blanks, ans, tokens, selP, lang])

  const reveal = useCallback(() => {
    const r: Record<number, string> = {}
    blanks.forEach((i) => { r[i] = tokens[i].value })
    setAns(r); setShowR(true)
  }, [blanks, tokens])

  const onKey = useCallback((e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault()
      const s = [...blanks].sort((a, c) => a - c)
      const n = s[s.indexOf(idx) + 1]
      if (n !== undefined && refs.current[n]) refs.current[n]!.focus()
    }
  }, [blanks])

  const swLang = useCallback((l: Lang) => {
    setLang(l)
    if (mode === 'practice') { setMode('view'); setBlanks(new Set()); setAns({}); setShowR(false) }
  }, [mode])

  const openP = useCallback((p: Problem) => {
    setSelP(p); setMode('view'); setSearch(''); setBlanks(new Set()); setAns({}); setShowR(false); setSolOpen(false); setArchPick(null)
    if ((tab === 'go' || tab === 'rp') && p.go) setLang('go')
    else if (tab === 'bug') setLang('go')
    else if (!p[lang]) { const fl = LANGS.find((l) => p[l]); if (fl) setLang(fl) }
  }, [lang, tab])

  // ---------- HOME ----------
  if (!selP) {
    const ec = allP.filter((p) => p.d === 'easy').length
    const mc = allP.filter((p) => p.d === 'medium').length
    const hc = allP.filter((p) => p.d === 'hard').length
    return (
      <div style={BS}>
        <div style={{ padding: `${mob ? 20 : 32}px ${px}px ${mob ? 14 : 20}px`, borderBottom: '1px solid #1a1a1f', background: 'linear-gradient(180deg,#0f0f14,#0a0a0c)' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: mob ? 22 : 28, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700 }}>go<span style={{ color: '#f59e0b' }}>.drill</span></span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {TABS.map((t) => (
                <button key={t.k} onClick={() => { setTab(t.k); setSelCat(null); setSearch('') }} style={{ padding: mob ? '7px 14px' : '7px 18px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', background: tab === t.k ? '#1c1c24' : 'transparent', color: tab === t.k ? '#f59e0b' : '#666', border: `1px solid ${tab === t.k ? '#f59e0b55' : '#222'}`, fontWeight: tab === t.k ? 600 : 400 }}>{t.l}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#666', marginBottom: 16, flexWrap: 'wrap' }}>
              <span>{allP.length} задач</span>
              <span style={{ color: '#4ade80' }}>{ec} easy</span>
              <span style={{ color: '#facc15' }}>{mc} medium</span>
              {hc > 0 && <span style={{ color: '#f87171' }}>{hc} hard</span>}
              <span style={{ color: '#a78bfa' }}>{done.size} решено</span>
              {tab === 'rp' && <a href="https://github.com/RezaSi/go-interview-practice" target="_blank" rel="noopener noreferrer" style={{ color: '#555', textDecoration: 'none' }}>задачи: RezaSi/go-interview-practice (MIT) ↗</a>}
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {LANGS.map((l) => (
                <button key={l} onClick={() => setLang(l)} style={{ padding: mob ? '6px 10px' : '5px 14px', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', background: lang === l ? LM[l].c : '#111116', color: lang === l ? '#fff' : '#666', border: `1px solid ${lang === l ? 'transparent' : '#222'}`, fontWeight: lang === l ? 600 : 400 }}>{LM[l].l}</button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <input type="text" placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px 10px 36px', background: '#111116', border: '1px solid #222', borderRadius: 8, color: '#e8e6e3', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#555' }}>⌕</span>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: `20px ${px}px` }}>
          {loading && <div style={{ color: '#555', fontSize: 13 }}>Загрузка…</div>}
          {!loading && filtered && filtered.length > 0 && filtered.map((p, i) => {
            const d = done.has(`${p.category}-${p.t}-${lang}`)
            return (
              <div key={i} onClick={() => openP(p)} style={{ padding: '10px 14px', marginBottom: 4, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: '#111116', border: '1px solid #1a1a1f' }}>
                <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{p.icon}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{p.t}</span>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: DC[p.d].bg, color: DC[p.d].t, border: `1px solid ${DC[p.d].b}` }}>{p.d}</span>
                {d && <span style={{ color: '#4ade80' }}>✓</span>}
              </div>
            )
          })}
          {!loading && filtered && filtered.length === 0 && <div style={{ color: '#555', fontSize: 13 }}>Ничего не найдено</div>}
          {!loading && !filtered && DS.map((cat, ci) => (
            <div key={ci} style={{ marginBottom: 20 }}>
              <div onClick={() => setSelCat(selCat === ci ? null : ci)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', cursor: 'pointer', userSelect: 'none', borderBottom: '1px solid #1a1a1f' }}>
                <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{cat.icon}</span>
                <span style={{ flex: 1, fontSize: 15, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600 }}>{cat.name}</span>
                <span style={{ fontSize: 12, color: '#555' }}>{cat.problems.length}</span>
                <span style={{ fontSize: 12, color: '#555', transform: selCat === ci ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▸</span>
              </div>
              {selCat === ci && (
                <div style={{ paddingLeft: mob ? 20 : 38, paddingTop: 4 }}>
                  {cat.problems.map((p, pi) => {
                    const d = done.has(`${cat.name}-${p.t}-${lang}`)
                    return (
                      <div key={pi} onClick={() => openP({ ...p, category: cat.name, icon: cat.icon })} style={{ padding: '8px 12px', marginBottom: 2, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }} onMouseEnter={(e) => (e.currentTarget.style.background = '#111116')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: d ? '#4ade80' : DC[p.d].t, opacity: d ? 1 : 0.5, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 13, color: d ? '#888' : '#ccc' }}>{p.t}</span>
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: DC[p.d].bg, color: DC[p.d].t, border: `1px solid ${DC[p.d].b}` }}>{p.d}</span>
                        {d && <span style={{ fontSize: 11, color: '#4ade80' }}>✓</span>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ---------- ARCH (system-design MCQ: diagram → pick missing component) ----------
  if (tab === 'arch' && selP.options) {
    const opts = selP.options
    const picked = archPick !== null
    const chosen = picked ? opts[archPick] : null
    const diagStyle: CSSProperties = { border: '1px solid #1a1a1f', borderRadius: mob ? 8 : 10, padding: mob ? '14px 12px' : '18px 22px', margin: 0, overflowX: 'auto', fontSize: mob ? 11.5 : 13, lineHeight: 1.7, WebkitOverflowScrolling: 'touch', whiteSpace: 'pre' }
    const renderDiagram = (src: string) => src.split('\n').map((line, i) => {
      const warn = /[⚠✘]/.test(line)
      const good = /[✔]/.test(line) && !warn
      return <div key={i} style={{ color: warn ? '#f87171' : good ? '#4ade80' : '#9ca3af' }}>{line || ' '}</div>
    })
    const pick = (i: number) => {
      if (picked) return
      setArchPick(i)
      if (opts[i].ok && selP.category) setDone((p) => new Set([...p, `arch-${selP.category}-${selP.t}`]))
    }
    return (
      <div style={BS}>
        <div style={{ padding: `${mob ? 10 : 12}px ${px}px`, borderBottom: '1px solid #1a1a1f', display: 'flex', alignItems: 'center', gap: mob ? 8 : 12, background: '#0f0f14', position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={() => setSelP(null)} style={{ background: 'none', border: '1px solid #222', borderRadius: 6, color: '#888', cursor: 'pointer', padding: mob ? '6px 10px' : '4px 10px', fontSize: 12, fontFamily: 'inherit' }}>←</button>
          <span style={{ fontSize: mob ? 13 : 15, flex: 1, minWidth: 0, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🏛 {selP.t}</span>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: DC[selP.d].bg, color: DC[selP.d].t, border: `1px solid ${DC[selP.d].b}` }}>{selP.d}</span>
        </div>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: `${mob ? 16 : 28}px ${px}px` }}>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.2, color: '#f59e0b', fontWeight: 600, marginBottom: 6 }}>Схема · проблема</div>
          {selP.diagram && <pre style={{ ...diagStyle, background: '#121016' }}>{renderDiagram(selP.diagram)}</pre>}
          {selP.question && <div style={{ fontSize: mob ? 14 : 15, color: '#e8e6e3', fontWeight: 600, margin: '20px 0 12px' }}>{selP.question}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {opts.map((o, i) => {
              const isChosen = archPick === i
              const reveal = picked && (o.ok || isChosen)
              const bg = !picked ? '#111116' : o.ok ? '#0d2818' : isChosen ? '#2a0a0a' : '#111116'
              const bd = !picked ? '#222' : o.ok ? '#166534' : isChosen ? '#7f1d1d' : '#1a1a1f'
              return (
                <div key={i}>
                  <button onClick={() => pick(i)} disabled={picked} style={{ width: '100%', textAlign: 'left', padding: mob ? '11px 13px' : '12px 16px', borderRadius: 8, fontSize: mob ? 13 : 13.5, fontFamily: 'inherit', cursor: picked ? 'default' : 'pointer', background: bg, color: '#e8e6e3', border: `1px solid ${bd}`, display: 'flex', alignItems: 'flex-start', gap: 10, lineHeight: 1.5 }}>
                    <span style={{ color: '#666', fontWeight: 700, flexShrink: 0 }}>{picked && o.ok ? '✓' : picked && isChosen ? '✗' : String.fromCharCode(65 + i)}</span>
                    <span style={{ flex: 1 }}><Md src={o.t} /></span>
                  </button>
                  {reveal && o.note && <div style={{ fontSize: 12, color: o.ok ? '#86efac' : '#d1a3a3', padding: '6px 16px 2px 40px', lineHeight: 1.55 }}><Md src={o.note} /></div>}
                </div>
              )
            })}
          </div>
          {picked && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 13, color: chosen?.ok ? '#4ade80' : '#f87171', fontWeight: 600, marginBottom: 16 }}>{chosen?.ok ? '✓ Верно' : '✗ Не оптимально — смотри разбор'}</div>
              {selP.after && (
                <>
                  <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.2, color: '#4ade80', fontWeight: 600, marginBottom: 6 }}>Схема · после</div>
                  <pre style={{ ...diagStyle, background: '#0d1810' }}>{renderDiagram(selP.after)}</pre>
                </>
              )}
              {selP.bug && (
                <aside style={{ marginTop: 16, background: '#0d0d12', border: '1px solid #1a1a1f', borderRadius: mob ? 8 : 10, padding: mob ? '16px 18px' : '18px 22px', fontSize: 13, color: '#b8b8b8' }}>
                  <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.2, color: '#666', fontWeight: 600, marginBottom: 8 }}>Разбор</div>
                  <Md src={selP.bug} />
                  {selP.src && <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #1a1a1f' }}><a href={selP.src} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#666', textDecoration: 'none' }}>📎 источник: {selP.src.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗</a></div>}
                </aside>
              )}
              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                <button onClick={() => setArchPick(null)} style={{ padding: '8px 16px', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', background: '#111116', color: '#888', border: '1px solid #222' }}>↻ Заново</button>
                <button onClick={() => setSelP(null)} style={{ padding: '8px 16px', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', background: '#f59e0b', color: '#000', border: 'none', fontWeight: 600 }}>К списку →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ---------- BUG (find-the-bug: buggy code → reveal fix) ----------
  if (tab === 'bug' && selP.buggy) {
    const hl = (src: string) =>
      tokenize(src, 'go').map((t, idx) => {
        if (t.type === 'newline') return <br key={idx} />
        if (t.type === 'ws') return <span key={idx}>{t.value}</span>
        return <span key={idx} style={{ color: SY[t.type] || '#888' }}>{t.value}</span>
      })
    const preStyle: CSSProperties = { border: '1px solid #1a1a1f', borderRadius: mob ? 8 : 10, padding: mob ? '14px 12px' : '18px 22px', margin: 0, overflowX: 'auto', fontSize: mob ? 12 : 13.5, lineHeight: 1.7, WebkitOverflowScrolling: 'touch' }
    return (
      <div style={BS}>
        <div style={{ padding: `${mob ? 10 : 12}px ${px}px`, borderBottom: '1px solid #1a1a1f', display: 'flex', alignItems: 'center', gap: mob ? 8 : 12, background: '#0f0f14', position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={() => setSelP(null)} style={{ background: 'none', border: '1px solid #222', borderRadius: 6, color: '#888', cursor: 'pointer', padding: mob ? '6px 10px' : '4px 10px', fontSize: 12, fontFamily: 'inherit' }}>←</button>
          <span style={{ fontSize: mob ? 13 : 15, flex: 1, minWidth: 0, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🐛 {selP.t}</span>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: DC[selP.d].bg, color: DC[selP.d].t, border: `1px solid ${DC[selP.d].b}` }}>{selP.d}</span>
        </div>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: `${mob ? 16 : 28}px ${px}px` }}>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.2, color: '#ef4444', fontWeight: 600, marginBottom: 6 }}>Найди ошибку · Go</div>
          {selP.desc && <div style={{ fontSize: mob ? 13.5 : 14, color: '#cfcfcf', marginBottom: 14 }}><Md src={selP.desc} /></div>}
          <pre style={{ ...preStyle, background: '#150f11' }}>{hl(selP.buggy)}</pre>
          {!solOpen ? (
            <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={() => setSolOpen(true)} style={{ padding: '10px 18px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', background: '#f59e0b', color: '#000', border: 'none', fontWeight: 600 }}>Показать решение →</button>
              <span style={{ fontSize: 12, color: '#555' }}>сначала найди баг сам, потом сверься</span>
              {selP.src && <a href={selP.src} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#666', textDecoration: 'none', marginLeft: 'auto' }}>источник ↗</a>}
            </div>
          ) : (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.2, color: '#4ade80', fontWeight: 600 }}>✅ Исправление · Go</span>
                <button onClick={() => setSolOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: '1px solid #222', borderRadius: 6, color: '#888', cursor: 'pointer', padding: '4px 10px', fontSize: 11, fontFamily: 'inherit' }}>Скрыть</button>
              </div>
              {selP.fix && <pre style={{ ...preStyle, background: '#0d1810' }}>{hl(selP.fix)}</pre>}
              {selP.bug && (
                <aside style={{ marginTop: 16, background: '#0d0d12', border: '1px solid #1a1a1f', borderRadius: mob ? 8 : 10, padding: mob ? '16px 18px' : '18px 22px', fontSize: 13, color: '#b8b8b8' }}>
                  <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.2, color: '#666', fontWeight: 600, marginBottom: 8 }}>Разбор</div>
                  <Md src={selP.bug} />
                  {selP.src && <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #1a1a1f' }}><a href={selP.src} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#666', textDecoration: 'none' }}>📎 источник: {selP.src.replace(/^https?:\/\//, '')} ↗</a></div>}
                </aside>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ---------- STATEMENT (go / rp, solution hidden) ----------
  if ((tab === 'go' || tab === 'rp') && selP.task && !solOpen) {
    return (
      <div style={BS}>
        <div style={{ padding: `${mob ? 10 : 12}px ${px}px`, borderBottom: '1px solid #1a1a1f', display: 'flex', alignItems: 'center', gap: mob ? 8 : 12, background: '#0f0f14', position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={() => setSelP(null)} style={{ background: 'none', border: '1px solid #222', borderRadius: 6, color: '#888', cursor: 'pointer', padding: mob ? '6px 10px' : '4px 10px', fontSize: 12, fontFamily: 'inherit' }}>←</button>
          <span style={{ fontSize: mob ? 13 : 15, flex: 1, minWidth: 0, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🧩 {selP.t}</span>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: DC[selP.d].bg, color: DC[selP.d].t, border: `1px solid ${DC[selP.d].b}` }}>{selP.d}</span>
        </div>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: `${mob ? 16 : 28}px ${px}px` }}>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.2, color: '#666', fontWeight: 600, marginBottom: 6 }}>Постановка задачи · Go</div>
          <div style={{ fontSize: mob ? 13.5 : 14, color: '#cfcfcf' }}><Md src={selP.task} /></div>
          <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => { setLang('go'); setSolOpen(true) }} style={{ padding: '10px 18px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', background: '#f59e0b', color: '#000', border: 'none', fontWeight: 600 }}>Показать решение →</button>
            <span style={{ fontSize: 12, color: '#555' }}>сначала реши сам, потом сверься</span>
            {selP.src && <a href={selP.src} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#666', textDecoration: 'none', marginLeft: 'auto' }}>источник ↗</a>}
          </div>
        </div>
      </div>
    )
  }

  // ---------- PROBLEM (code + practice + panel) ----------
  const cc = showR ? [...blanks].filter((i) => (ans[i] || '').trim() === tokens[i].value).length : 0
  return (
    <div style={BS}>
      <div style={{ padding: `${mob ? 10 : 12}px ${px}px`, borderBottom: '1px solid #1a1a1f', display: 'flex', alignItems: 'center', gap: mob ? 8 : 12, background: '#0f0f14', position: 'sticky', top: 0, zIndex: 10, flexWrap: 'wrap' }}>
        <button onClick={() => { const toTask = (tab === 'go' || tab === 'rp') && selP.task; setMode('view'); setBlanks(new Set()); setAns({}); setShowR(false); if (toTask) setSolOpen(false); else setSelP(null) }} style={{ background: 'none', border: '1px solid #222', borderRadius: 6, color: '#888', cursor: 'pointer', padding: mob ? '6px 10px' : '4px 10px', fontSize: 12, fontFamily: 'inherit' }}>←</button>
        <span style={{ fontSize: mob ? 12 : 14, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {!mob && <span style={{ color: '#555' }}>{selP.icon} {selP.category} / </span>}{selP.t}
        </span>
        <button onClick={() => setPanel((p) => !p)} title={panel ? 'Скрыть описание' : 'Показать описание'} style={{ background: panel ? '#f59e0b' : '#1a1a22', border: `1px solid ${panel ? '#f59e0b' : '#2a2a35'}`, borderRadius: 6, color: panel ? '#000' : '#f59e0b', cursor: 'pointer', padding: mob ? '6px 10px' : '4px 10px', fontSize: 13, fontFamily: 'inherit', flexShrink: 0 }}>💡</button>
        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: DC[selP.d].bg, color: DC[selP.d].t, border: `1px solid ${DC[selP.d].b}` }}>{selP.d}</span>
      </div>
      <div style={{ padding: `${mob ? 10 : 12}px ${px}px`, borderBottom: '1px solid #1a1a1f', display: 'flex', alignItems: 'center', gap: mob ? 5 : 8, flexWrap: 'wrap' }}>
        {LANGS.filter((l) => selP[l]).map((l) => (
          <button key={l} onClick={() => swLang(l)} style={{ padding: mob ? '6px 8px' : '4px 10px', borderRadius: 5, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer', background: lang === l ? LM[l].c : '#111116', color: lang === l ? '#fff' : '#666', border: `1px solid ${lang === l ? 'transparent' : '#222'}`, fontWeight: lang === l ? 600 : 400 }}>{LM[l].l}</button>
        ))}
        <div style={{ width: 1, height: 20, background: '#222', margin: '0 2px' }} />
        {mode === 'view' ? (
          <>
            {RATIOS.map((o) => (
              <button key={o.v} onClick={() => setRatio(o.v)} style={{ padding: mob ? '6px 8px' : '4px 8px', borderRadius: 5, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer', background: ratio === o.v ? '#f59e0b' : '#111116', color: ratio === o.v ? '#000' : '#888', border: `1px solid ${ratio === o.v ? '#f59e0b' : '#222'}`, fontWeight: ratio === o.v ? 600 : 400 }}>{o.l}</button>
            ))}
            <div style={{ width: 1, height: 20, background: '#222', margin: '0 2px' }} />
            {GRANS.map((g) => (
              <button key={g.k} onClick={() => setGran(g.k)} title={g.k === 'tok' ? 'Пропуски по отдельным словам' : 'Пропуски целыми строками'} style={{ padding: mob ? '6px 8px' : '4px 8px', borderRadius: 5, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer', background: gran === g.k ? '#1c1c24' : '#111116', color: gran === g.k ? '#a78bfa' : '#888', border: `1px solid ${gran === g.k ? '#a78bfa55' : '#222'}`, fontWeight: gran === g.k ? 600 : 400 }}>{g.l}</button>
            ))}
            {lang === 'go' && (
              <>
                <div style={{ width: 1, height: 20, background: '#222', margin: '0 2px' }} />
                {THEMES.map((th) => (
                  <button key={th.k} onClick={() => setTheme(th.k)} title="Тема пропусков" style={{ padding: mob ? '6px 8px' : '4px 8px', borderRadius: 5, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer', background: theme === th.k ? '#0d2818' : '#111116', color: theme === th.k ? '#4ade80' : '#888', border: `1px solid ${theme === th.k ? '#16653455' : '#222'}`, fontWeight: theme === th.k ? 600 : 400 }}>{th.l}</button>
                ))}
              </>
            )}
            <button onClick={startP} style={{ marginLeft: 'auto', padding: mob ? '8px 14px' : '6px 16px', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', background: '#f59e0b', color: '#000', border: 'none', fontWeight: 600 }}>🎲</button>
          </>
        ) : (
          <>
            <span style={{ fontSize: 12, color: '#888' }}>{blanks.size}</span>
            {showR && <span style={{ fontSize: 12, color: cc === blanks.size ? '#4ade80' : '#ef4444', fontWeight: 600 }}>{cc}/{blanks.size}</span>}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {!showR && <button onClick={check} style={{ padding: mob ? '7px 12px' : '5px 12px', borderRadius: 6, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer', background: '#4ade80', color: '#000', border: 'none', fontWeight: 600 }}>✓</button>}
              <button onClick={reveal} style={{ padding: mob ? '7px 12px' : '5px 12px', borderRadius: 6, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer', background: '#333', color: '#ccc', border: 'none' }}>👁</button>
              <button onClick={startP} style={{ padding: mob ? '7px 12px' : '5px 12px', borderRadius: 6, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer', background: '#f59e0b', color: '#000', border: 'none', fontWeight: 600 }}>🔄</button>
              <button onClick={() => { setMode('view'); setBlanks(new Set()); setAns({}); setShowR(false) }} style={{ padding: mob ? '7px 12px' : '5px 12px', borderRadius: 6, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer', background: '#111116', color: '#888', border: '1px solid #222' }}>Код</button>
            </div>
          </>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: mob ? 'column' : 'row', alignItems: 'flex-start', gap: mob ? 12 : 20, padding: `${mob ? 12 : 20}px ${px}px` }}>
        <div style={{ flex: 1, minWidth: 0, width: '100%', maxWidth: panel && selP.info && !mob ? 'none' : 960 }}>
          <pre style={{ background: '#111116', border: '1px solid #1a1a1f', borderRadius: mob ? 8 : 10, padding: mob ? '14px 12px' : '20px 24px', margin: 0, overflowX: 'auto', fontSize: mob ? 12 : 13.5, lineHeight: 1.7, WebkitOverflowScrolling: 'touch' }}>
            {tokens.map((t, idx) => {
              if (mode === 'practice' && blanks.has(idx)) {
                const cor = tokens[idx].value
                const ua = ans[idx] || ''
                const ok = showR && ua.trim() === cor
                const bad = showR && ua.trim() !== cor
                return (
                  <span key={idx} style={{ display: 'inline-block', verticalAlign: 'baseline' }}>
                    <input ref={(el) => { refs.current[idx] = el }} type="text" value={ua} onChange={(e) => setAns((p) => ({ ...p, [idx]: e.target.value }))} onKeyDown={(e) => onKey(e, idx)} disabled={showR} autoCapitalize="none" autoCorrect="off" autoComplete="off" spellCheck={false} style={{ width: `${Math.max(cor.length + 1, ua.length + 1, 2)}ch`, boxSizing: 'content-box', padding: '0 2px 1px', margin: '0 2px', background: 'transparent', border: 'none', borderBottom: `2px solid ${ok ? '#4ade80' : bad ? '#ef4444' : '#f59e0b'}`, borderRadius: 0, color: ok ? '#4ade80' : bad ? '#ef4444' : '#f59e0b', fontFamily: 'inherit', fontSize: mob ? 14 : 13.5, outline: 'none', textAlign: 'center', verticalAlign: 'baseline' }} placeholder="___" />
                    {bad && <span style={{ fontSize: 10.5, color: '#4ade80', marginLeft: 2, opacity: 0.8 }}>{cor}</span>}
                  </span>
                )
              }
              if (t.type === 'newline') return <br key={idx} />
              if (t.type === 'ws') return <span key={idx}>{t.value}</span>
              return <span key={idx} style={{ color: SY[t.type] || '#888' }}>{t.value}</span>
            })}
          </pre>
        </div>
        {panel && selP.info && (
          <aside style={{ width: mob ? '100%' : 380, flexShrink: 0, background: '#0d0d12', border: '1px solid #1a1a1f', borderRadius: mob ? 8 : 10, padding: mob ? '16px 18px' : '18px 22px', fontSize: 13, color: '#b8b8b8', position: mob ? 'static' : 'sticky', top: mob ? 0 : 70, maxHeight: mob ? 'none' : 'calc(100vh - 96px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.2, color: '#666', fontWeight: 600 }}>О задаче</span>
              <button onClick={() => setPanel(false)} title="Скрыть" style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>
            </div>
            <Md src={selP.info} />
          </aside>
        )}
      </div>
    </div>
  )
}
