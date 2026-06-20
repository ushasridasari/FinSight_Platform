import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Info } from 'lucide-react'
import { marketService } from '../services/market'
import Card from '../components/ui/Card'
import ForecastChart from '../components/charts/ForecastChart'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'

const HORIZONS = [7, 14, 30, 60, 90] as const

export default function ForecastPage() {
  const [ticker, setTicker]   = useState('AAPL')
  const [input, setInput]     = useState('AAPL')
  const [horizon, setHorizon] = useState<number>(30)

  const { data, isLoading, error } = useQuery({
    queryKey: ['forecast', ticker, horizon],
    queryFn: () => marketService.getForecast(ticker, horizon),
    staleTime: 600_000,
  })

  function search(e: React.FormEvent) {
    e.preventDefault()
    setTicker(input.toUpperCase().trim())
  }

  const lastForecast = data?.forecast[data.forecast.length - 1]
  const firstHist    = data?.historical[data.historical.length - 1]
  const priceDelta   = lastForecast && firstHist
    ? ((lastForecast.predicted - firstHist.close) / firstHist.close) * 100
    : null

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Price Forecasting</h1>
          <p className="text-slate-400 text-sm mt-0.5">Prophet + polynomial regression with confidence intervals</p>
        </div>
        <form onSubmit={search} className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            className="px-4 py-2 bg-surface-card border border-surface-border rounded-lg text-white text-sm focus:outline-none focus:border-brand-500 w-36"
            placeholder="TICKER" />
          <button type="submit" className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm flex items-center gap-1.5 transition-colors">
            <Search size={15} /> Forecast
          </button>
        </form>
      </div>

      {/* Horizon selector */}
      <Card>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm text-slate-400 font-medium">Forecast horizon:</span>
          <div className="flex gap-2">
            {HORIZONS.map((h) => (
              <button key={h} onClick={() => setHorizon(h)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${horizon === h ? 'bg-brand-500 text-white' : 'bg-surface border border-surface-border text-slate-400 hover:text-white'}`}>
                {h}d
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-auto">
            <Info size={13} />
            <span>Dashed line = forecast · Shaded = 80% confidence interval</span>
          </div>
        </div>
      </Card>

      {/* Summary KPIs */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <p className="text-xs text-slate-400">Ticker</p>
            <p className="text-xl font-bold text-white mt-1">{data.ticker}</p>
          </div>
          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <p className="text-xs text-slate-400">Model</p>
            <p className="text-base font-semibold text-white mt-1">{data.model}</p>
          </div>
          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <p className="text-xs text-slate-400">Predicted (end of horizon)</p>
            <p className="text-xl font-bold text-white mt-1">
              {lastForecast ? `$${lastForecast.predicted.toFixed(2)}` : '—'}
            </p>
          </div>
          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <p className="text-xs text-slate-400">Expected Move</p>
            <div className="mt-1">
              {priceDelta != null ? (
                <Badge label={`${priceDelta >= 0 ? '+' : ''}${priceDelta.toFixed(2)}%`}
                  variant={priceDelta >= 0 ? 'green' : 'red'} />
              ) : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <Card padding={false}>
        <div className="p-5 border-b border-surface-border">
          <h2 className="font-semibold text-white">{ticker} — {horizon}-Day Price Forecast</h2>
        </div>
        <div className="p-4">
          {isLoading ? <Spinner /> : error ? (
            <p className="text-red-400 text-sm p-4">Failed to generate forecast. The ticker may be invalid or have insufficient history.</p>
          ) : data ? (
            <ForecastChart data={data} />
          ) : null}
        </div>
      </Card>

      {/* Metrics */}
      {data?.metrics && (
        <Card>
          <h3 className="font-semibold text-white mb-4 text-sm">Model Metrics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(data.metrics).map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-slate-400">{k}</p>
                <p className="text-white font-mono text-sm mt-0.5">{String(v ?? '—')}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
