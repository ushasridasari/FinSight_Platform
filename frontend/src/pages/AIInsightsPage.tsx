import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { BrainCircuit, Search, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import toast from 'react-hot-toast'
import { marketService } from '../services/market'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import type { AIInsightResponse } from '../types'

const SUGGESTIONS = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'META']

function RecommendationIcon({ rec }: { rec: string }) {
  if (rec.includes('Buy'))  return <TrendingUp  className="text-brand-400" size={20} />
  if (rec.includes('Sell')) return <TrendingDown className="text-red-400"   size={20} />
  return <Minus className="text-yellow-400" size={20} />
}

function riskVariant(r: string): 'green' | 'yellow' | 'red' {
  if (r === 'Low') return 'green'
  if (r === 'Medium') return 'yellow'
  return 'red'
}

function recVariant(r: string): 'green' | 'yellow' | 'red' | 'gray' {
  if (r.includes('Buy'))  return 'green'
  if (r.includes('Sell')) return 'red'
  if (r === 'Hold')       return 'yellow'
  return 'gray'
}

export default function AIInsightsPage() {
  const [ticker,  setTicker]  = useState('')
  const [context, setContext] = useState('')
  const [result,  setResult]  = useState<AIInsightResponse | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: ({ t, c }: { t: string; c: string }) => marketService.getAIInsight(t, c),
    onSuccess: (data) => setResult(data),
    onError: () => toast.error('Failed to generate insight'),
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!ticker.trim()) { toast.error('Enter a ticker'); return }
    mutate({ t: ticker.toUpperCase().trim(), c: context })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
          <BrainCircuit size={22} className="text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">AI Market Insights</h1>
          <p className="text-slate-400 text-sm mt-0.5">Powered by Claude · Synthesizes price, risk, and sentiment signals</p>
        </div>
      </div>

      {/* Input */}
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Ticker Symbol</label>
              <input value={ticker} onChange={(e) => setTicker(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-surface-border rounded-lg text-white text-sm focus:outline-none focus:border-brand-500"
                placeholder="e.g. NVDA" />
            </div>
            <div className="flex-[3] min-w-[200px]">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Additional Context (optional)</label>
              <input value={context} onChange={(e) => setContext(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-surface-border rounded-lg text-white text-sm focus:outline-none focus:border-brand-500"
                placeholder="e.g. Considering a 6-month hold, focus on earnings risk" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={isPending}
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold rounded-lg text-sm flex items-center gap-2 transition-colors">
              <Search size={15} /> {isPending ? 'Analyzing…' : 'Generate Insight'}
            </button>
            <div className="flex gap-2 flex-wrap">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setTicker(s)}
                  className="px-2.5 py-1 rounded-full text-xs bg-surface border border-surface-border text-slate-400 hover:text-white hover:border-brand-500 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </form>
      </Card>

      {/* Loading state */}
      {isPending && (
        <Card>
          <div className="flex items-center gap-4 py-4">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <div>
              <p className="text-white font-medium">Analyzing {ticker.toUpperCase()}…</p>
              <p className="text-slate-400 text-sm mt-0.5">Fetching price data, computing risk metrics, and running sentiment analysis</p>
            </div>
          </div>
        </Card>
      )}

      {/* Result */}
      {result && !isPending && (
        <div className="space-y-4">
          {/* Header */}
          <Card>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <RecommendationIcon rec={result.recommendation} />
                <div>
                  <p className="text-xs text-slate-400">AI Recommendation for</p>
                  <p className="text-xl font-bold text-white">{result.ticker}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge label={result.recommendation} variant={recVariant(result.recommendation)} />
                <Badge label={`Risk: ${result.risk_level}`} variant={riskVariant(result.risk_level)} />
              </div>
            </div>
          </Card>

          {/* Insight */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Analysis</h3>
            <p className="text-white leading-relaxed">{result.insight}</p>
          </Card>

          {/* Key factors */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Key Factors</h3>
            <ul className="space-y-2">
              {result.key_factors.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-slate-300 text-sm">{f}</span>
                </li>
              ))}
            </ul>
          </Card>

          <p className="text-xs text-slate-600 text-center">
            AI-generated insights are for educational purposes only and do not constitute financial advice.
          </p>
        </div>
      )}
    </div>
  )
}
