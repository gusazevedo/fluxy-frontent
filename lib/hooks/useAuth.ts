import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthTokens } from '@/types'

const ACCESS_TOKEN_KEY = 'fluxy_access_token'
const REFRESH_TOKEN_KEY = 'fluxy_refresh_token'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60

export function useAuth() {
  const router = useRouter()
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    setAccessToken(localStorage.getItem(ACCESS_TOKEN_KEY))
  }, [])

  const isAuthenticated = accessToken !== null

  function login(tokens: AuthTokens) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
    document.cookie = `${ACCESS_TOKEN_KEY}=${tokens.access_token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
    setAccessToken(tokens.access_token)
  }

  function logout() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`
    setAccessToken(null)
    router.push('/login')
  }

  return { isAuthenticated, accessToken, login, logout }
}
