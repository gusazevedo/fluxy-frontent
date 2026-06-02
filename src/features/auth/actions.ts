import { isApiError } from '@/features/auth/types'
import type { AuthTokens } from '@/features/auth/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export async function registerUser(email: string, password: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data: unknown = await res.json()

  if (!res.ok) {
    if (isApiError(data)) throw data
    throw Object.assign(new Error('Unexpected error'), { code: 'UNKNOWN' })
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof (data as Record<string, unknown>).message === 'string'
  ) {
    return data as { message: string }
  }

  throw Object.assign(new Error('Unexpected response shape'), { code: 'UNKNOWN' })
}

export async function loginUser(email: string, password: string): Promise<AuthTokens> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data: unknown = await res.json()

  if (!res.ok) {
    if (isApiError(data)) throw data
    throw Object.assign(new Error('Unexpected error'), { code: 'UNKNOWN' })
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    'access_token' in data &&
    'refresh_token' in data &&
    typeof (data as Record<string, unknown>).access_token === 'string' &&
    typeof (data as Record<string, unknown>).refresh_token === 'string'
  ) {
    return data as AuthTokens
  }

  throw Object.assign(new Error('Unexpected response shape'), { code: 'UNKNOWN' })
}
