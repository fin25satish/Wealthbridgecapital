import { useState } from 'react'
import { GitCompare, Plus, X } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import api from '../lib/api'
import { formatPct, getChangeColor } from '../lib/utils'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444']

interface StockData {
  symbol: string
  exchange: string
  price: number
  change_pct: number
  pe_ratio: number | null
  market_cap: number | null
  history: { date: string; close: number; normalized?: number }[]
}

export default function ComparePage() {
  const [inputs, setInputs] = useState([
    { symbol: 'RELIANCE', exchange: 'NSE' },
    { symbol: 'TCS', exchange: 'NSE' },
  ])
  const [stocks, setStocks] = useState<StockData[]>([])
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('1y')

  const addInput = () => {
    if (inputs.length >= 4) return
    setInputs(prev => [...prev, { symbol: '', exchange: 'NSE' }])
  }

  const removeInput = (i: number) => setInputs(prev => prev.filter((_, idx) => idx !== i))

  const compare = async () => {
    const valid = inputs.filter(i => i.symbol.trim())
    if (valid.length < 2) return
    setLoading(true)
    try {
      const results = await Promise.all(valid.map(async inp => {
        const [q, h, f] = await Promise.all([
          api.get(`/stocks/${inp.symbol}/quote?exchange=${inp.exchange}`),
          api.get(`/stocks/${inp.symbol}/history?exchange=${inp.exchange}&period=${period}&interval=1d`),
          api.get(`/stocks/${inp.symbol}/fundamentals?exchange=${inp.exchange}`),
        ])
        const history: { date: string; close: number; normalized?: number }[] = h.data
        const base = history[0]?.close || 1
        history.forEach(pt => { pt.normalized = ((pt.close / base) - 1) * 100 })
        return {
          symbol: inp.symbol.toUpperCase(),
          exchange: inp.exchange,
          price: q.data.price,
          change_pct: q.data.change_pct,
          pe_ratio: f.data.pe_ratio,
          market_cap: f.data.market_cap,
          history,
        } as StockData
      }))
      setStocks(results)
    } catch { /* silent */ }
    setLoading(false)
  }

  // Merge histories by date
  const mergedDates = stocks.length > 0
    ? stocks[0].history.map((pt, idx) => {
        const row: Record<string, unknown> = { date: pt.date.slice(0, 10) }
        stocks.forEach(s => { row[s.symbol] = s.history[idx]?.normalized?.toFixed(2) })
        return row
      })
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <GitCompare size={22} className="text-brand-400" /> Stock Comparison
        </h1>
        <p className="text-slate-400 text-sm mt-1">Compare up to 4 stocks side-by-side</p>
      </div>

      <div className="card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {inputs.map((inp, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-slate-400">Symbol {i + 1}</label>
                <input className="input w-full uppercase text-sm"
                  value={inp.symbol}
                  onChange={e => setInputs(prev => prev.map((p, idx) => idx === i ? { ...p, symbol: e.target.value.toUpperCase() } : p))}
                  placeholder={`Stock ${i + 1}`} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Exch</label>
                <select className="input text-sm h-9"
                  value={inp.exchange}
                  onChange={e => setInputs(prev => prev.map((p, idx) => idx === i ? { ...p, exchange: e.target.value } : p))}>
                  <option>NSE</option><option>BSE</option><option>NYSE</option><option>NASDAQ</option>
                </select>
              </div>
              {inputs.length > 2 && (
                <button onClick={() => removeInput(i)} className="text-slate-500 hover:text-danger mb-0.5">
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3 items-center justify-between">
          <div className="flex gap-2 items-center">
            <span className="text-xs text-slate-400">Period:</span>
            {['3mo', '6mo', '1y', '2y'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`text-xs px-2 py-1 rounded ${period === p ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                {p.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {inputs.length < 4 && (
              <button onClick={addInput} className="btn-ghost text-sm flex items-center gap-1">
                <Plus size={14} /> Add Stock
              </button>
            )}
            <button onClick={compare} disabled={loading} className="btn-primary text-sm px-5 disabled:opacity-60">
              {loading ? 'Loading…' : 'Compare'}
            </button>
          </div>
        </div>
      </div>

      {stocks.length >= 2 && (
        <>
          {/* Normalised return chart */}
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Normalised Return (%) — Base = start date</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mergedDates}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false}
                  tickFormatter={v => v?.slice(0, 7)} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false}
                  tickFormatter={v => `${Number(v) >= 0 ? '+' : ''}${v}%`} width={55} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`${v >= 0 ? '+' : ''}${Number(v).toFixed(2)}%`]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {stocks.map((s, i) => (
                  <Line key={s.symbol} type="monotone" dataKey={s.symbol}
                    stroke={COLORS[i]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Side-by-side metrics */}
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-xs text-slate-500">
                  <th className="text-left px-4 py-3">Metric</th>
                  {stocks.map((s, i) => (
                    <th key={s.symbol} className="text-right px-4 py-3"
                      style={{ color: COLORS[i] }}>{s.symbol}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {[
                  { label: 'Price', values: stocks.map(s => s.price?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '—') },
                  { label: 'Change %', values: stocks.map(s => formatPct(s.change_pct || 0)) },
                  { label: 'P/E Ratio', values: stocks.map(s => s.pe_ratio ? s.pe_ratio.toFixed(1) : '—') },
                  { label: 'Market Cap', values: stocks.map(s => s.market_cap ? `₹${(s.market_cap / 1e9).toFixed(1)}B` : '—') },
                ].map(row => (
                  <tr key={row.label} className="hover:bg-surface-hover">
                    <td className="px-4 py-3 text-slate-400">{row.label}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className={`px-4 py-3 text-right font-medium ${row.label === 'Change %' ? getChangeColor(stocks[i].change_pct || 0) : 'text-white'}`}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
