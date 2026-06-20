import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AppLayout from './components/layout/AppLayout'
import LoginPage      from './pages/LoginPage'
import RegisterPage   from './pages/RegisterPage'
import DashboardPage  from './pages/DashboardPage'
import MarketPage     from './pages/MarketPage'
import PortfolioPage  from './pages/PortfolioPage'
import ForecastPage   from './pages/ForecastPage'
import AIInsightsPage from './pages/AIInsightsPage'
import WatchlistPage  from './pages/WatchlistPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route path="/"            element={<DashboardPage />} />
        <Route path="/market"      element={<MarketPage />} />
        <Route path="/portfolio"   element={<PortfolioPage />} />
        <Route path="/forecast"    element={<ForecastPage />} />
        <Route path="/ai-insights" element={<AIInsightsPage />} />
        <Route path="/watchlist"   element={<WatchlistPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
