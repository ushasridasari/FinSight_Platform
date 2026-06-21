import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import AIPanel from '../../components/ui/AIPanel';
import { Search, ShieldCheck, ShieldAlert } from 'lucide-react';

const gradeColor = (g: string) => {
  if (g === 'A') return 'text-green-400 bg-green-400/10';
  if (g === 'B') return 'text-blue-400 bg-blue-400/10';
  if (g === 'C') return 'text-yellow-400 bg-yellow-400/10';
  if (g === 'D') return 'text-orange-400 bg-orange-400/10';
  return 'text-red-400 bg-red-400/10';
};

const metricLabel: Record<string, string> = {
  sharpe_ratio:          'Sharpe Ratio',
  annualized_return:     'Ann. Return (%)',
  annualized_volatility: 'Ann. Volatility (%)',
  max_drawdown:          'Max Drawdown (%)',
  var_95:                'VaR 95% (daily %)',
  var_99:                'VaR 99% (daily %)',
  beta:                  'Beta vs SPY',
  alpha:                 'Alpha (%)',
};

export default function AIRiskPage() {
  const [input, setInput]   = useState('AAPL');
  const [ticker, setTicker] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-risk', ticker],
    queryFn:  () => axios.get(`/api/analytics/ai-risk/${ticker}`).then(r => r.data),
    enabled:  !!ticker,
    staleTime: 300_000,
  });

  function search(e: React.FormEvent) {
    e.preventDefault();
    setTicker(input.toUpperCase().trim());
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Risk Analysis</h1>
        <p className="text-gray-400 text-sm mt-0.5">Claude AI interprets risk metrics in plain English</p>
      </div>

      <form onSubmit={search} className="flex gap-2">
        <input
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500 w-40 uppercase"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="TICKER"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm flex items-center gap-1.5 transition-colors"
        >
          <Search size={15} /> Analyze
        </button>
      </form>

      {isLoading && <div className="flex justify-center py-12"><Spinner /></div>}
      {error && <p className="text-red-400 text-sm">Failed to load risk data for {ticker}.</p>}

      {data && (
        <>
          {/* Grade card */}
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-bold ${gradeColor(data.risk_grade)}`}>
              {data.risk_grade}
            </div>
            <div>
              <p className="text-white text-xl font-bold">{data.ticker} Risk Grade</p>
              <p className="text-gray-400 text-sm">Based on 1-year historical performance</p>
            </div>
          </div>

          {/* Raw metrics grid */}
          <Card title="Risk Metrics">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(data.metrics).map(([key, val]) => (
                val != null && (
                  <div key={key} className="bg-gray-800 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">{metricLabel[key] || key}</p>
                    <p className="text-white font-semibold text-sm">{String(val)}</p>
                  </div>
                )
              ))}
            </div>
          </Card>

          {/* AI interpretation */}
          <AIPanel title="Claude AI Risk Interpretation">
            <p className="text-white text-sm leading-relaxed mb-4">{data.interpretation}</p>

            {data.key_takeaways?.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Key Takeaways</p>
                {data.key_takeaways.map((t: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <ShieldCheck size={14} className="text-green-400 mt-0.5 shrink-0" />
                    <span className="text-gray-300 text-sm">{t}</span>
                  </div>
                ))}
              </div>
            )}

            {data.recommendation && (
              <div className="bg-gray-800/60 rounded-lg px-4 py-3 flex items-start gap-2">
                <ShieldAlert size={15} className="text-yellow-400 mt-0.5 shrink-0" />
                <p className="text-gray-200 text-sm">{data.recommendation}</p>
              </div>
            )}
          </AIPanel>
        </>
      )}
    </div>
  );
}
