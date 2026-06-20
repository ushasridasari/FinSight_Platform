import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { marketService } from '../services/market'
import Card from '../components/ui/Card'
import PriceChart from '../components/charts/PriceChart'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import SentimentGauge from '../components/charts/SentimentGauge'
import AIPanel from '../components/ui/AIPanel'

const PERIODS = ['1mo', '3mo', '6mo', '1y', '2y', '5y'] as const

const riskBadge = (r: string) =>
  r === 'Low' ? 'green' : r === 'Medium' ? 'yellow' : 'red'

const recBadge = (r: string): 'green' | 'yellow' | 'red' | 'gray' =>
  r.includes('Buy') ? 'green' : r.includes('Sell') ? 'red' : r === 'Hold' ? 'yellow' : 'gray'

export default function MarketPage() {
  const [ticker, setTicker] = useState('AAPL')
  const [input, setInput]   = useState('AAPL')
  const [period, setPeriod] = useState<string>('1y')

  const { data: quote, isLoading: loadQuote } = useQuery({
    queryKey: ['quote', ticker],
    queryFn: () => marketService.getQuote(ticker),
    staleTime: 30_000,
  })

  const { data: history, isLoading: loadHist } = useQuery({
    queryKey: ['history', ticker, period],
    queryFn: () => marketService.getHistory(ticker, period),
    staleTime: 60_000,
  })

  const { data: risk, isLoading: loadRisk } = useQuery({
    queryKey: ['risk', ticker],
    queryFn: () => marketService.getRisk(ticker),
    staleTime: 300_000,
  })

  const { data: sentiment } = useQuery({
    queryKey: ['sentiment', ticker],
    queryFn: () => marketService.getSentiment(ticker),
    staleTime: 300_000,
  })

  // AI stock insight — auto-fetched with each ticker
  const { data: aiInsight, isLoading: loadAI } = useQuery({
    queryKey: ['ai-insight', ticker],
    queryFn: () => marketService.getAIInsight(ticker),
    staleTime: 600_000,
    retry: false,
  })

  function search(e: React.FormEvent) {
    e.preventDefault()
    setTicker(input.toUpperCase().trim())
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Stock Analysis</h1>
          <p className="text-slate-400 text-sm mt-0.5">Price · Risk · Sentiment · AI Insight</p>
        </div>
        <form onSubmit={search} className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            className="px-4 py-2 bg-surface-card border border-surface-border rounded-lg text-white text-sm focus:outline-none focus:border-brand-500 w-36"
            placeholder="TICKER" />
          <button type="submit"
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm flex items-center gap-1.5 transition-colors">
            <Search size={15} /> Search
          </button>
        </form>
      </div>

      {/* Quote header */}
      {loadQuote ? <Spinner /> : quote && (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-white">${quote.price.toFixed(2)}</h2>
                <Badge label={`${quote.change_pct >= 0 ? '+' : ''}${quote.change_pct.toFixed(2)}%`}
                  variant={quote.change_pct >= 0 ? 'green' : 'red'} />
              </div>
              <p className="text-slate-400 mt-1">{quote.name} · <span className="font-mono text-brand-400">{quote.ticker}</span></p>
              {quote.sector && <p className="text-xs text-slate-500 mt-0.5">{quote.sector}</p>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {[
                ['52W High', quote.week_52_high ? `$${quote.week_52_high.toFixed(2)}` : '—'],
                ['52W Low',  quote.week_52_low  ? `$${quote.week_52_low.toFixed(2)}`  : '—'],
                ['P/E',      quote.pe_ratio     ? quote.pe_ratio.toFixed(1)            : '—'],
                ['Mkt Cap',  quote.market_cap   ? `$${(quote.market_cap / 1e9).toFixed(1)}B` : '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-slate-500 text-xs">{k}</p>
                  <p className="text-white font-semibold mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* AI Stock Insight — auto-generated */}
      <AIPanel title={`AI Analysis — ${ticker}`} loading={loadAI}>
        {loadAI ? (
          <p className="text-slate-400 text-sm">Analyzing {ticker} with Claude…</p>
        ) : aiInsight ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge label={aiInsight.recommendation} variant={recBadge(aiInsight.recommendation)} />
              <Badge label={`Risk: ${aiInsight.risk_level}`} variant={riskBadge(aiInsight.risk_level) as any} />
            </div>
            <p className="text-white text-sm leading-relaxed">{aiInsight.insight}</p>
            {aiInsight.key_factors.length > 0 && (
              <ul className="space-y-1">
                {aiInsight.key_factors.map((f, i) => (
                  <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5">
                    <span className="text-brand-400 mt-0.5">·</span>{f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">AI insight unavailable — check ANTHROPIC_API_KEY.</p>
        )}
      </AIPanel>

      {/* Price chart */}
      <Card padding={false}>
        <div className="p-5 border-b border-surface-border flex items-center justify-between">
          <h2 className="font-semibold text-white">Price History</h2>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${period === p ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4">
          {loadHist ? <Spinner /> : history && <PriceChart data={history} height={280} />}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk metrics */}
        <Card padding={false}>
          <div className="p-5 border-b border-surface-border">
            <h2 className="font-semibold text-white">Risk Metrics (1Y)</h2>
          </div>
          {loadRisk ? <Spinner /> : risk ? (
            <div className="grid grid-cols-2 gap-4 p-5">
              {[
                { label: 'Sharpe Ratio',    value: risk.sharpe_ratio.toFixed(3) },
                { label: 'Ann. Return',     value: `${risk.annualized_return.toFixed(2)}%` },
                { label: 'Ann. Volatility', value: `${risk.annualized_volatility.toFixed(2)}%` },
                { label: 'Max Drawdown',    value: `${risk.max_drawdown.toFixed(2)}%` },
                { label: 'VaR 95%',         value: `${risk.var_95.toFixed(2)}%` },
                { label: 'VaR 99%',         value: `${risk.var_99.toFixed(2)}%` },
                { label: 'Beta',            value: risk.beta != null ? risk.beta.toFixed(3) : '—' },
                { label: 'Alpha',           value: risk.alpha != null ? `${risk.alpha.toFixed(2)}%` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface/50 rounded-lg px-4 py-3">
                  <p className="text-slate-400 text-xs">{label}</p>
                  <p className="text-white font-semibold text-lg mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </Card>

        {/* Sentiment */}
        <Card padding={false}>
          <div className="p-5 border-b border-surface-border">
            <h2 className="font-semibold text-white">News Sentiment</h2>
          </div>
          <div className="p-5 flex items-center justify-center">
            {sentiment ? <SentimentGauge data={sentiment} /> : <Spinner />}
          </div>
          {sentiment && (
            <div className="px-5 pb-5">
              <p className="text-xs text-slate-500 text-center">Based on {sentiment.headline_count} recent headlines</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
