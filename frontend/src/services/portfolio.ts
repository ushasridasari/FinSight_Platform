import api from './api'
import type { Portfolio, Transaction, PortfolioValuation, WatchlistItem } from '../types'

export const portfolioService = {
  async list(): Promise<Portfolio[]> {
    const { data } = await api.get<Portfolio[]>('/portfolio/')
    return data
  },

  async create(name: string, description?: string): Promise<Portfolio> {
    const { data } = await api.post<Portfolio>('/portfolio/', { name, description })
    return data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/portfolio/${id}`)
  },

  async addHolding(portfolioId: number, ticker: string, shares: number, avg_cost: number, sector?: string) {
    const { data } = await api.post(`/portfolio/${portfolioId}/holdings`, { ticker, shares, avg_cost, sector })
    return data
  },

  async removeHolding(portfolioId: number, holdingId: number): Promise<void> {
    await api.delete(`/portfolio/${portfolioId}/holdings/${holdingId}`)
  },

  async addTransaction(portfolioId: number, tx: {
    ticker: string; transaction_type: 'BUY' | 'SELL'; shares: number; price: number; notes?: string
  }): Promise<Transaction> {
    const { data } = await api.post<Transaction>(`/portfolio/${portfolioId}/transactions`, tx)
    return data
  },

  async getTransactions(portfolioId: number): Promise<Transaction[]> {
    const { data } = await api.get<Transaction[]>(`/portfolio/${portfolioId}/transactions`)
    return data
  },

  async getValuation(portfolioId: number): Promise<PortfolioValuation> {
    const { data } = await api.get<PortfolioValuation>(`/portfolio/${portfolioId}/valuation`)
    return data
  },

  async getWatchlist(): Promise<WatchlistItem[]> {
    const { data } = await api.get<WatchlistItem[]>('/portfolio/watchlist')
    return data
  },

  async addToWatchlist(ticker: string, notes?: string): Promise<WatchlistItem> {
    const { data } = await api.post<WatchlistItem>('/portfolio/watchlist', { ticker, notes })
    return data
  },

  async removeFromWatchlist(id: number): Promise<void> {
    await api.delete(`/portfolio/watchlist/${id}`)
  },
}
