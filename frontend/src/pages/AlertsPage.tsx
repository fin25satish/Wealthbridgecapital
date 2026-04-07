import { useEffect, useState } from 'react'
import { Bell, Plus, Trash2, CheckCircle, Clock } from 'lucide-react'
import api from '../lib/api'

interface Alert {
  id: number
  symbol: string
  exchange: string
  condition: string
  target_price: number
  is_active: boolean
  created_at: string
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [form, setForm] = useState({ symbol: '', exchange: 'NSE', condition: 'above', target_price: '' })
  const [loading, setLoading] = useState(false)

  const fetchAlerts = async () => {
    setLoading(true)
    const { data } = await api.get('/alerts/')
    setAlerts(data)
    setLoading(false)
  }

  useEffect(() => { fetchAlerts() }, [])

  const createAlert = async () => {
    if (!form.symbol || !form.target_price) return
    await api.post('/alerts/', {
      symbol: form.symbol.toUpperCase(),
      exchange: form.exchange,
      condition: form.condition,
      target_price: Number(form.target_price),
    })
    setForm({ symbol: '', exchange: 'NSE', condition: 'above', target_price: '' })
    fetchAlerts()
  }

  const deleteAlert = async (id: number) => {
    await api.delete(`/alerts/${id}`)
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const active = alerts.filter(a => a.is_active)
  const triggered = alerts.filter(a => !a.is_active)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bell size={22} className="text-brand-400" /> Price Alerts
        </h1>
        <p className="text-slate-400 text-sm mt-1">Get notified when a stock crosses your target price</p>
      </div>

      {/* Create alert */}
      <div className="card grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Symbol</label>
          <input className="input w-full uppercase" placeholder="RELIANCE"
            value={form.symbol} onChange={e => setForm(p => ({ ...p, symbol: e.target.value.toUpperCase() }))} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Exchange</label>
          <select className="input w-full" value={form.exchange}
            onChange={e => setForm(p => ({ ...p, exchange: e.target.value }))}>
            <option>NSE</option><option>BSE</option><option>NYSE</option><option>NASDAQ</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Condition</label>
          <select className="input w-full" value={form.condition}
            onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}>
            <option value="above">Price Above</option>
            <option value="below">Price Below</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Target Price</label>
          <input type="number" className="input w-full" placeholder="2500"
            value={form.target_price} onChange={e => setForm(p => ({ ...p, target_price: e.target.value }))} />
        </div>
        <button onClick={createAlert} className="btn-primary flex items-center gap-2 h-9">
          <Plus size={15} /> Create Alert
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-10 text-slate-400">Loading alerts…</div>
      ) : (
        <div className="space-y-5">
          {/* Active alerts */}
          <div>
            <h2 className="text-sm font-medium text-slate-400 flex items-center gap-2 mb-3">
              <Clock size={14} /> Active Alerts ({active.length})
            </h2>
            {active.length > 0 ? (
              <div className="space-y-2">
                {active.map(a => (
                  <div key={a.id} className="card flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="font-mono font-semibold text-brand-400">{a.symbol}</span>
                      <span className="text-xs bg-surface-border px-2 py-0.5 rounded text-slate-400">{a.exchange}</span>
                      <span className="text-sm text-slate-300">
                        Price <span className="font-medium text-white">{a.condition === 'above' ? '↑ above' : '↓ below'}</span>{' '}
                        <span className="font-bold text-white">₹{a.target_price.toLocaleString('en-IN')}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{a.created_at?.slice(0, 10)}</span>
                      <button onClick={() => deleteAlert(a.id)}
                        className="text-slate-600 hover:text-danger transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center py-8 text-slate-500">
                <Bell size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No active alerts. Create one above.</p>
              </div>
            )}
          </div>

          {/* Triggered alerts */}
          {triggered.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-slate-400 flex items-center gap-2 mb-3">
                <CheckCircle size={14} className="text-success" /> Triggered ({triggered.length})
              </h2>
              <div className="space-y-2">
                {triggered.map(a => (
                  <div key={a.id} className="card flex items-center justify-between gap-4 opacity-60">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="font-mono font-semibold text-slate-400">{a.symbol}</span>
                      <span className="text-xs bg-surface-border px-2 py-0.5 rounded text-slate-500">{a.exchange}</span>
                      <span className="text-sm text-slate-500">
                        {a.condition === 'above' ? '↑ above' : '↓ below'} ₹{a.target_price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded">Triggered</span>
                    </div>
                    <button onClick={() => deleteAlert(a.id)}
                      className="text-slate-700 hover:text-danger transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
