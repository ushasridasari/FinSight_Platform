import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface PortfolioPoint {
  volatility: number;
  ret: number;
  sharpe: number;
}

interface OptimalPortfolio {
  volatility: number;
  expected_return: number;
  sharpe_ratio: number;
}

interface Props {
  portfolios: PortfolioPoint[];
  maxSharpe: OptimalPortfolio;
  minVariance: OptimalPortfolio;
  equalWeight: OptimalPortfolio;
}

export default function FrontierChart({ portfolios, maxSharpe, minVariance, equalWeight }: Props) {
  const fmt = (v: number) => `${v.toFixed(2)}%`;

  // Down-sample to 500 pts for performance
  const step = Math.max(1, Math.floor(portfolios.length / 500));
  const sampled = portfolios.filter((_, i) => i % step === 0);

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ScatterChart margin={{ top: 16, right: 16, left: 16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="volatility"
          name="Volatility"
          type="number"
          domain={['auto', 'auto']}
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          tickFormatter={fmt}
          label={{ value: 'Volatility (%)', fill: '#9ca3af', dy: 14, fontSize: 12 }}
        />
        <YAxis
          dataKey="ret"
          name="Return"
          type="number"
          domain={['auto', 'auto']}
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          tickFormatter={fmt}
          label={{ value: 'Return (%)', fill: '#9ca3af', angle: -90, dx: -16, fontSize: 12 }}
        />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
          formatter={(v: number) => [`${v.toFixed(3)}%`]}
        />
        <Legend wrapperStyle={{ color: '#d1d5db' }} />
        <Scatter name="Simulated Portfolios" data={sampled} fill="#374151" opacity={0.6} />
        <Scatter
          name="Max Sharpe"
          data={[{ volatility: maxSharpe.volatility, ret: maxSharpe.expected_return }]}
          fill="#22c55e"
          r={8}
        />
        <Scatter
          name="Min Variance"
          data={[{ volatility: minVariance.volatility, ret: minVariance.expected_return }]}
          fill="#f59e0b"
          r={8}
        />
        <Scatter
          name="Equal Weight"
          data={[{ volatility: equalWeight.volatility, ret: equalWeight.expected_return }]}
          fill="#60a5fa"
          r={8}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
