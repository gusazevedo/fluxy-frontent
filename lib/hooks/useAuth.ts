import { useCallback, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthTokens } from '@/types'

const ACCESS_TOKEN_KEY = 'fluxy_access_token'
const REFRESH_TOKEN_KEY = 'fluxy_refresh_token'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60

const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

function getAccessTokenSnapshot() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

function getServerSnapshot() {
  return null
}

export function useAuth() {
  const router = useRouter()
  const accessToken = useSyncExternalStore(
    subscribe,
    getAccessTokenSnapshot,
    getServerSnapshot,
  )

  const isAuthenticated = accessToken !== null

  const login = useCallback((tokens: AuthTokens) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
    document.cookie = `${ACCESS_TOKEN_KEY}=${tokens.access_token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
    emit()
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`
    emit()
    router.push('/login')
  }, [router])

  return { isAuthenticated, accessToken, login, logout }
}
