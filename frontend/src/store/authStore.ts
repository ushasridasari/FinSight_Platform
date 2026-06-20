import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('ff_token', token)
        set({ user, token })
      },
      clearAuth: () => {
        localStorage.removeItem('ff_token')
        set({ user: null, token: null })
      },
    }),
    { name: 'ff-auth' }
  )
)
