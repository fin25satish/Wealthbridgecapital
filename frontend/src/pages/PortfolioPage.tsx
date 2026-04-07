import { useEffect, useState } from 'react'
import { Briefcase, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import api from '../lib/api'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<{ id: number; name: string }[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [perf, setPerf] = useState<{
    name: string; total_invested: number; total_current: number; total_pnl: number;
    total_pnl_pct: number; holdings: unknown[]; sector_allocation: Record<string, number>
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ symbol: '', exchange: 'NSE', quantity: '', avg_price: '' })

  useEffect(() => {
    api.get('/portfolio/').then(r => {
      setPortfolios(r.data)
      if (r.data.length > 0) setSelectedId(r.data[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    api.get(`/portfolio/${selectedId}/performance`).then(r => { setPerf(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedId])

  const addHolding = async () => {
    if (!selectedId || !form.symbol || !form.quantity || !form.avg_price) return
    await api.post(`/portfolio/${selectedId}/holdings`, {
      symbol: form.symbol.toUpperCase(), exchange: form.exchange,
      quantity: Number(form.quantity), avg_price: Number(form.avg_price),
    })
    setForm({ symbol: '', exchange: 'NSE', quantity: '', avg_price: '' })
    setShowAdd(false)
    const r = await api.get(`/portfolio/${selectedId}/performance`)
    setPerf(r.data)
  }

  const removeHolding = async (holdingId: number) => {
    await api.delete(`/portfolio/${selectedId}/holdings/${holdingId}`)
    const r = await api.get(`/portfolio/${selectedId}/performance`)
    setPerf(r.data)
  }

  const sectorData = perf ? Object.entries(perf.sector_allocation).map(([name, value]) => ({ name, value: Math.round(value) })) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Briefcase size={22} className="text-brand-400" /> Portfolio Tracker
        </h1>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Add Holding
        </button>
      </div>

      {showAdd && (
        <div className="card grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Symbol</label>
            <input className="input w-full uppercase" placeholder="RELIANCE" value={form.symbol}
              onChange={e => setForm(p => ({ ...p, symbol: e.target.value.toUpperCase() }))} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Exchange</label>
            <select className="input w-full" value={form.exchange} onChange={e => setForm(p => ({ ...p, exchange: e.target.value }))}>
              <option>NSE</option><option>BSE</option><option>NYSE</option><option>NASDAQ</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Qty</label>
            <input type="number" className="input w-full" placeholder="10" value={form.quantity}
              onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Avg Price</label>
            <input type="number" className="input w-full" placeholder="2500" value={form.avg_price}
              onChange={e => setForm(p => ({ ...p, avg_price: e.target.value }))} />
          </div>
          <button onClick={addHolding} className="btn-primary h-9">Add</button>
        </div>
      )}

      {perf && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Invested', value: `₹${perf.total_invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'text-white' },
              { label: 'Current Value', value: `₹${perf.total_current.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'text-white' },
              { label: 'Total P&L', value: `${perf.total_pnl >= 0 ? '+' : ''}₹${perf.total_pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: perf.total_pnl >= 0 ? 'text-success' : 'text-danger' },
              { label: 'Return %', value: `${perf.total_pnl_pct >= 0 ? '+' : ''}${perf.total_pnl_pct.toFixed(2)}%`, color: perf.total_pnl_pct >= 0 ? 'text-success' : 'text-danger' },
            ].map(m => (
              <div key={m.label} className="card">
                <p className="text-xs text-slate-500">{m.label}</p>
                <p className={`text-xl font-bold mt-1 ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-surface-border">
                    {['Symbol', 'Qty', 'Avg Price', 'LTP', 'Invested', 'Value', 'P&L', '%', ''].map(h => (
                      <th key={h} className="text-left px-3 py-3 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {(perf.holdings as {
                    id: number; symbol: string; quantity: number; avg_price: number;
                    current_price: number; invested: number; current_value: number;
                    pnl: number; pnl_pct: number
                  }[]).map(h => (
                    <tr key={h.id} className="hover:bg-surface-hover">
                      <td className="px-3 py-2.5 font-mono font-semibold text-brand-400">{h.symbol}</td>
                      <td className="px-3 py-2.5 text-slate-300">{h.quantity}</td>
                      <td className="px-3 py-2.5 text-slate-300">{h.avg_price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-3 py-2.5 text-white font-medium">{h.current_price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-3 py-2.5 text-slate-300">{h.invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                      <td className="px-3 py-2.5 text-white">{h.current_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                      <td className={`px-3 py-2.5 font-medium ${h.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                        {h.pnl >= 0 ? '+' : ''}{h.pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className={`px-3 py-2.5 font-medium ${h.pnl_pct >= 0 ? 'text-success' : 'text-danger'}`}>
                        {h.pnl_pct >= 0 ? '+' : ''}{h.pnl_pct.toFixed(2)}%
                      </td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => removeHolding(h.id)} className="text-slate-600 hover:text-danger transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3 className="font-semibold text-white mb-4">Sector Allocation</h3>
              {sectorData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={sectorData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                      dataKey="value" nameKey="name">
                      {sectorData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', fontSize: 12 }} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-sm text-center py-8">No data</p>
              )}
            </div>
          </div>
        </>
      )}

      {loading && <div className="card text-center py-12 text-slate-400">Loading portfolio…</div>}
    </div>
  )
}
