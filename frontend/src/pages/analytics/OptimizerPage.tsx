import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import AIPanel from '../../components/ui/AIPanel';
import FrontierChart from '../../components/charts/analytics/FrontierChart';

const PERIODS = ['1y', '2y', '3y', '5y'];

export default function OptimizerPage() {
  const [tickerInput, setTickerInput] = useState('AAPL,MSFT,GOOGL,AMZN,NVDA');
  const [period, setPeriod] = useState('2y');
  const [rfr, setRfr] = useState(0.05);

  const mutation = useMutation({
    mutationFn: () => {
      const tickers = tickerInput.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
      return axios.post('/api/analytics/optimize', {
        tickers, period, risk_free_rate: rfr, num_portfolios: 3000,
      }).then(r => r.data);
    },
  });

  const data = mutation.data;

  const weightTable = (label: string, port: any, color: string) => (
    <div className="bg-gray-800 rounded-xl p-4">
      <p className={`font-semibold text-sm mb-2 ${color}`}>{label}</p>
      <div className="space-y-1">
        {data.tickers.map((t: string, i: number) => (
          <div key={t} className="flex items-center gap-2">
            <span className="text-gray-400 text-xs w-16">{t}</span>
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-green-500"
                style={{ width: `${port.weights[i] * 100}%` }}
              />
            </div>
            <span className="text-white text-xs w-12 text-right">{(port.weights[i] * 100).toFixed(1)}%</span>
          </div>
        ))}
        <div className="pt-2 grid grid-cols-3 gap-1 text-xs text-center">
          <div className="bg-gray-900 rounded p-1">
            <p className="text-gray-400">Return</p>
            <p className="text-white font-semibold">{port.expected_return.toFixed(2)}%</p>
          </div>
          <div className="bg-gray-900 rounded p-1">
            <p className="text-gray-400">Volatility</p>
            <p className="text-white font-semibold">{port.volatility.toFixed(2)}%</p>
          </div>
          <div className="bg-gray-900 rounded p-1">
            <p className="text-gray-400">Sharpe</p>
            <p className="text-white font-semibold">{port.sharpe_ratio.toFixed(3)}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Efficient Frontier Optimizer</h1>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-xs text-gray-400 mb-1">Tickers (comma-separated)</label>
            <input
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm uppercase"
              value={tickerInput}
              onChange={e => setTickerInput(e.target.value)}
              placeholder="AAPL,MSFT,GOOGL"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Period</label>
            <select
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
              value={period}
              onChange={e => setPeriod(e.target.value)}
            >
              {PERIODS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Risk-Free Rate</label>
            <input
              type="number"
              step="0.01"
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
              value={rfr}
              onChange={e => setRfr(+e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="mt-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg text-sm transition-colors"
        >
          {mutation.isPending ? 'Optimizing… (3 000 portfolios)' : 'Run Optimizer'}
        </button>
        {mutation.isError && (
          <p className="mt-2 text-red-400 text-sm">{(mutation.error as Error).message}</p>
        )}
      </Card>

      {mutation.isPending && (
        <div className="flex flex-col items-center gap-3 py-12">
          <Spinner />
          <p className="text-gray-400 text-sm">Simulating 3 000 portfolios via Monte Carlo…</p>
        </div>
      )}

      {data && (
        <>
          {/* Frontier scatter plot */}
          <Card title="Efficient Frontier">
            <FrontierChart
              portfolios={data.portfolios}
              maxSharpe={data.max_sharpe}
              minVariance={data.min_variance}
              equalWeight={data.equal_weight}
            />
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">
              <span><span className="text-green-400">●</span> Max Sharpe</span>
              <span><span className="text-yellow-400">●</span> Min Variance</span>
              <span><span className="text-blue-400">●</span> Equal Weight</span>
            </div>
          </Card>

          {/* Optimal portfolios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {weightTable('Max Sharpe Portfolio', data.max_sharpe, 'text-green-400')}
            {weightTable('Min Variance Portfolio', data.min_variance, 'text-yellow-400')}
            {weightTable('Equal Weight Portfolio', data.equal_weight, 'text-blue-400')}
          </div>

          {/* Correlation matrix */}
          <Card title="Correlation Matrix">
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr>
                    <th className="text-gray-500 p-2"></th>
                    {data.tickers.map((t: string) => (
                      <th key={t} className="text-gray-400 p-2 text-center">{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.tickers.map((row: string, i: number) => (
                    <tr key={row}>
                      <td className="text-gray-400 p-2 font-medium">{row}</td>
                      {data.correlation_matrix[i].map((val: number, j: number) => {
                        const abs = Math.abs(val);
                        const bg = val === 1 ? 'bg-gray-700' : abs > 0.7 ? 'bg-red-900/60' : abs > 0.4 ? 'bg-yellow-900/40' : 'bg-gray-800';
                        return (
                          <td key={j} className={`p-2 text-center rounded ${bg} ${val >= 0 ? 'text-white' : 'text-red-300'}`}>
                            {val.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* AI recommendation */}
          {data.ai_recommendation && (
            <AIPanel title="AI Portfolio Recommendation" content={data.ai_recommendation} />
          )}
        </>
      )}
    </div>
  );
}
