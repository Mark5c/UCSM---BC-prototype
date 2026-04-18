import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User } from '../types'
import { authApi, getToken, saveToken, removeToken } from '../api/auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount, validate stored token
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    authApi.me()
      .then(u => setUser(u))
      .catch(() => removeToken())
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const resp = await authApi.login(username, password)
    saveToken(resp.access_token)
    setUser({ ...resp.user, createdAt: (resp.user as any).created_at ?? resp.user.createdAt })
  }, [])

  const register = useCallback(async (username: string, email: string, password: string) => {
    const resp = await authApi.register(username, email, password)
    saveToken(resp.access_token)
    setUser({ ...resp.user, createdAt: (resp.user as any).created_at ?? resp.user.createdAt })
  }, [])

  const logout = useCallback(() => {
    removeToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
