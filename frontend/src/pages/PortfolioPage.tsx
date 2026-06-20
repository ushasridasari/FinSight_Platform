import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, RefreshCw, BrainCircuit } from 'lucide-react'
import toast from 'react-hot-toast'
import { portfolioService } from '../services/portfolio'
import { marketService } from '../services/market'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import AllocationChart from '../components/charts/AllocationChart'
import AIPanel from '../components/ui/AIPanel'
import type { PortfolioValuation } from '../types'

const healthColor: Record<string, string> = {
  Excellent: 'text-brand-400',
  Good:      'text-blue-400',
  Fair:      'text-yellow-400',
  Poor:      'text-red-400',
}

const actionVariant = (a: string): 'green' | 'red' | 'yellow' | 'gray' =>
  a === 'Buy more' ? 'green' : a === 'Trim' || a === 'Exit' ? 'red' : a === 'Hold' ? 'yellow' : 'gray'

export default function PortfolioPage() {
  const qc = useQueryClient()
  const [newPortName,     setNewPortName]     = useState('')
  const [selectedId,      setSelectedId]      = useState<number | null>(null)
  const [showAddHolding,  setShowAddHolding]  = useState(false)
  const [showAI,          setShowAI]          = useState(false)
  const [holding, setHolding] = useState({ ticker: '', shares: '', avg_cost: '', sector: '' })

  const { data: portfolios, isLoading } = useQuery({
    queryKey: ['portfolios'],
    queryFn: portfolioService.list,
  })

  const { data: valuation, isLoading: loadVal } = useQuery({
    queryKey: ['valuation', selectedId],
    queryFn: () => portfolioService.getValuation(selectedId!),
    enabled: selectedId != null,
    staleTime: 30_000,
  })

  const val: PortfolioValuation | undefined = valuation as PortfolioValuation | undefined

  // AI portfolio health — triggered when user clicks "AI Analysis"
  const { data: aiHealth, isLoading: loadAI } = useQuery({
    queryKey: ['portfolio-ai', selectedId],
    queryFn: () => marketService.getPortfolioAIAnalysis(val!.holdings),
    enabled: showAI && val != null && val.holdings.length > 0,
    staleTime: 600_000,
    retry: false,
  })

  const createPort = useMutation({
    mutationFn: (name: string) => portfolioService.create(name),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolios'] }); setNewPortName('') },
    onError: () => toast.error('Failed to create portfolio'),
  })

  const deletePort = useMutation({
    mutationFn: portfolioService.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolios'] }); setSelectedId(null) },
  })

  const addHolding = useMutation({
    mutationFn: () => portfolioService.addHolding(
      selectedId!, holding.ticker.toUpperCase(),
      parseFloat(holding.shares), parseFloat(holding.avg_cost), holding.sector || undefined
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['valuation', selectedId] })
      qc.invalidateQueries({ queryKey: ['portfolios'] })
      qc.invalidateQueries({ queryKey: ['portfolio-ai', selectedId] })
      setHolding({ ticker: '', shares: '', avg_cost: '', sector: '' })
      setShowAddHolding(false)
      toast.success('Holding added')
    },
    onError: () => toast.error('Failed to add holding'),
  })

  const removeHolding = useMutation({
    mutationFn: (holdingId: number) => portfolioService.removeHolding(selectedId!, holdingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['valuation', selectedId] })
      qc.invalidateQueries({ queryKey: ['portfolio-ai', selectedId] })
      toast.success('Holding removed')
    },
  })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Portfolio Manager</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <Card>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">My Portfolios</p>
            {isLoading ? <Spinner className="p-4" /> : (
              <div className="space-y-1.5">
                {(portfolios ?? []).map((p) => (
                  <div key={p.id}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${selectedId === p.id ? 'bg-brand-500/20 text-brand-400' : 'text-slate-300 hover:bg-white/5'}`}
                    onClick={() => { setSelectedId(p.id); setShowAI(false) }}>
                    <span className="text-sm font-medium truncate">{p.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); deletePort.mutate(p.id) }}
                      className="text-slate-500 hover:text-red-400 transition-colors ml-2">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {(portfolios ?? []).length === 0 && (
                  <p className="text-slate-500 text-xs py-2">No portfolios yet</p>
                )}
              </div>
            )}
            <div className="mt-4 border-t border-surface-border pt-4">
              <input value={newPortName} onChange={(e) => setNewPortName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newPortName.trim()) createPort.mutate(newPortName.trim()) }}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white text-sm focus:outline-none focus:border-brand-500 mb-2"
                placeholder="New portfolio name…" />
              <button onClick={() => { if (newPortName.trim()) createPort.mutate(newPortName.trim()) }}
                className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors">
                <Plus size={14} /> Create
              </button>
            </div>
          </Card>
        </div>

        {/* Main */}
        <div className="lg:col-span-3 space-y-6">
          {!selectedId ? (
            <Card>
              <p className="text-slate-400 text-sm py-8 text-center">Select or create a portfolio to view details</p>
            </Card>
          ) : loadVal ? <Spinner /> : val && (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Value', value: `$${val.total_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                  { label: 'Total Cost',  value: `$${val.total_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                  { label: 'Total P&L',   value: `${val.total_pnl >= 0 ? '+' : ''}$${val.total_pnl.toFixed(2)}` },
                  { label: 'Return %',    value: `${val.total_pnl_pct >= 0 ? '+' : ''}${val.total_pnl_pct.toFixed(2)}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-surface-card border border-surface-border rounded-xl p-4">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className={`text-lg font-bold mt-1 ${label.includes('P&L') || label.includes('Return') ? (val.total_pnl >= 0 ? 'text-brand-400' : 'text-red-400') : 'text-white'}`}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* AI Analysis toggle */}
              <div className="flex justify-end">
                <button onClick={() => setShowAI((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-500/40 text-brand-400 hover:bg-brand-500/10 text-sm font-medium transition-colors">
                  <BrainCircuit size={15} />
                  {showAI ? 'Hide AI Analysis' : 'Run AI Portfolio Analysis'}
                </button>
              </div>

              {/* AI Portfolio Health */}
              {showAI && (
                <AIPanel title="AI Portfolio Health Check" loading={loadAI}>
                  {loadAI ? (
                    <p className="text-slate-400 text-sm">Analyzing your portfolio with Claude…</p>
                  ) : aiHealth ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-medium">Overall Health</span>
                        <span className={`font-bold text-base ${healthColor[aiHealth.overall_health] ?? 'text-white'}`}>
                          {aiHealth.overall_health}
                        </span>
                      </div>
                      <p className="text-white text-sm leading-relaxed">{aiHealth.summary}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-2">Strengths</p>
                          <ul className="space-y-1">
                            {(aiHealth.strengths ?? []).map((s: string, i: number) => (
                              <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5">
                                <span className="text-brand-400 mt-0.5">✓</span>{s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Risks</p>
                          <ul className="space-y-1">
                            {(aiHealth.risks ?? []).map((r: string, i: number) => (
                              <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5">
                                <span className="text-red-400 mt-0.5">!</span>{r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {(aiHealth.rebalancing_suggestions ?? []).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Rebalancing Suggestions</p>
                          <div className="space-y-2">
                            {aiHealth.rebalancing_suggestions.map((s: any, i: number) => (
                              <div key={i} className="flex items-center gap-3 bg-surface/50 rounded-lg px-3 py-2">
                                <span className="font-mono font-bold text-white text-sm w-14">{s.ticker}</span>
                                <Badge label={s.action} variant={actionVariant(s.action)} />
                                <span className="text-slate-300 text-xs flex-1">{s.reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">AI analysis unavailable — check ANTHROPIC_API_KEY.</p>
                  )}
                </AIPanel>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Holdings table */}
                <Card padding={false}>
                  <div className="p-4 border-b border-surface-border flex items-center justify-between">
                    <h3 className="font-semibold text-white text-sm">Holdings</h3>
                    <div className="flex gap-2">
                      <button onClick={() => qc.invalidateQueries({ queryKey: ['valuation', selectedId] })}
                        className="p-1.5 rounded text-slate-400 hover:text-white transition-colors">
                        <RefreshCw size={13} />
                      </button>
                      <button onClick={() => setShowAddHolding(!showAddHolding)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-brand-500 hover:bg-brand-600 text-white text-xs rounded transition-colors">
                        <Plus size={12} /> Add
                      </button>
                    </div>
                  </div>

                  {showAddHolding && (
                    <div className="p-4 border-b border-surface-border bg-surface/50 grid grid-cols-2 gap-2">
                      {[
                        { ph: 'TICKER',     key: 'ticker'   },
                        { ph: 'Shares',     key: 'shares'   },
                        { ph: 'Avg Cost ($)', key: 'avg_cost' },
                        { ph: 'Sector (opt)', key: 'sector'   },
                      ].map(({ ph, key }) => (
                        <input key={key} placeholder={ph}
                          value={holding[key as keyof typeof holding]}
                          onChange={(e) => setHolding((h) => ({ ...h, [key]: e.target.value }))}
                          className="px-2.5 py-1.5 bg-surface border border-surface-border rounded text-white text-xs focus:outline-none focus:border-brand-500" />
                      ))}
                      <button onClick={() => addHolding.mutate()}
                        className="col-span-2 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium rounded transition-colors">
                        Save Holding
                      </button>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-500 border-b border-surface-border">
                          {['Ticker', 'Shares', 'Avg', 'Price', 'P&L', '%', 'Wt', ''].map((h) => (
                            <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {val.holdings.filter((h: any) => !('error' in h)).map((h: any) => (
                          <tr key={h.id} className="hover:bg-white/5">
                            <td className="px-3 py-2 font-mono font-bold text-white">{h.ticker}</td>
                            <td className="px-3 py-2 text-slate-300">{h.shares}</td>
                            <td className="px-3 py-2 text-slate-300">${h.avg_cost.toFixed(2)}</td>
                            <td className="px-3 py-2 text-white">${h.current_price?.toFixed(2) ?? '—'}</td>
                            <td className={`px-3 py-2 font-semibold ${h.pnl >= 0 ? 'text-brand-400' : 'text-red-400'}`}>
                              {h.pnl >= 0 ? '+' : ''}${h.pnl?.toFixed(2)}
                            </td>
                            <td className="px-3 py-2">
                              <Badge label={`${h.pnl_pct >= 0 ? '+' : ''}${h.pnl_pct?.toFixed(1)}%`}
                                variant={h.pnl_pct >= 0 ? 'green' : 'red'} />
                            </td>
                            <td className="px-3 py-2 text-slate-400">{h.weight?.toFixed(1)}%</td>
                            <td className="px-3 py-2">
                              <button onClick={() => removeHolding.mutate(h.id)}
                                className="text-slate-500 hover:text-red-400 transition-colors">
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Allocation chart */}
                <Card>
                  <h3 className="font-semibold text-white text-sm mb-4">Allocation</h3>
                  {val.holdings.filter((h: any) => !('error' in h)).length > 0 ? (
                    <AllocationChart holdings={val.holdings.filter((h: any) => !('error' in h)) as any} />
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-8">Add holdings to see allocation</p>
                  )}
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
