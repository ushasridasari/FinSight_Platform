export interface User {
  id: number
  email: string
  username: string
  full_name: string | null
  is_active: boolean
  created_at: string
}

export interface AuthToken {
  access_token: string
  token_type: string
  user: User
}

export interface StockQuote {
  ticker: string
  name: string
  price: number
  change: number
  change_pct: number
  volume: number
  market_cap: number | null
  pe_ratio: number | null
  week_52_high: number | null
  week_52_low: number | null
  sector: string | null
}

export interface OHLCV {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface ForecastPoint {
  date: string
  predicted: number
  lower_bound: number
  upper_bound: number
}

export interface ForecastAICommentary {
  commentary: string
  confidence: number
  trend: 'Bullish' | 'Bearish' | 'Neutral' | 'Unknown'
  key_levels: Array<{ type: 'support' | 'resistance'; price: number }>
  catalysts: string[]
  expected_move_pct: number
}

export interface ForecastResponse {
  ticker: string
  horizon_days: number
  model: string
  historical: OHLCV[]
  forecast: ForecastPoint[]
  metrics: Record<string, unknown>
  ai_commentary: ForecastAICommentary | null
}

export interface RiskMetrics {
  ticker: string
  sharpe_ratio: number
  annualized_return: number
  annualized_volatility: number
  max_drawdown: number
  var_95: number
  var_99: number
  beta: number | null
  alpha: number | null
}

export interface SentimentResult {
  ticker: string
  composite_score: number
  label: 'Bullish' | 'Bearish' | 'Neutral'
  positive: number
  neutral: number
  negative: number
  headline_count: number
  ai_summary: string | null
}

export interface AIInsightResponse {
  ticker: string
  insight: string
  key_factors: string[]
  risk_level: string
  recommendation: string
}

export interface Portfolio {
  id: number
  name: string
  description: string | null
  created_at: string
  holdings: Holding[]
}

export interface Holding {
  id: number
  ticker: string
  shares: number
  avg_cost: number
  sector: string | null
}

export interface Transaction {
  id: number
  ticker: string
  transaction_type: 'BUY' | 'SELL'
  shares: number
  price: number
  executed_at: string
  notes: string | null
}

export interface HoldingValuation extends Holding {
  current_price: number
  current_value: number
  cost_basis: number
  pnl: number
  pnl_pct: number
  weight: number
}

export interface PortfolioValuation {
  portfolio_id: number
  portfolio_name: string
  total_value: number
  total_cost: number
  total_pnl: number
  total_pnl_pct: number
  holdings: HoldingValuation[]
}

export interface WatchlistItem {
  id: number
  ticker: string
  added_at: string
  notes: string | null
}

export interface WatchlistScore {
  ticker: string
  score: number
  label: 'Bullish' | 'Neutral' | 'Bearish'
  action: 'Buy' | 'Hold' | 'Sell'
  reason: string
}

export interface MarketSummary {
  headline: string
  key_themes: string[]
  sector_outlook: Array<{ sector: string; outlook: string; note: string }>
  market_mood: string
  watch_today: string[]
}

export interface PortfolioAIHealth {
  summary: string
  strengths: string[]
  risks: string[]
  rebalancing_suggestions: Array<{ ticker: string; action: string; reason: string }>
  overall_health: 'Excellent' | 'Good' | 'Fair' | 'Poor'
}
