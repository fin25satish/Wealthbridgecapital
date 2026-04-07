import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Plus, Trash2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import api from '../lib/api'
import { getChangeColor, formatPct } from '../lib/utils'

interface WatchlistItem {
  id: number
  symbol: string
  exchange: string
  price?: number
  change_pct?: number
}

interface Watchlist {
  id: number
  name: string
}

export default function WatchlistPage() {
  const [lists, setLists] = useState<Watchlist[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [newSymbol, setNewSymbol] = useState('')
  const [newExchange, setNewExchange] = useState('NSE')
  const [newListName, setNewListName] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()

  const fetchLists = async () => {
    const r = await api.get('/watchlist/')
    setLists(r.data)
    if (r.data.length > 0 && !selectedId) setSelectedId(r.data[0].id)
  }

  const fetchItems = async (id: number) => {
    setLoading(true)
    const r = await api.get(`/watchlist/${id}/items/live`)
    setItems(r.data)
    setLoading(false)
  }

  useEffect(() => { fetchLists() }, [])
  useEffect(() => { if (selectedId) fetchItems(selectedId) }, [selectedId])

  const createList = async () => {
    if (!newListName.trim()) return
    await api.post('/watchlist/', { name: newListName.trim() })
    setNewListName('')
    fetchLists()
  }

  const addItem = async () => {
    if (!selectedId || !newSymbol.trim()) return
    await api.post(`/watchlist/${selectedId}/items`, {
      symbol: newSymbol.trim().toUpperCase(), exchange: newExchange
    })
    setNewSymbol('')
    fetchItems(selectedId)
  }

  const removeItem = async (itemId: number) => {
    if (!selectedId) return
    await api.delete(`/watchlist/${selectedId}/items/${itemId}`)
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  const refresh = async () => {
    if (!selectedId) return
    setRefreshing(true)
    await fetchItems(selectedId)
    setRefreshing(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Eye size={22} className="text-brand-400" /> Watchlists
        </h1>
        <button onClick={refresh} disabled={refreshing}
          className="btn-ghost text-sm flex items-center gap-2 disabled:opacity-60">
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: list selector */}
        <div className="space-y-3">
          <div className="card p-3">
            <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">My Lists</p>
            <div className="space-y-1">
              {lists.map(l => (
                <button key={l.id} onClick={() => setSelectedId(l.id)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    selectedId === l.id ? 'bg-brand-600/20 text-brand-400' : 'text-slate-400 hover:text-white hover:bg-surface-hover'
                  }`}>{l.name}</button>
              ))}
            </div>
          </div>
          <div className="card p-3 space-y-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">New List</p>
            <input className="input w-full text-sm" placeholder="List name…" value={newListName}
              onChange={e => setNewListName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createList()} />
            <button onClick={createList} className="btn-primary w-full text-sm py-1.5">Create</button>
          </div>
        </div>

        {/* Items table */}
        <div className="lg:col-span-3 space-y-4">
          {selectedId && (
            <div className="card flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">Symbol</label>
                <input className="input w-full uppercase" placeholder="RELIANCE" value={newSymbol}
                  onChange={e => setNewSymbol(e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Exchange</label>
                <select className="input" value={newExchange} onChange={e => setNewExchange(e.target.value)}>
                  <option>NSE</option><option>BSE</option><option>NYSE</option><option>NASDAQ</option>
                </select>
              </div>
              <button onClick={addItem} className="btn-primary flex items-center gap-2 h-9">
                <Plus size={15} /> Add
              </button>
            </div>
          )}

          {loading ? (
            <div className="card text-center py-10 text-slate-400">Loading live prices…</div>
          ) : items.length > 0 ? (
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-surface-border">
                    <th className="text-left px-4 py-3">Symbol</th>
                    <th className="text-left px-4 py-3">Exchange</th>
                    <th className="text-right px-4 py-3">Price</th>
                    <th className="text-right px-4 py-3">Change %</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {items.map(item => {
                    const up = (item.change_pct ?? 0) >= 0
                    return (
                      <tr key={item.id}
                        className="hover:bg-surface-hover cursor-pointer"
                        onClick={() => navigate(`/app/stock/${item.symbol}?exchange=${item.exchange}`)}>
                        <td className="px-4 py-3 font-mono font-semibold text-brand-400">{item.symbol}</td>
                        <td className="px-4 py-3 text-slate-400">{item.exchange}</td>
                        <td className="px-4 py-3 text-right text-white font-medium">
                          {item.price ? item.price.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold flex items-center justify-end gap-1 ${getChangeColor(item.change_pct ?? 0)}`}>
                          {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                          {item.change_pct !== undefined ? formatPct(item.change_pct) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                          <button onClick={() => removeItem(item.id)}
                            className="text-slate-600 hover:text-danger transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card text-center py-16 text-slate-500">
              <Eye size={36} className="mx-auto mb-3 opacity-30" />
              <p>No stocks in this watchlist yet. Add one above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
