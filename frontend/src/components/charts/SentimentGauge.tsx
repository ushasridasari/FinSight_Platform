import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import type { SentimentResult } from '../../types'
import clsx from 'clsx'

interface Props { data: SentimentResult }

export default function SentimentGauge({ data }: Props) {
  const score = ((data.composite_score + 1) / 2) * 100  // normalize -1..1 to 0..100
  const color = data.label === 'Bullish' ? '#27a269' : data.label === 'Bearish' ? '#ef4444' : '#f59e0b'

  const gaugeData = [{ name: 'Sentiment', value: score, fill: color }]

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%"
            barSize={10} data={gaugeData} startAngle={180} endAngle={0}>
            <RadialBar dataKey="value" cornerRadius={5} background={{ fill: '#334155' }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center mt-4">
          <span className="text-xl font-bold text-white">{data.composite_score.toFixed(2)}</span>
          <span className={clsx('text-xs font-semibold mt-0.5',
            data.label === 'Bullish' ? 'text-brand-400' : data.label === 'Bearish' ? 'text-red-400' : 'text-yellow-400'
          )}>{data.label}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center text-xs w-full">
        <div><p className="text-brand-400 font-semibold">{(data.positive * 100).toFixed(0)}%</p><p className="text-slate-500">Positive</p></div>
        <div><p className="text-slate-400 font-semibold">{(data.neutral * 100).toFixed(0)}%</p><p className="text-slate-500">Neutral</p></div>
        <div><p className="text-red-400 font-semibold">{(data.negative * 100).toFixed(0)}%</p><p className="text-slate-500">Negative</p></div>
      </div>
    </div>
  )
}
