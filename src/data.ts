import type { Tab, Dataset } from './types'

const cache: Partial<Record<Tab, Dataset>> = {}

async function fetchJson(name: string): Promise<Dataset> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`)
  if (!res.ok) throw new Error(`failed to load ${name}.json: ${res.status}`)
  return res.json()
}

/** Lazily load the dataset for a tab. 'go' is derived from the interview ('iv') data. */
export async function loadDataset(tab: Tab): Promise<Dataset> {
  if (cache[tab]) return cache[tab]!
  let data: Dataset
  if (tab === 'go') {
    const iv = cache.iv ?? (await fetchJson('iv'))
    cache.iv = iv
    data = iv
      .filter((c) => c.name === 'Concurrency')
      .map((c) => ({ name: 'Go · Concurrency', icon: '🧩', problems: c.problems.filter((p) => p.go && p.task) }))
  } else {
    const file = tab === 'leet' ? 'leet' : tab === 'iv' ? 'iv' : 'rp'
    data = await fetchJson(file)
  }
  cache[tab] = data
  return data
}
