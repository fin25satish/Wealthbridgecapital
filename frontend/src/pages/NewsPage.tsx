import { useEffect, useState } from 'react'
import { Newspaper, ExternalLink, RefreshCw } from 'lucide-react'
import api from '../lib/api'

interface NewsItem {
  title: string
  link: string
  source: string
  published: string
  summary?: string
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [symbol, setSymbol] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchNews = async (sym?: string) => {
    setLoading(true)
    try {
      const url = sym ? `/stocks/news?symbol=${sym}` : '/stocks/news'
      const { data } = await api.get(url)
      setNews(data)
    } catch { /* silent */ }
    setLoading(false)
  }

  useEffect(() => { fetchNews() }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Newspaper size={22} className="text-brand-400" /> Market News
        </h1>
        <div className="flex gap-2">
          <input className="input text-sm w-40 uppercase" placeholder="Filter by symbol…"
            value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} />
          <button onClick={() => fetchNews(symbol || undefined)}
            className="btn-primary text-sm flex items-center gap-2">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Fetching latest news…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {news.slice(0, 30).map((n, i) => (
            <a key={i} href={n.link} target="_blank" rel="noopener noreferrer"
              className="card hover:border-slate-600 transition-colors flex flex-col gap-2 group">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors leading-snug">
                  {n.title}
                </p>
                <ExternalLink size={13} className="text-slate-600 flex-shrink-0 mt-0.5" />
              </div>
              {n.summary && (
                <p className="text-xs text-slate-500 line-clamp-2">{n.summary}</p>
              )}
              <p className="text-xs text-slate-600 mt-auto">
                {n.source} · {n.published?.slice(0, 16)}
              </p>
            </a>
          ))}
          {news.length === 0 && (
            <div className="col-span-2 text-center py-16 text-slate-500">
              <Newspaper size={36} className="mx-auto mb-3 opacity-30" />
              <p>No news found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
