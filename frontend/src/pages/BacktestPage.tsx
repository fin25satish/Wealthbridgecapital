import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FlaskConical, Play, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../lib/api'

const STRATEGIES = [
  { value: 'sma_crossover', label: 'SMA Crossover', desc: 'Buy when fast SMA crosses above slow SMA' },
  { value: 'rsi', label: 'RSI Mean Reversion', desc: 'Buy oversold, sell overbought based on RSI' },
  { value: 'bollinger', label: 'Bollinger Band Breakout', desc: 'Buy at lower band, sell at midline' },
  { value: 'momentum', label: 'Momentum', desc: 'Buy on positive momentum, hold for N days' },
]

const STRATEGY_PARAMS: Record<string, { key: string; label: string; default: number }[]> = {
  sma_crossover: [
    { key: 'fast_period', label: 'Fast SMA Period', default: 20 },
    { key: 'slow_period', label: 'Slow SMA Period', default: 50 },
  ],
  rsi: [
    { key: 'rsi_period', label: 'RSI Period', default: 14 },
    { key: 'oversold', label: 'Oversold Level', default: 30 },
    { key: 'overbought', label: 'Overbought Level', default: 70 },
  ],
  bollinger: [
    { key: 'period', label: 'BB Period', default: 20 },
    { key: 'std_dev', label: 'Std Deviation', default: 2 },
  ],
  momentum: [
    { key: 'lookback', label: 'Lookback Period', default: 20 },
    { key: 'hold_days', label: 'Hold Days', default: 10 },
  ],
}

interface BacktestResult {
  strategy: string
  initial_capital: number
  final_value: number
  total_return_pct: number
  cagr_pct: number
  sharpe_ratio: number
  max_drawdown_pct: number
  total_trades: number
  win_rate_pct: number
  winning_trades: number
  losing_trades: number
  equity_curve: { date: string; value: number }[]
  trades: { date: string; action: string; price: number; pnl?: number }[]
}

export default function BacktestPage() {
  const [searchParams] = useSearchParams()
  const [symbol, setSymbol] = useState(searchParams.get('symbol') || 'RELIANCE')
  const [exchange, setExchange] = useState(searchParams.get('exchange') || 'NSE')
  const [strategy, setStrategy] = useState('sma_crossover')
  const [startDate, setStartDate] = useState('2020-01-01')
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [capital, setCapital] = useState(100000)
  const [params, setParams] = useState<Record<string, number>>({})
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentParams = STRATEGY_PARAMS[strategy] || []

  const getParam = (key: string, def: number) => params[key] ?? def

  const handleRun = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const paramObj: Record<string, number> = {}
      currentParams.forEach(p => { paramObj[p.key] = getParam(p.key, p.default) })
      const { data } = await api.post('/stocks/backtest', {
        symbol, exchange, strategy, start_date: startDate, end_date: endDate,
        initial_capital: capital, params: paramObj,
      })
      setResult(data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Backtest failed. Check the symbol and date range.')
    }
    setLoading(false)
  }

  const isPositive = result && result.total_return_pct >= 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FlaskConical size={24} className="text-brand-400" /> Backtesting Engine
        </h1>
        <p className="text-slate-400 text-sm mt-1">Test trading strategies on historical India + USA stock data</p>
      </div>

      {/* Config */}
      <div className="card grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Symbol</label>
          <input className="input w-full uppercase" value={symbol}
            onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="RELIANCE / AAPL" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Exchange</label>
          <select className="input w-full" value={exchange} onChange={e => setExchange(e.target.value)}>
            <option value="NSE">NSE (India)</option>
            <option value="BSE">BSE (India)</option>
            <option value="NYSE">NYSE (USA)</option>
            <option value="NASDAQ">NASDAQ (USA)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Initial Capital (₹/$)</label>
          <input type="number" className="input w-full" value={capital}
            onChange={e => setCapital(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Start Date</label>
          <input type="date" className="input w-full" value={startDate}
            onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">End Date</label>
          <input type="date" className="input w-full" value={endDate}
            onChange={e => setEndDate(e.target.value)} />
        </div>

        {/* Strategy */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Strategy</label>
          <select className="input w-full" value={strategy}
            onChange={e => { setStrategy(e.target.value); setParams({}) }}>
            {STRATEGIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Strategy params */}
        {currentParams.map(p => (
          <div key={p.key}>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">{p.label}</label>
            <input type="number" className="input w-full" value={getParam(p.key, p.default)}
              onChange={e => setParams(prev => ({ ...prev, [p.key]: Number(e.target.value) }))} />
          </div>
        ))}

        <div className="lg:col-span-3 flex justify-end">
          <button onClick={handleRun} disabled={loading}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-60">
            <Play size={16} fill="currentColor" /> {loading ? 'Running…' : 'Run Backtest'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card border-danger/30 bg-danger/5 flex items-center gap-3">
          <AlertCircle size={18} className="text-danger flex-shrink-0" />
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {loading && (
        <div className="card text-center py-12">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Running backtest on historical data…</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Return', value: `${result.total_return_pct >= 0 ? '+' : ''}${result.total_return_pct.toFixed(2)}%`, color: isPositive ? 'text-success' : 'text-danger' },
              { label: 'CAGR', value: `${result.cagr_pct >= 0 ? '+' : ''}${result.cagr_pct.toFixed(2)}%`, color: result.cagr_pct >= 0 ? 'text-success' : 'text-danger' },
              { label: 'Sharpe Ratio', value: result.sharpe_ratio.toFixed(3), color: result.sharpe_ratio >= 1 ? 'text-success' : 'text-warning' },
              { label: 'Max Drawdown', value: `${result.max_drawdown_pct.toFixed(2)}%`, color: 'text-danger' },
              { label: 'Win Rate', value: `${result.win_rate_pct.toFixed(1)}%`, color: result.win_rate_pct >= 50 ? 'text-success' : 'text-warning' },
              { label: 'Total Trades', value: String(result.total_trades), color: 'text-white' },
              { label: 'Final Value', value: result.final_value.toLocaleString('en-IN', { maximumFractionDigits: 0 }), color: isPositive ? 'text-success' : 'text-danger' },
              { label: 'Initial Capital', value: result.initial_capital.toLocaleString('en-IN', { maximumFractionDigits: 0 }), color: 'text-white' },
            ].map(m => (
              <div key={m.label} className="card">
                <p className="text-xs text-slate-500">{m.label}</p>
                <p className={`text-xl font-bold mt-1 ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Equity Curve */}
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Equity Curve — {result.strategy}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={result.equity_curve}>
                <defs>
                  <linearGradient id="equity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false}
                  tickFormatter={v => v?.slice(0, 7)} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}K`} width={55} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [v.toLocaleString('en-IN', { maximumFractionDigits: 0 }), 'Portfolio Value']}
                />
                <Area type="monotone" dataKey="value" stroke={isPositive ? '#22c55e' : '#ef4444'}
                  strokeWidth={2} fill="url(#equity)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Trade Log */}
          {result.trades.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Recent Trades</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 border-b border-surface-border">
                      <th className="text-left pb-2">Date</th>
                      <th className="text-left pb-2">Action</th>
                      <th className="text-right pb-2">Price</th>
                      <th className="text-right pb-2">P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {result.trades.slice(-20).map((t, i) => (
                      <tr key={i} className="text-slate-300">
                        <td className="py-2">{t.date}</td>
                        <td className="py-2">
                          <span className={`font-medium ${t.action === 'BUY' ? 'text-success' : 'text-danger'}`}>
                            {t.action}
                          </span>
                        </td>
                        <td className="py-2 text-right font-mono">
                          {t.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className={`py-2 text-right font-mono ${t.pnl !== undefined ? (t.pnl >= 0 ? 'text-success' : 'text-danger') : 'text-slate-500'}`}>
                          {t.pnl !== undefined ? `${t.pnl >= 0 ? '+' : ''}${t.pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
