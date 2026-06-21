import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, TrendingUp, TrendingDown, Minus, ShieldAlert, Zap } from 'lucide-react'
import { marketService } from '../services/market'
import Card from '../components/ui/Card'
import ForecastChart from '../components/charts/ForecastChart'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import AIPanel from '../components/ui/AIPanel'

const HORIZONS = [7, 14, 30, 60, 90] as const

export default function ForecastPage() {
  const [ticker, setTicker]   = useState('AAPL')
  const [input, setInput]     = useState('AAPL')
  const [horizon, setHorizon] = useState<number>(30)

  const { data, isLoading, error } = useQuery({
    queryKey: ['forecast', ticker, horizon],
    queryFn:  () => marketService.getForecast(ticker, horizon),
    staleTime: 600_000,
  })

  function search(e: React.FormEvent) {
    e.preventDefault()
    setTicker(input.toUpperCase().trim())
  }

  const ai  = data?.ai_commentary as any
  const met = data?.metrics as any

  const TrendIcon = ai?.trend === 'Bullish'
    ? TrendingUp
    : ai?.trend === 'Bearish'
    ? TrendingDown
    : Minus

  const trendColor = ai?.trend === 'Bullish'
    ? 'text-green-400'
    : ai?.trend === 'Bearish'
    ? 'text-red-400'
    : 'text-yellow-400'

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Price Forecasting</h1>
          <p className="text-slate-400 text-sm mt-0.5">Powered by Claude AI · Analyzes 1 year of price history</p>
        </div>
        <form onSubmit={search} className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            className="px-4 py-2 bg-surface-card border border-surface-border rounded-lg text-white text-sm focus:outline-none focus:border-brand-500 w-36 uppercase"
            placeholder="TICKER" />
          <button type="submit"
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm flex items-center gap-1.5 transition-colors">
            <Search size={15} /> Forecast
          </button>
        </form>
      </div>

      {/* Horizon selector */}
      <Card>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm text-slate-400 font-medium">Forecast horizon:</span>
          <div className="flex gap-2">
            {HORIZONS.map(h => (
              <button key={h} onClick={() => setHorizon(h)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${horizon === h ? 'bg-brand-500 text-white' : 'bg-surface border border-surface-border text-slate-400 hover:text-white'}`}>
                {h}d
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* KPIs */}
      {data && met && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <p className="text-xs text-slate-400">Ticker</p>
            <p className="text-xl font-bold text-white mt-1">{data.ticker}</p>
          </div>
          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <p className="text-xs text-slate-400">Current Price</p>
            <p className="text-xl font-bold text-white mt-1">${met.current_price}</p>
          </div>
          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <p className="text-xs text-slate-400">AI Target ({horizon}d)</p>
            <p className="text-xl font-bold text-white mt-1">${met.target_price}</p>
          </div>
          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <p className="text-xs text-slate-400">Expected Move</p>
            <div className="mt-1">
              <Badge
                label={`${met.expected_move_pct >= 0 ? '+' : ''}${met.expected_move_pct}%`}
                variant={met.expected_move_pct >= 0 ? 'green' : 'red'}
              />
            </div>
          </div>
          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <p className="text-xs text-slate-400">AI Confidence</p>
            <p className="text-xl font-bold text-white mt-1">{met.confidence}%</p>
          </div>
        </div>
      )}

      {/* Chart */}
      <Card padding={false}>
        <div className="p-5 border-b border-surface-border flex items-center justify-between">
          <h2 className="font-semibold text-white">{ticker} — {horizon}-Day AI Forecast</h2>
          {ai?.trend && (
            <div className={`flex items-center gap-1.5 text-sm font-medium ${trendColor}`}>
              <TrendIcon size={16} />
              {ai.trend}
            </div>
          )}
        </div>
        <div className="p-4">
          {isLoading ? <Spinner /> : error ? (
            <p className="text-red-400 text-sm p-4">Failed to generate forecast. The ticker may be invalid or have insufficient history.</p>
          ) : data ? (
            <ForecastChart data={data} />
          ) : null}
        </div>
      </Card>

      {/* AI Commentary */}
      {ai && (
        <AIPanel title="Claude AI Forecast Analysis">
          <div className="space-y-5">
            <p className="text-white text-sm leading-relaxed">{ai.commentary}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Key price levels */}
              {ai.key_levels?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Key Price Levels</p>
                  <div className="space-y-1.5">
                    {ai.key_levels.map((lvl: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-gray-800/60 rounded-lg px-3 py-1.5">
                        <span className={`text-xs font-medium capitalize ${lvl.type === 'support' ? 'text-green-400' : 'text-red-400'}`}>
                          {lvl.type}
                        </span>
                        <span className="text-white text-sm font-mono">${lvl.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Catalysts & risks */}
              {ai.catalysts?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Zap size={11} /> Catalysts & Risks
                  </p>
                  <ul className="space-y-1.5">
                    {ai.catalysts.map((c: string, i: number) => (
                      <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5">
                        <ShieldAlert size={11} className="text-yellow-400 mt-0.5 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </AIPanel>
      )}
    </div>
  )
}
