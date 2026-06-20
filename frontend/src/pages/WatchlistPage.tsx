import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, Plus, Trash2, TrendingUp, TrendingDown, BrainCircuit } from 'lucide-react'
import toast from 'react-hot-toast'
import { portfolioService } from '../services/portfolio'
import { marketService } from '../services/market'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import AIPanel from '../components/ui/AIPanel'

const actionVariant = (a: string): 'green' | 'yellow' | 'red' | 'gray' =>
  a === 'Buy' ? 'green' : a === 'Sell' ? 'red' : a === 'Hold' ? 'yellow' : 'gray'

const labelVariant = (l: string): 'green' | 'red' | 'yellow' | 'gray' =>
  l === 'Bullish' ? 'green' : l === 'Bearish' ? 'red' : 'yellow'

export default function WatchlistPage() {
  const qc = useQueryClient()
  const [input,  setInput]  = useState('')
  const [showAI, setShowAI] = useState(false)

  const { data: watchlist, isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: portfolioService.getWatchlist,
  })

  const tickers = (watchlist ?? []).map((w) => w.ticker)

  const { data: quotes } = useQuery({
    queryKey: ['wl-quotes', tickers.join(',')],
    queryFn: () => tickers.length ? marketService.getQuotes(tickers) : Promise.resolve([]),
    enabled: tickers.length > 0,
    staleTime: 30_000,
  })

  // AI batch scoring
  const { data: aiScores, isLoading: loadAI } = useQuery({
    queryKey: ['wl-ai-scores', tickers.join(',')],
    queryFn: () => marketService.getWatchlistScores(tickers),
    enabled: showAI && tickers.length > 0,
    staleTime: 600_000,
    retry: false,
  })

  const add = useMutation({
    mutationFn: (ticker: string) => portfolioService.addToWatchlist(ticker),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['watchlist'] }); setInput('') },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to add'),
  })

  const remove = useMutation({
    mutationFn: portfolioService.removeFromWatchlist,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  const quoteMap  = Object.fromEntries((quotes  ?? []).map((q) => [q.ticker, q]))
  const scoreMap  = Object.fromEntries((aiScores ?? []).map((s: any) => [s.ticker, s]))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Star size={22} className="text-yellow-400" />
          <h1 className="text-2xl font-bold text-white">Watchlist</h1>
        </div>
        {tickers.length > 0 && (
          <button onClick={() => setShowAI((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-500/40 text-brand-400 hover:bg-brand-500/10 text-sm font-medium transition-colors">
            <BrainCircuit size={15} />
            {showAI ? 'Hide AI Scores' : 'AI Score All'}
          </button>
        )}
      </div>

      {/* Add ticker */}
      <Card>
        <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) add.mutate(input.trim().toUpperCase()) }}
          className="flex gap-3">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-surface border border-surface-border rounded-lg text-white text-sm focus:outline-none focus:border-brand-500"
            placeholder="Add ticker e.g. GOOG" />
          <button type="submit" disabled={add.isPending}
            className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors">
            <Plus size={15} /> Add
          </button>
        </form>
      </Card>

      {/* AI scoring panel */}
      {showAI && tickers.length > 0 && (
        <AIPanel title="AI Watchlist Scoring" loading={loadAI}>
          {loadAI ? (
            <p className="text-slate-400 text-sm">Claude is scoring all {tickers.length} tickers…</p>
          ) : aiScores && aiScores.length > 0 ? (
            <div className="space-y-2">
              {(aiScores as any[]).map((s) => (
                <div key={s.ticker} className="flex items-center gap-4 bg-surface/50 rounded-lg px-4 py-3">
                  <span className="font-mono font-bold text-white w-14">{s.ticker}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-bold text-white">{s.score}</span>
                    <span className="text-slate-400 text-xs">/10</span>
                  </div>
                  <Badge label={s.label}  variant={labelVariant(s.label)} />
                  <Badge label={s.action} variant={actionVariant(s.action)} />
                  <span className="text-slate-300 text-xs flex-1">{s.reason}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">AI scoring unavailable — check ANTHROPIC_API_KEY.</p>
          )}
        </AIPanel>
      )}

      {/* Watchlist table */}
      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          {tickers.length === 0 ? (
            <p className="text-slate-400 text-sm py-12 text-center">Your watchlist is empty — add a ticker above</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-surface-border">
                  {['Ticker', 'Name', 'Price', 'Change', '% Change', '52W High', '52W Low', 'Volume', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {(watchlist ?? []).map((w) => {
                  const q = quoteMap[w.ticker]
                  return (
                    <tr key={w.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-white">{w.ticker}</td>
                      <td className="px-5 py-3 text-slate-300 max-w-[160px] truncate">{q?.name ?? '—'}</td>
                      <td className="px-5 py-3 font-semibold text-white">{q ? `$${q.price.toFixed(2)}` : '—'}</td>
                      <td className={`px-5 py-3 font-medium ${!q ? '' : q.change >= 0 ? 'text-brand-400' : 'text-red-400'}`}>
                        {q ? (
                          <span className="flex items-center gap-1">
                            {q.change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                            {q.change >= 0 ? '+' : ''}{q.change.toFixed(2)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        {q ? <Badge label={`${q.change_pct >= 0 ? '+' : ''}${q.change_pct.toFixed(2)}%`}
                          variant={q.change_pct >= 0 ? 'green' : 'red'} /> : '—'}
                      </td>
                      <td className="px-5 py-3 text-slate-400">{q?.week_52_high ? `$${q.week_52_high.toFixed(2)}` : '—'}</td>
                      <td className="px-5 py-3 text-slate-400">{q?.week_52_low  ? `$${q.week_52_low.toFixed(2)}`  : '—'}</td>
                      <td className="px-5 py-3 text-slate-400 font-mono text-xs">{q ? `${(q.volume / 1e6).toFixed(1)}M` : '—'}</td>
                      <td className="px-5 py-3">
                        <button onClick={() => remove.mutate(w.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  )
}
