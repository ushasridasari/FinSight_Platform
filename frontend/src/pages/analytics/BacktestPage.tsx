import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import AIPanel from '../../components/ui/AIPanel';
import EquityCurveChart from '../../components/charts/analytics/EquityCurveChart';

const STRATEGIES = [
  { value: 'ai_signal',    label: '🤖 AI Signal (Claude)' },
  { value: 'sma_crossover', label: 'SMA Crossover' },
  { value: 'rsi',           label: 'RSI Mean-Reversion' },
  { value: 'bollinger',     label: 'Bollinger Bands' },
  { value: 'macd',          label: 'MACD' },
];
const PERIODS = ['6mo', '1y', '2y', '5y'];

interface BacktestForm {
  ticker: string;
  strategy: string;
  period: string;
  initial_capital: number;
  short_window: number;
  long_window: number;
  rsi_period: number;
  rsi_oversold: number;
  rsi_overbought: number;
  macd_fast: number;
  macd_slow: number;
  macd_signal: number;
}

const defaultForm: BacktestForm = {
  ticker: 'AAPL',
  strategy: 'sma_crossover',
  period: '2y',
  initial_capital: 10000,
  short_window: 20,
  long_window: 50,
  rsi_period: 14,
  rsi_oversold: 30,
  rsi_overbought: 70,
  macd_fast: 12,
  macd_slow: 26,
  macd_signal: 9,
};

export default function BacktestPage() {
  const [form, setForm] = useState<BacktestForm>(defaultForm);

  const mutation = useMutation({
    mutationFn: (payload: BacktestForm) =>
      axios.post('/api/analytics/backtest', payload).then(r => r.data),
  });

  const data = mutation.data;
  const m = data?.metrics;

  const statCard = (label: string, value: string, positive?: boolean) => (
    <div className="bg-gray-800 rounded-xl p-4 text-center">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-lg font-bold ${positive === undefined ? 'text-white' : positive ? 'text-green-400' : 'text-red-400'}`}>
        {value}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Backtesting Engine</h1>

      {/* Config */}
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Ticker</label>
            <input
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm uppercase"
              value={form.ticker}
              onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Strategy</label>
            <select
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
              value={form.strategy}
              onChange={e => setForm(f => ({ ...f, strategy: e.target.value }))}
            >
              {STRATEGIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Period</label>
            <select
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
              value={form.period}
              onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
            >
              {PERIODS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Initial Capital ($)</label>
            <input
              type="number"
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
              value={form.initial_capital}
              onChange={e => setForm(f => ({ ...f, initial_capital: +e.target.value }))}
            />
          </div>
        </div>

        {/* Strategy-specific params */}
        {form.strategy === 'sma_crossover' && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Short Window</label>
              <input type="number" className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
                value={form.short_window} onChange={e => setForm(f => ({ ...f, short_window: +e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Long Window</label>
              <input type="number" className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
                value={form.long_window} onChange={e => setForm(f => ({ ...f, long_window: +e.target.value }))} />
            </div>
          </div>
        )}
        {form.strategy === 'rsi' && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">RSI Period</label>
              <input type="number" className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
                value={form.rsi_period} onChange={e => setForm(f => ({ ...f, rsi_period: +e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Oversold</label>
              <input type="number" className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
                value={form.rsi_oversold} onChange={e => setForm(f => ({ ...f, rsi_oversold: +e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Overbought</label>
              <input type="number" className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
                value={form.rsi_overbought} onChange={e => setForm(f => ({ ...f, rsi_overbought: +e.target.value }))} />
            </div>
          </div>
        )}
        {form.strategy === 'macd' && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Fast</label>
              <input type="number" className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
                value={form.macd_fast} onChange={e => setForm(f => ({ ...f, macd_fast: +e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Slow</label>
              <input type="number" className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
                value={form.macd_slow} onChange={e => setForm(f => ({ ...f, macd_slow: +e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Signal</label>
              <input type="number" className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
                value={form.macd_signal} onChange={e => setForm(f => ({ ...f, macd_signal: +e.target.value }))} />
            </div>
          </div>
        )}

        <button
          onClick={() => mutation.mutate(form)}
          disabled={mutation.isPending}
          className="mt-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg text-sm transition-colors"
        >
          {mutation.isPending ? 'Running...' : 'Run Backtest'}
        </button>
        {mutation.isError && (
          <p className="mt-2 text-red-400 text-sm">{(mutation.error as Error).message}</p>
        )}
      </Card>

      {mutation.isPending && (
        <div className="flex justify-center py-12"><Spinner /></div>
      )}

      {data && m && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {statCard('Total Return', `${m.total_return_pct}%`, m.total_return_pct >= 0)}
            {statCard('Buy & Hold', `${m.buyhold_return_pct}%`, m.buyhold_return_pct >= 0)}
            {statCard('Sharpe Ratio', m.sharpe_ratio.toFixed(3), m.sharpe_ratio >= 1)}
            {statCard('Max Drawdown', `${m.max_drawdown}%`, false)}
            {statCard('Win Rate', `${m.win_rate}%`, m.win_rate >= 50)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCard('Ann. Return', `${m.annualized_return}%`, m.annualized_return >= 0)}
            {statCard('Ann. Volatility', `${m.annualized_volatility}%`)}
            {statCard('Total Trades', `${m.total_trades}`)}
            {statCard('Avg Trade P&L', `$${m.avg_trade_pnl.toFixed(2)}`, m.avg_trade_pnl >= 0)}
          </div>

          {/* Equity curve */}
          <Card title="Equity Curve — Strategy vs Buy & Hold">
            <EquityCurveChart data={data.equity_curve} initialCapital={data.initial_capital} />
          </Card>

          {/* AI summary */}
          {data.ai_summary && (
            <AIPanel title="AI Strategy Analysis">
              <p className="text-white text-sm leading-relaxed">{data.ai_summary}</p>
            </AIPanel>
          )}

          {/* Trade log */}
          <Card title={`Trade Log (${data.trades.length} trades)`}>
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-400 sticky top-0 bg-gray-900">
                  <tr>
                    {['Date', 'Action', 'Price', 'Shares', 'Portfolio Value', 'P&L'].map(h => (
                      <th key={h} className="text-left py-2 px-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.trades.map((t: any, i: number) => (
                    <tr key={i} className="border-t border-gray-800">
                      <td className="py-1.5 px-3 text-gray-300">{t.date}</td>
                      <td className={`py-1.5 px-3 font-semibold ${t.action === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{t.action}</td>
                      <td className="py-1.5 px-3 text-white">${t.price.toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-gray-300">{t.shares.toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-white">${t.portfolio_value.toLocaleString()}</td>
                      <td className={`py-1.5 px-3 ${t.pnl == null ? 'text-gray-500' : t.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {t.pnl == null ? '—' : `$${t.pnl.toFixed(2)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
