import type { BalanceSummary } from '@/types'
import { apiRequest } from './client'

export function getBalance(token: string): Promise<BalanceSummary> {
  return apiRequest('/summary/balance', {
    headers: { Authorization: `Bearer ${token}` },
  })
}
