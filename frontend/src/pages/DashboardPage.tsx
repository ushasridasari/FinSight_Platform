import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Newspaper, Eye } from 'lucide-react'
import { marketService } from '../services/market'
import KPICard from '../components/ui/KPICard'
import Card from '../components/ui/Card'
import PriceChart from '../components/charts/PriceChart'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import AIPanel from '../components/ui/AIPanel'

const INDEX_TICKERS = ['SPY', 'QQQ', 'DIA', 'IWM']

const moodColor: Record<string, string> = {
  'Risk-On':  'text-brand-400',
  'Risk-Off': 'text-red-400',
  'Cautious': 'text-yellow-400',
  'Mixed':    'text-blue-400',
}

export default function DashboardPage() {
  const { data: movers, isLoading: loadMovers } = useQuery({
    queryKey: ['movers'],
    queryFn: marketService.getMovers,
    staleTime: 60_000,
  })

  const { data: indices } = useQuery({
    queryKey: ['indices'],
    queryFn: () => marketService.getQuotes(INDEX_TICKERS),
    staleTime: 60_000,
  })

  const { data: spyHistory } = useQuery({
    queryKey: ['spy-history'],
    queryFn: () => marketService.getHistory('SPY', '3mo'),
    staleTime: 300_000,
  })

  // AI daily market summary
  const { data: aiSummary, isLoading: loadAI } = useQuery({
    queryKey: ['ai-market-summary'],
    queryFn: marketService.getMarketSummary,
    staleTime: 600_000,
    retry: false,
  })

  const gainers = movers?.gainers ?? []
  const losers  = movers?.losers  ?? []

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Market Overview</h1>
        <p className="text-slate-400 text-sm mt-0.5">Real-time snapshot · AI-powered briefing</p>
      </div>

      {/* AI Daily Briefing */}
      <AIPanel title="AI Daily Market Briefing" loading={loadAI}>
        {loadAI ? (
          <p className="text-slate-400 text-sm">Generating today's market analysis…</p>
        ) : aiSummary ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <p className="text-white font-medium text-base leading-relaxed flex-1">{aiSummary.headline}</p>
              <span className={`text-sm font-bold ${moodColor[aiSummary.market_mood] ?? 'text-slate-300'}`}>
                {aiSummary.market_mood}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Key themes */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Newspaper size={11} /> Key Themes
                </p>
                <ul className="space-y-1">
                  {(aiSummary.key_themes ?? []).map((t: string, i: number) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-1.5">
                      <span className="text-brand-400 mt-0.5">·</span>{t}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sector outlook */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sector Outlook</p>
                <div className="space-y-1.5">
                  {(aiSummary.sector_outlook ?? []).slice(0, 4).map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">{s.sector}</span>
                      <Badge label={s.outlook}
                        variant={s.outlook === 'Bullish' ? 'green' : s.outlook === 'Bearish' ? 'red' : 'yellow'} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Watch today */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Eye size={11} /> Watch Today
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(aiSummary.watch_today ?? []).map((w: string, i: number) => (
                    <Badge key={i} label={w} variant="blue" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">AI summary unavailable — check your ANTHROPIC_API_KEY.</p>
        )}
      </AIPanel>

      {/* Index KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(indices ?? []).map((q) => (
          <KPICard
            key={q.ticker}
            title={q.ticker}
            value={`$${q.price.toFixed(2)}`}
            sub={q.name}
            trend={q.change_pct >= 0 ? 'up' : 'down'}
            trendValue={`${q.change_pct >= 0 ? '+' : ''}${q.change_pct.toFixed(2)}% today`}
            icon={q.change_pct >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* S&P 500 Chart */}
        <Card className="lg:col-span-2" padding={false}>
          <div className="p-5 border-b border-surface-border">
            <h2 className="font-semibold text-white">S&P 500 (SPY) — 3 Months</h2>
          </div>
          <div className="p-4">
            {spyHistory ? <PriceChart data={spyHistory} height={260} /> : <Spinner />}
          </div>
        </Card>

        {/* Movers */}
        <Card padding={false}>
          <div className="p-5 border-b border-surface-border">
            <h2 className="font-semibold text-white">Today's Movers</h2>
          </div>
          {loadMovers ? <Spinner /> : (
            <div className="divide-y divide-surface-border">
              <div className="px-5 py-3">
                <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-2">Top Gainers</p>
                {gainers.map((q) => (
                  <div key={q.ticker} className="flex items-center justify-between py-1.5">
                    <div>
                      <p className="text-sm font-medium text-white">{q.ticker}</p>
                      <p className="text-xs text-slate-500">${q.price.toFixed(2)}</p>
                    </div>
                    <Badge label={`+${q.change_pct.toFixed(2)}%`} variant="green" />
                  </div>
                ))}
              </div>
              <div className="px-5 py-3">
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Top Losers</p>
                {losers.map((q) => (
                  <div key={q.ticker} className="flex items-center justify-between py-1.5">
                    <div>
                      <p className="text-sm font-medium text-white">{q.ticker}</p>
                      <p className="text-xs text-slate-500">${q.price.toFixed(2)}</p>
                    </div>
                    <Badge label={`${q.change_pct.toFixed(2)}%`} variant="red" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Quotes table */}
      <Card padding={false}>
        <div className="p-5 border-b border-surface-border">
          <h2 className="font-semibold text-white">Notable Stocks</h2>
        </div>
        {loadMovers ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-surface-border">
                  {['Ticker', 'Name', 'Price', 'Change', '% Change', 'Volume', 'Sector'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {(movers?.all ?? []).map((q) => (
                  <tr key={q.ticker} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3 font-mono font-semibold text-white">{q.ticker}</td>
                    <td className="px-5 py-3 text-slate-300 max-w-[180px] truncate">{q.name}</td>
                    <td className="px-5 py-3 font-semibold text-white">${q.price.toFixed(2)}</td>
                    <td className={`px-5 py-3 font-medium ${q.change >= 0 ? 'text-brand-400' : 'text-red-400'}`}>
                      {q.change >= 0 ? '+' : ''}{q.change.toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge label={`${q.change_pct >= 0 ? '+' : ''}${q.change_pct.toFixed(2)}%`}
                        variant={q.change_pct >= 0 ? 'green' : 'red'} />
                    </td>
                    <td className="px-5 py-3 text-slate-400 font-mono text-xs">{(q.volume / 1e6).toFixed(1)}M</td>
                    <td className="px-5 py-3 text-slate-400">{q.sector ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
