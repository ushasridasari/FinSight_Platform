import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';

interface EquityPoint {
  date: string;
  strategy_value: number;
  buyhold_value: number;
}

interface Props {
  data: EquityPoint[];
  initialCapital: number;
}

export default function EquityCurveChart({ data, initialCapital }: Props) {
  const fmt = (v: number) => `$${v.toLocaleString()}`;
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 10, right: 16, left: 16, bottom: 0 }}>
        <defs>
          <linearGradient id="stratGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          tickFormatter={(d: string) => d.slice(0, 7)}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={fmt} width={80} />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
          labelStyle={{ color: '#e5e7eb' }}
          formatter={(v: number, name: string) => [fmt(v), name]}
        />
        <Legend wrapperStyle={{ color: '#d1d5db' }} />
        <Area
          type="monotone"
          dataKey="strategy_value"
          name="Strategy"
          stroke="#22c55e"
          fill="url(#stratGrad)"
          dot={false}
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="buyhold_value"
          name="Buy & Hold"
          stroke="#60a5fa"
          dot={false}
          strokeWidth={1.5}
          strokeDasharray="5 3"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
