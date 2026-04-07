import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

interface SearchResult {
  symbol: string
  name: string
  exchange: string
  type: string
}

export default function StockSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/stocks/search?q=${encodeURIComponent(query)}`)
        setResults(data.slice(0, 8))
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (result: SearchResult) => {
    const sym = result.symbol.replace('.NS', '').replace('.BO', '')
    const ex = result.symbol.endsWith('.NS') ? 'NSE' : result.symbol.endsWith('.BO') ? 'BSE' : 'NYSE'
    navigate(`/app/stock/${sym}?exchange=${ex}`)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="input w-full pl-9 pr-4 h-9 text-sm"
          placeholder="Search stocks… (e.g. RELIANCE, AAPL)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-card border border-surface-border rounded-xl shadow-xl z-50 overflow-hidden">
          {results.map((r) => (
            <button
              key={r.symbol}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover text-left transition-colors"
              onClick={() => handleSelect(r)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-white text-sm">
                    {r.symbol.replace('.NS', '').replace('.BO', '')}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-surface-border text-slate-400">
                    {r.exchange}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">{r.name}</p>
              </div>
              <span className="text-xs text-slate-600">{r.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
