import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import AIPanel from '../../components/ui/AIPanel';
import { BrainCircuit, Target } from 'lucide-react';

export default function AIPortfolioPage() {
  const [tickerInput, setTickerInput] = useState('AAPL,MSFT,GOOGL,AMZN,NVDA');
  const [context, setContext] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      const tickers = tickerInput.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
      return axios.post('/api/analytics/ai-portfolio', { tickers, context }).then(r => r.data);
    },
  });

  const data = mutation.data;

  const profileColor = (p: string) =>
    p === 'Conservative' ? 'text-blue-400' :
    p === 'Aggressive'   ? 'text-red-400'  : 'text-green-400';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BrainCircuit size={28} className="text-green-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">AI Portfolio Construction</h1>
          <p className="text-gray-400 text-sm">Claude AI allocates optimal weights for your basket of stocks</p>
        </div>
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tickers (comma-separated)</label>
            <input
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm uppercase"
              value={tickerInput}
              onChange={e => setTickerInput(e.target.value)}
              placeholder="AAPL,MSFT,GOOGL,AMZN"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Investment Goals / Constraints <span className="text-gray-600">(optional)</span>
            </label>
            <textarea
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm resize-none"
              rows={2}
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="e.g. I want a growth-focused portfolio with low volatility, 3-year horizon..."
            />
          </div>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <BrainCircuit size={16} />
            {mutation.isPending ? 'Claude is thinking…' : 'Build AI Portfolio'}
          </button>
          {mutation.isError && (
            <p className="text-red-400 text-sm">{(mutation.error as Error).message}</p>
          )}
        </div>
      </Card>

      {mutation.isPending && (
        <div className="flex flex-col items-center gap-3 py-12">
          <Spinner />
          <p className="text-gray-400 text-sm">Claude is analyzing each stock and building your portfolio…</p>
        </div>
      )}

      {data && (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Risk Profile</p>
              <p className={`text-lg font-bold ${profileColor(data.risk_profile)}`}>{data.risk_profile}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Rebalance</p>
              <p className="text-lg font-bold text-white">{data.rebalance_frequency}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Positions</p>
              <p className="text-lg font-bold text-white">{Object.keys(data.weights).length}</p>
            </div>
          </div>

          {/* Weight allocation */}
          <Card title="AI-Recommended Allocation">
            <div className="space-y-3">
              {Object.entries(data.weights as Record<string, number>)
                .sort(([, a], [, b]) => b - a)
                .map(([ticker, weight]) => {
                  const pct = (weight * 100).toFixed(1);
                  const reason = data.key_reasoning?.find((r: any) => r.ticker === ticker)?.reason;
                  return (
                    <div key={ticker}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-white font-semibold text-sm">{ticker}</span>
                          {reason && <span className="text-gray-400 text-xs ml-3">{reason}</span>}
                        </div>
                        <span className="text-green-400 font-bold text-sm">{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full bg-green-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>

          {/* AI rationale */}
          <AIPanel title="Claude's Portfolio Rationale">
            <p className="text-white text-sm leading-relaxed">{data.rationale}</p>
            {data.key_reasoning?.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Target size={11} /> Per-Stock Reasoning
                </p>
                {data.key_reasoning.map((r: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-800/60 rounded-lg px-3 py-2">
                    <span className="text-green-400 font-bold text-xs w-16 shrink-0">{r.ticker} {r.weight_pct}%</span>
                    <span className="text-gray-300 text-xs">{r.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </AIPanel>
        </>
      )}
    </div>
  );
}
