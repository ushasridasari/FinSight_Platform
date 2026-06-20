import clsx from 'clsx'
import { ReactNode } from 'react'

interface Props {
  title: string
  value: string | number
  sub?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

export default function KPICard({ title, value, sub, icon, trend, trendValue }: Props) {
  const trendColor = trend === 'up' ? 'text-brand-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400 font-medium">{title}</span>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <div>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {trendValue && (
        <span className={clsx('text-xs font-medium', trendColor)}>{trendValue}</span>
      )}
    </div>
  )
}
