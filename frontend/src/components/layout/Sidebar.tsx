import { NavLink } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, BarChart2, BrainCircuit, Briefcase, Star, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import clsx from 'clsx'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/market', label: 'Market', icon: TrendingUp },
  { to: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { to: '/forecast', label: 'Forecast', icon: BarChart2 },
  { to: '/ai-insights', label: 'AI Insights', icon: BrainCircuit },
  { to: '/watchlist', label: 'Watchlist', icon: Star },
]

export default function Sidebar() {
  const { user, clearAuth } = useAuthStore()

  return (
    <aside className="w-64 min-h-screen bg-surface-card border-r border-surface-border flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <TrendingUp size={18} className="text-white" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">FinForesight</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-500/20 text-brand-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-surface-border">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name || user?.username}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={clearAuth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
