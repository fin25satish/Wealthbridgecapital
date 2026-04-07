import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, TrendingUp, TrendingDown } from 'lucide-react'
import api from '../lib/api'
import { formatNumber, getChangeColor } from '../lib/utils'

interface StockRow {
  symbol: string
  name: string
  sector: string
  price: number
  market_cap: number
  pe_ratio: number | null
  '52w_high': number | null
  '52w_low': number | null
}

export default function ScreenerPage() {
  const [exchange, setExchange] = useState('NSE')
  const [minPE, setMinPE] = useState('')
  const [maxPE, setMaxPE] = useState('')
  const [minMCap, setMinMCap] = useState('')
  const [sector, setSector] = useState('')
  const [results, setResults] = useState<StockRow[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const runScreen = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ exchange })
      if (minPE) params.set('min_pe', minPE)
      if (maxPE) params.set('max_pe', maxPE)
      if (minMCap) params.set('min_market_cap', String(Number(minMCap) * 1e7))
      if (sector) params.set('sector', sector)
      const { data } = await api.get(`/stocks/screen?${params}`)
      setResults(data)
    } catch { /* silent */ }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Search size={22} className="text-brand-400" /> Stock Screener
        </h1>
        <p className="text-slate-400 text-sm mt-1">Filter NSE/BSE and US stocks by fundamentals</p>
      </div>

      <div className="card grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Exchange</label>
          <select className="input w-full" value={exchange} onChange={e => setExchange(e.target.value)}>
            <option value="NSE">NSE (India)</option>
            <option value="NYSE">S&P 500 (USA)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Min P/E</label>
          <input className="input w-full" placeholder="e.g. 10" value={minPE} onChange={e => setMinPE(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Max P/E</label>
          <input className="input w-full" placeholder="e.g. 50" value={maxPE} onChange={e => setMaxPE(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Min Market Cap (Cr)</label>
          <input className="input w-full" placeholder="e.g. 1000" value={minMCap} onChange={e => setMinMCap(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Sector</label>
          <input className="input w-full" placeholder="e.g. Technology" value={sector} onChange={e => setSector(e.target.value)} />
        </div>
        <button onClick={runScreen} disabled={loading}
          className="btn-primary flex items-center justify-center gap-2 h-9 disabled:opacity-60">
          <Filter size={15} /> {loading ? 'Scanning…' : 'Screen'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Fetching live data…</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-surface-border">
                {['Symbol', 'Name', 'Sector', 'Price', 'Mkt Cap', 'P/E', '52W High', '52W Low'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {results.map((r) => (
                <tr key={r.symbol}
                  className="hover:bg-surface-hover cursor-pointer transition-colors"
                  onClick={() => navigate(`/app/stock/${r.symbol}?exchange=${exchange}`)}>
                  <td className="px-4 py-3 font-mono font-semibold text-brand-400">{r.symbol}</td>
                  <td className="px-4 py-3 text-white max-w-[160px] truncate">{r.name}</td>
                  <td className="px-4 py-3 text-slate-400">{r.sector || '—'}</td>
                  <td className="px-4 py-3 text-white font-medium">{r.price?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-slate-300">{r.market_cap ? formatNumber(r.market_cap) : '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{r.pe_ratio ? r.pe_ratio.toFixed(1) : '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{r['52w_high'] ? r['52w_high'].toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{r['52w_low'] ? r['52w_low'].toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Filter size={40} className="mx-auto mb-3 opacity-30" />
          <p>Set your filters and click Screen to see results.</p>
        </div>
      )}
    </div>
  )
}
