import api from './api'
import type { StockQuote, OHLCV, ForecastResponse, RiskMetrics, SentimentResult, AIInsightResponse } from '../types'

export const marketService = {
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

  async getForecast(ticker: string, horizon = 30): Promise<ForecastResponse> {
    const { data } = await api.get<ForecastResponse>(`/market/forecast/${ticker}`, { params: { horizon } })
    return data
  },

  async getRisk(ticker: string, benchmark = 'SPY'): Promise<RiskMetrics> {
    const { data } = await api.get<RiskMetrics>(`/market/risk/${ticker}`, { params: { benchmark } })
    return data
  },

  async getSentiment(ticker: string): Promise<SentimentResult> {
    const { data } = await api.get<SentimentResult>(`/market/sentiment/${ticker}`)
    return data
  },

  async getAIInsight(ticker: string, context?: string): Promise<AIInsightResponse> {
    const { data } = await api.post<AIInsightResponse>('/market/ai-insight', { ticker, context })
    return data
  },
}
