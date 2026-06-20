import api from './api'
import type {
  StockQuote, OHLCV, ForecastResponse, RiskMetrics,
  SentimentResult, AIInsightResponse,
} from '../types'

export const marketService = {
  // ── Market data ─────────────────────────────────────────────────────────────

  async getQuote(ticker: string): Promise<StockQuote> {
    const { data } = await api.get<StockQuote>(`/market/quote/${ticker}`)
    return data
  },

  async getQuotes(tickers: string[]): Promise<StockQuote[]> {
    const { data } = await api.get<StockQuote[]>('/market/quotes', {
      params: { tickers: tickers.join(',') },
    })
    return data
  },

  async getHistory(ticker: string, period = '1y'): Promise<OHLCV[]> {
    const { data } = await api.get<OHLCV[]>(`/market/history/${ticker}`, { params: { period } })
    return data
  },

  async getMovers(): Promise<{ gainers: StockQuote[]; losers: StockQuote[]; all: StockQuote[] }> {
    const { data } = await api.get('/market/movers')
    return data
  },

  // ── ML Forecasting ──────────────────────────────────────────────────────────

  async getForecast(ticker: string, horizon = 30, withAI = true): Promise<ForecastResponse> {
    const { data } = await api.get<ForecastResponse>(`/market/forecast/${ticker}`, {
      params: { horizon, with_ai: withAI },
    })
    return data
  },

  // ── Risk ────────────────────────────────────────────────────────────────────

  async getRisk(ticker: string, benchmark = 'SPY'): Promise<RiskMetrics> {
    const { data } = await api.get<RiskMetrics>(`/market/risk/${ticker}`, { params: { benchmark } })
    return data
  },

  // ── Sentiment ───────────────────────────────────────────────────────────────

  async getSentiment(ticker: string): Promise<SentimentResult> {
    const { data } = await api.get<SentimentResult>(`/market/sentiment/${ticker}`)
    return data
  },

  // ── AI endpoints ─────────────────────────────────────────────────────────────

  async getAIInsight(ticker: string, context?: string): Promise<AIInsightResponse> {
    const { data } = await api.post<AIInsightResponse>('/market/ai-insight', { ticker, context })
    return data
  },

  async getMarketSummary(): Promise<{
    headline: string
    key_themes: string[]
    sector_outlook: Array<{ sector: string; outlook: string; note: string }>
    market_mood: string
    watch_today: string[]
  }> {
    const { data } = await api.get('/market/ai-summary')
    return data
  },

  async getPortfolioAIAnalysis(holdings: any[]): Promise<{
    summary: string
    strengths: string[]
    risks: string[]
    rebalancing_suggestions: Array<{ ticker: string; action: string; reason: string }>
    overall_health: string
  }> {
    const { data } = await api.post('/market/ai-portfolio-analysis', { holdings })
    return data
  },

  async getWatchlistScores(tickers: string[]): Promise<Array<{
    ticker: string
    score: number
    label: string
    action: string
    reason: string
  }>> {
    const { data } = await api.get('/market/ai-watchlist-scores', {
      params: { tickers: tickers.join(',') },
    })
    return data
  },
}
