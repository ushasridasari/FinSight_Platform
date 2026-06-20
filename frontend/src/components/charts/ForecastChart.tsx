import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { ForecastResponse } from '../../types'
import { format, parseISO } from 'date-fns'

interface Props { data: ForecastResponse }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-3 text-xs shadow-lg space-y-1">
      <p className="text-slate-400">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === 'number' ? `$${p.value.toFixed(2)}` : '—'}
        </p>
      ))}
    </div>
  )
}

export default function ForecastChart({ data }: Props) {
  const hist = data.historical.slice(-60).map((d) => ({
    date: format(parseISO(d.date), 'MMM d'),
    actual: d.close,
    predicted: undefined,
    lower: undefined,
    upper: undefined,
  }))

  const fwd = data.forecast.map((d) => ({
    date: format(parseISO(d.date), 'MMM d'),
    actual: undefined,
    predicted: d.predicted,
    lower: d.lower_bound,
    upper: d.upper_bound,
  }))

  const combined = [...hist, ...fwd]

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={combined} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false}
          interval={Math.floor(combined.length / 8)} />
        <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false}
          width={60} tickFormatter={(v) => `$${v.toFixed(0)}`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
        <Area type="monotone" dataKey="upper" fill="url(#ciGrad)" stroke="transparent" name="Upper CI" />
        <Area type="monotone" dataKey="lower" fill="#0f172a" stroke="transparent" name="Lower CI" />
        <Line type="monotone" dataKey="actual" stroke="#27a269" strokeWidth={2} dot={false} name="Actual" connectNulls={false} />
        <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 3" dot={false} name="Forecast" connectNulls={false} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
