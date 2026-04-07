import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { BookmarkPlus, TrendingUp, TrendingDown, ExternalLink, ChevronDown } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import api from '../lib/api'
import { formatPct, getChangeColor, formatNumber } from '../lib/utils'

const PERIODS = ['1mo', '3mo', '6mo', '1y', '2y', '5y']
const INTERVALS: Record<string, string> = { '1mo': '1d', '3mo': '1d', '6mo': '1d', '1y': '1d', '2y': '1wk', '5y': '1mo' }

export default function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>()
  const [searchParams] = useSearchParams()
  const exchange = searchParams.get('exchange') || 'NSE'
  const [period, setPeriod] = useState('1y')
  const [tab, setTab] = useState<'overview' | 'fundamentals' | 'technicals' | 'news'>('overview')
  const [quote, setQuote] = useState<Record<string, unknown>>({})
  const [history, setHistory] = useState<{ date: string; close: number }[]>([])
  const [fundamentals, setFundamentals] = useState<Record<string, unknown>>({})
  const [technicals, setTechnicals] = useState<Record<string, unknown>>({})
  const [news, setNews] = useState<{ title: string; link: string; source: string; published: string }[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!symbol) return
    const load = async () => {
      setLoading(true)
      try {
        const [q, h, f, t, n] = await Promise.all([
          api.get(`/stocks/${symbol}/quote?exchange=${exchange}`),
          api.get(`/stocks/${symbol}/history?exchange=${exchange}&period=${period}&interval=${INTERVALS[period]}`),
          api.get(`/stocks/${symbol}/fundamentals?exchange=${exchange}`),
          api.get(`/stocks/${symbol}/technicals?exchange=${exchange}`),
          api.get(`/stocks/news?symbol=${symbol}`),
        ])
        setQuote(q.data)
        setHistory(h.data)
        setFundamentals(f.data)
        setTechnicals(t.data)
        setNews(n.data)
      } catch { /* silent */ }
      setLoading(false)
    }
    load()
  }, [symbol, exchange, period])

  const price = Number(quote.price || 0)
  const changePct = Number(quote.change_pct || 0)
  const isUp = changePct >= 0
  const chartColor = isUp ? '#22c55e' : '#ef4444'
  const chartMin = history.length ? Math.min(...history.map(h => h.close)) * 0.995 : undefined
  const chartMax = history.length ? Math.max(...history.map(h => h.close)) * 1.005 : undefined

  if (loading) return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="card animate-pulse h-20 bg-surface-hover" />
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">{symbol}</h1>
              <span className="text-xs px-2 py-0.5 bg-surface-border rounded text-slate-400">{exchange}</span>
              <span className="text-xs px-2 py-0.5 bg-surface-border rounded text-slate-400">
                {String(fundamentals.sector || '')}
              </span>
            </div>
            <p className="text-slate-400 text-sm">{String(fundamentals.name || symbol)}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-3xl font-bold text-white">
                {price > 0 ? price.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'}
              </span>
              <span className={`flex items-center gap-1 text-base font-semibold ${getChangeColor(changePct)}`}>
                {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {formatPct(changePct)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/app/backtest?symbol=${symbol}&exchange=${exchange}`)}
              className="btn-ghost text-sm border border-surface-border flex items-center gap-2"
            >
              <TrendingUp size={15} /> Backtest
            </button>
            <button className="btn-primary text-sm flex items-center gap-2">
              <BookmarkPlus size={15} /> Watchlist
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Price Chart</h2>
          <div className="flex gap-1">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                  period === p ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-surface-hover'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={history} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false}
              tickFormatter={(v) => v?.slice(0, 7)} interval="preserveStartEnd" />
            <YAxis domain={[chartMin, chartMax]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false}
              tickFormatter={(v) => formatNumber(v)} width={60} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(v: number) => [v.toLocaleString('en-IN', { maximumFractionDigits: 2 }), 'Close']}
            />
            <Area type="monotone" dataKey="close" stroke={chartColor} strokeWidth={1.5}
              fill="url(#colorClose)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-border flex gap-1">
        {(['overview', 'fundamentals', 'technicals', 'news'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
              tab === t ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Market Cap', value: formatNumber(Number(fundamentals.market_cap)) },
            { label: 'P/E Ratio', value: fundamentals.pe_ratio ? Number(fundamentals.pe_ratio).toFixed(2) : 'N/A' },
            { label: 'EPS', value: fundamentals.eps ? Number(fundamentals.eps).toFixed(2) : 'N/A' },
            { label: 'Div Yield', value: fundamentals.dividend_yield ? `${(Number(fundamentals.dividend_yield) * 100).toFixed(2)}%` : 'N/A' },
            { label: '52W High', value: fundamentals['52w_high'] ? Number(fundamentals['52w_high']).toLocaleString() : 'N/A' },
            { label: '52W Low', value: fundamentals['52w_low'] ? Number(fundamentals['52w_low']).toLocaleString() : 'N/A' },
            { label: 'Beta', value: fundamentals.beta ? Number(fundamentals.beta).toFixed(2) : 'N/A' },
            { label: 'Analyst Target', value: fundamentals.target_price ? `₹${Number(fundamentals.target_price).toLocaleString()}` : 'N/A' },
          ].map(({ label, value }) => (
            <div key={label} className="card">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-base font-semibold text-white mt-1">{String(value)}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'fundamentals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card space-y-3">
            <h3 className="font-semibold text-white mb-2">Valuation</h3>
            {[
              ['P/E (TTM)', fundamentals.pe_ratio],
              ['Forward P/E', fundamentals.forward_pe],
              ['P/B Ratio', fundamentals.pb_ratio],
              ['P/S Ratio', fundamentals.ps_ratio],
              ['EV/EBITDA', 'N/A'],
            ].map(([label, val]) => (
              <div key={String(label)} className="flex justify-between text-sm">
                <span className="text-slate-400">{String(label)}</span>
                <span className="font-medium text-white">{val ? Number(val).toFixed(2) : 'N/A'}</span>
              </div>
            ))}
          </div>
          <div className="card space-y-3">
            <h3 className="font-semibold text-white mb-2">Profitability</h3>
            {[
              ['ROE', fundamentals.roe ? `${(Number(fundamentals.roe) * 100).toFixed(1)}%` : 'N/A'],
              ['ROA', fundamentals.roa ? `${(Number(fundamentals.roa) * 100).toFixed(1)}%` : 'N/A'],
              ['Gross Profit', formatNumber(Number(fundamentals.gross_profit))],
              ['Free Cash Flow', formatNumber(Number(fundamentals.free_cashflow))],
              ['Debt/Equity', fundamentals.debt_to_equity ? Number(fundamentals.debt_to_equity).toFixed(2) : 'N/A'],
            ].map(([label, val]) => (
              <div key={String(label)} className="flex justify-between text-sm">
                <span className="text-slate-400">{String(label)}</span>
                <span className="font-medium text-white">{String(val)}</span>
              </div>
            ))}
          </div>
          {fundamentals.description && (
            <div className="card md:col-span-2">
              <h3 className="font-semibold text-white mb-2">About</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{String(fundamentals.description)}</p>
              {fundamentals.website && (
                <a href={String(fundamentals.website)} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand-400 text-sm mt-2 hover:underline">
                  Visit website <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'technicals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card space-y-3">
            <h3 className="font-semibold text-white mb-2">Moving Averages</h3>
            {[
              ['SMA 20', technicals.sma20],
              ['SMA 50', technicals.sma50],
              ['SMA 200', technicals.sma200],
              ['EMA 12', technicals.ema12],
              ['EMA 26', technicals.ema26],
            ].map(([label, val]) => {
              const v = val ? Number(val) : null
              const isAbove = v && price > v
              return (
                <div key={String(label)} className="flex justify-between text-sm items-center">
                  <span className="text-slate-400">{String(label)}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{v ? v.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : 'N/A'}</span>
                    {v && <span className={`text-xs font-medium ${isAbove ? 'text-success' : 'text-danger'}`}>{isAbove ? '▲' : '▼'}</span>}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="card space-y-3">
            <h3 className="font-semibold text-white mb-2">Indicators</h3>
            {[
              ['RSI (14)', technicals.rsi, technicals.rsi ? (Number(technicals.rsi) > 70 ? 'Overbought' : Number(technicals.rsi) < 30 ? 'Oversold' : 'Neutral') : ''],
              ['MACD', technicals.macd, ''],
              ['MACD Signal', technicals.macd_signal, ''],
              ['BB Upper', technicals.bb_upper, ''],
              ['BB Lower', technicals.bb_lower, ''],
            ].map(([label, val, signal]) => (
              <div key={String(label)} className="flex justify-between text-sm items-center">
                <span className="text-slate-400">{String(label)}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{val ? Number(val).toFixed(2) : 'N/A'}</span>
                  {signal && <span className="text-xs text-slate-500">{String(signal)}</span>}
                </div>
              </div>
            ))}
          </div>
          {technicals.signal_summary && (
            <div className="card md:col-span-2">
              <h3 className="font-semibold text-white mb-3">Signal Summary</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(technicals.signal_summary as Record<string, string>).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 bg-surface-hover rounded-lg px-3 py-2">
                    <span className="text-xs text-slate-400 capitalize">{k.replace(/_/g, ' ')}</span>
                    <span className={`text-xs font-semibold capitalize ${v === 'bullish' ? 'text-success' : v === 'bearish' ? 'text-danger' : 'text-warning'}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'news' && (
        <div className="space-y-3">
          {news.slice(0, 15).map((n, i) => (
            <a key={i} href={n.link} target="_blank" rel="noopener noreferrer"
              className="card hover:border-slate-600 transition-colors block">
              <p className="text-sm font-medium text-white">{n.title}</p>
              <p className="text-xs text-slate-500 mt-1">{n.source} · {n.published?.slice(0, 16)}</p>
            </a>
          ))}
          {news.length === 0 && <p className="text-slate-500 text-sm text-center py-8">No news found</p>}
        </div>
      )}
    </div>
  )
}
