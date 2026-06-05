import type { AuthTokens, LoginInput, RegisterInput } from '@/types'
import { apiRequest } from './client'

export function registerUser(input: RegisterInput): Promise<{ message: string }> {
  return apiRequest('/auth/register', { method: 'POST', body: input })
}

export function loginUser(input: LoginInput): Promise<AuthTokens> {
  return apiRequest('/auth/login', { method: 'POST', body: input })
}
