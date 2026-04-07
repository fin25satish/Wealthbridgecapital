import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import StockDetailPage from './pages/StockDetailPage'
import ScreenerPage from './pages/ScreenerPage'
import BacktestPage from './pages/BacktestPage'
import PortfolioPage from './pages/PortfolioPage'
import WatchlistPage from './pages/WatchlistPage'
import NewsPage from './pages/NewsPage'
import ComparePage from './pages/ComparePage'
import AlertsPage from './pages/AlertsPage'
import SettingsPage from './pages/SettingsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const initAuth = useAuthStore((s) => s.initAuth)

  useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="stock/:symbol" element={<StockDetailPage />} />
          <Route path="screener" element={<ScreenerPage />} />
          <Route path="backtest" element={<BacktestPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="watchlist" element={<WatchlistPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
