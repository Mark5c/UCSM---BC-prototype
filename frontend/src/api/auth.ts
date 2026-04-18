import client from './client'
import type { AuthToken, User } from '../types'

export const authApi = {
  register: async (username: string, email: string, password: string): Promise<AuthToken> => {
    const { data } = await client.post<AuthToken>('/auth/register', { username, email, password })
    return data
  },

  login: async (username: string, password: string): Promise<AuthToken> => {
    const { data } = await client.post<AuthToken>('/auth/login', { username, password })
    return data
  },

  me: async (): Promise<User> => {
    const { data } = await client.get<{ id: string; username: string; email: string; created_at: string }>('/auth/me')
    return { id: data.id, username: data.username, email: data.email, createdAt: data.created_at }
  },
}

export const TOKEN_KEY = 'ucms_token'
export const SHARE_TOKEN_KEY = 'ucms_share_token'

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function saveShareToken(projectId: string, token: string) {
  const map = getShareTokenMap()
  map[projectId] = token
  sessionStorage.setItem(SHARE_TOKEN_KEY, JSON.stringify(map))
}

export function getShareToken(projectId: string): string | null {
  return getShareTokenMap()[projectId] ?? null
}

export function getShareTokenMap(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(SHARE_TOKEN_KEY) ?? '{}')
  } catch {
    return {}
  }
}
