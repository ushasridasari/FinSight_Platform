import api from './api'
import type { AuthToken, User } from '../types'

export const authService = {
  async register(email: string, username: string, password: string, full_name?: string): Promise<User> {
    const { data } = await api.post<User>('/auth/register', { email, username, password, full_name })
    return data
  },

  async login(email: string, password: string): Promise<AuthToken> {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    const { data } = await api.post<AuthToken>('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    localStorage.setItem('ff_token', data.access_token)
    return data
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/auth/me')
    return data
  },

  logout() {
    localStorage.removeItem('ff_token')
  },
}
