import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { OHLCV } from '../../types'
import { format, parseISO } from 'date-fns'

interface Props {
  data: OHLCV[]
  height?: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-3 text-xs shadow-lg">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-white font-semibold">${Number(payload[0].value).toFixed(2)}</p>
    </div>
  )
}

export default function PriceChart({ data, height = 240 }: Props) {
  const formatted = data.map((d) => ({
    date: format(parseISO(d.date), 'MMM d'),
    close: d.close,
  }))

  const first = formatted[0]?.close ?? 0
  const last = formatted[formatted.length - 1]?.close ?? 0
  const isUp = last >= first

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={isUp ? '#27a269' : '#ef4444'} stopOpacity={0.3} />
            <stop offset="95%" stopColor={isUp ? '#27a269' : '#ef4444'} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} width={60}
          tickFormatter={(v) => `$${v.toFixed(0)}`} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="close" stroke={isUp ? '#27a269' : '#ef4444'}
          strokeWidth={2} fill="url(#priceGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
