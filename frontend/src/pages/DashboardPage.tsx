import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import api from '../lib/api'
import { formatPct, getChangeColor, formatNumber } from '../lib/utils'

interface IndexData {
  name: string
  price: number
  change: number
  change_pct: number
}

interface NewsItem {
  title: string
  link: string
  published: string
  source: string
}

export default function DashboardPage() {
  const [indices, setIndices] = useState<Record<string, IndexData>>({})
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [mktRes, newsRes] = await Promise.all([
          api.get('/stocks/market-overview'),
          api.get('/stocks/news'),
        ])
        setIndices(mktRes.data)
        setNews(newsRes.data)
      } catch { /* silent */ }
      setLoading(false)
    }
    load()
  }, [])

  const indexEntries = Object.entries(indices)
  const indiaIndices = indexEntries.filter(([k]) => ['^NSEI', '^BSESN', '^NSEBANK', '^CNXMIDCAP'].includes(k))
  const usIndices = indexEntries.filter(([k]) => ['^GSPC', '^DJI', '^IXIC', '^RUT'].includes(k))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Market Overview</h1>
          <p className="text-slate-400 text-sm mt-0.5">Live indices · India + USA</p>
        </div>
        <button onClick={() => window.location.reload()} className="btn-ghost text-sm flex items-center gap-2">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-24 bg-surface-hover" />
          ))}
        </div>
      ) : (
        <>
          {/* India Indices */}
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">🇮🇳 India</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {indiaIndices.map(([sym, d]) => (
                <IndexCard key={sym} data={d} />
              ))}
            </div>
          </div>

          {/* US Indices */}
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">🇺🇸 USA</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {usIndices.map(([sym, d]) => (
                <IndexCard key={sym} data={d} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Stock Screener', desc: 'Filter by 20+ metrics', path: '/app/screener', color: 'from-blue-600/20 to-blue-900/10' },
          { label: 'Backtest', desc: 'Test trading strategies', path: '/app/backtest', color: 'from-purple-600/20 to-purple-900/10' },
          { label: 'Portfolio', desc: 'Track your P&L', path: '/app/portfolio', color: 'from-green-600/20 to-green-900/10' },
          { label: 'Watchlist', desc: 'Monitor your stocks', path: '/app/watchlist', color: 'from-orange-600/20 to-orange-900/10' },
        ].map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.path)}
            className={`card bg-gradient-to-br ${a.color} hover:scale-[1.02] transition-transform text-left`}
          >
            <p className="font-semibold text-white">{a.label}</p>
            <p className="text-xs text-slate-400 mt-1">{a.desc}</p>
          </button>
        ))}
      </div>

      {/* News */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Latest Market News</h2>
        <div className="space-y-3">
          {news.slice(0, 10).map((n, i) => (
            <a
              key={i}
              href={n.link}
              target="_blank"
              rel="noopener noreferrer"
              className="card hover:border-slate-600 transition-colors block"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white line-clamp-2">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{n.source} · {n.published?.slice(0, 16)}</p>
                </div>
                <TrendingUp size={16} className="text-slate-600 flex-shrink-0 mt-0.5" />
              </div>
            </a>
          ))}
          {news.length === 0 && !loading && (
            <p className="text-slate-500 text-sm text-center py-8">News feed temporarily unavailable</p>
          )}
        </div>
      </div>
    </div>
  )
}

function IndexCard({ data }: { data: IndexData }) {
  const isUp = data.change_pct >= 0
  return (
    <div className="card">
      <p className="text-xs text-slate-400 truncate">{data.name}</p>
      <p className="text-xl font-bold text-white mt-1">{formatNumber(data.price)}</p>
      <div className={`flex items-center gap-1 mt-1 ${getChangeColor(data.change_pct)}`}>
        {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        <span className="text-sm font-medium">{formatPct(data.change_pct)}</span>
      </div>
    </div>
  )
}
