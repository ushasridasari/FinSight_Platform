import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { portfolioService } from '../services/portfolio'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import AllocationChart from '../components/charts/AllocationChart'
import type { PortfolioValuation } from '../types'

export default function PortfolioPage() {
  const qc = useQueryClient()
  const [newPortName, setNewPortName] = useState('')
  const [selectedId, setSelectedId]   = useState<number | null>(null)
  const [showAddHolding, setShowAddHolding] = useState(false)
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

  const createPort = useMutation({
    mutationFn: (name: string) => portfolioService.create(name),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolios'] }); setNewPortName('') },
    onError: () => toast.error('Failed to create portfolio'),
  })

  const deletePort = useMutation({
    mutationFn: portfolioService.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolios'] }); if (selectedId) setSelectedId(null) },
  })

  const addHolding = useMutation({
    mutationFn: () => portfolioService.addHolding(
      selectedId!, holding.ticker.toUpperCase(), parseFloat(holding.shares),
      parseFloat(holding.avg_cost), holding.sector || undefined
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['valuation', selectedId] })
      qc.invalidateQueries({ queryKey: ['portfolios'] })
      setHolding({ ticker: '', shares: '', avg_cost: '', sector: '' })
      setShowAddHolding(false)
      toast.success('Holding added')
    },
    onError: () => toast.error('Failed to add holding'),
  })

  const removeHolding = useMutation({
    mutationFn: (holdingId: number) => portfolioService.removeHolding(selectedId!, holdingId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['valuation', selectedId] }); toast.success('Holding removed') },
  })

  const val: PortfolioValuation | undefined = valuation as PortfolioValuation | undefined

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Portfolio Manager</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar — portfolios list */}
        <div className="lg:col-span-1 space-y-3">
          <Card>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">My Portfolios</p>
            {isLoading ? <Spinner className="p-4" /> : (
              <div className="space-y-1.5">
                {(portfolios ?? []).map((p) => (
                  <div key={p.id} className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${selectedId === p.id ? 'bg-brand-500/20 text-brand-400' : 'text-slate-300 hover:bg-white/5'}`}
                    onClick={() => setSelectedId(p.id)}>
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
            {/* Create portfolio */}
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

        {/* Main content */}
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
                  { label: 'Total Value',   value: `$${val.total_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                  { label: 'Total Cost',    value: `$${val.total_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                  { label: 'Total P&L',     value: `${val.total_pnl >= 0 ? '+' : ''}$${val.total_pnl.toFixed(2)}` },
                  { label: 'Return %',      value: `${val.total_pnl_pct >= 0 ? '+' : ''}${val.total_pnl_pct.toFixed(2)}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-surface-card border border-surface-border rounded-xl p-4">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className={`text-lg font-bold mt-1 ${label.includes('P&L') || label.includes('Return') ? (val.total_pnl >= 0 ? 'text-brand-400' : 'text-red-400') : 'text-white'}`}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

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
                        { ph: 'TICKER', key: 'ticker' },
                        { ph: 'Shares', key: 'shares' },
                        { ph: 'Avg Cost ($)', key: 'avg_cost' },
                        { ph: 'Sector (opt)', key: 'sector' },
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
                          {['Ticker', 'Shares', 'Avg Cost', 'Price', 'P&L', '%', 'Weight', ''].map((h) => (
                            <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {val.holdings.filter((h) => !('error' in h)).map((h: any) => (
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
