import { useNavigate } from 'react-router-dom'
import { TrendingUp, BarChart2, FlaskConical, Briefcase, Globe, ShieldCheck, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const features = [
  { icon: Globe, title: 'India + USA Markets', desc: 'NSE, BSE, NYSE & NASDAQ data unified in one dashboard.' },
  { icon: BarChart2, title: 'Stock Screener', desc: 'Filter by P/E, market cap, sector, 52w high/low and more.' },
  { icon: FlaskConical, title: 'Backtesting Engine', desc: 'Test SMA, RSI, Bollinger and momentum strategies on real data.' },
  { icon: Briefcase, title: 'Portfolio Tracker', desc: 'Track P&L, sector allocation and live performance.' },
  { icon: TrendingUp, title: 'Technical Analysis', desc: 'RSI, MACD, Bollinger Bands, SMA/EMA on interactive charts.' },
  { icon: ShieldCheck, title: 'AI Stock Scoring', desc: 'Composite scores from fundamentals, technicals & sentiment.' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg">InvestIQ</span>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button onClick={() => navigate('/app')} className="btn-primary flex items-center gap-2">
              Go to Dashboard <ArrowRight size={16} />
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="btn-ghost text-sm">Sign In</button>
              <button onClick={() => navigate('/register')} className="btn-primary text-sm">Get Started</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-600/10 border border-brand-600/30 text-brand-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
          Live India + USA Market Data
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
          Research. Backtest.{' '}
          <span className="bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">
            Invest Smarter.
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          A professional investment research platform aggregating stocks from NSE, BSE, NYSE and NASDAQ —
          with backtesting, AI scoring, portfolio tracking, and real-time news sentiment.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={() => navigate(isAuthenticated ? '/app' : '/register')}
            className="btn-primary text-base px-6 py-3 flex items-center gap-2"
          >
            Start for Free <ArrowRight size={18} />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="btn-ghost text-base px-6 py-3 border border-slate-700"
          >
            Sign In
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need to invest confidently</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card hover:border-brand-600/40 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-brand-600/10 flex items-center justify-center mb-4 group-hover:bg-brand-600/20 transition-colors">
                <f.icon size={20} className="text-brand-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <div className="card border-brand-600/30 bg-gradient-to-br from-brand-900/30 to-surface-card p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to invest smarter?</h2>
          <p className="text-slate-400 mb-8">Join thousands of investors using InvestIQ to research and track their investments.</p>
          <button onClick={() => navigate('/register')} className="btn-primary text-base px-8 py-3">
            Create Free Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
        <p>© 2024 InvestIQ. Built for India + USA markets. Not financial advice.</p>
      </footer>
    </div>
  )
}
