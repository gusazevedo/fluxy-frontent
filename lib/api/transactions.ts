import type { Transaction } from '@/types'
import { apiRequest } from './client'

export function getTransactions(token: string): Promise<Transaction[]> {
  return apiRequest('/transactions', {
    headers: { Authorization: `Bearer ${token}` },
  })
}
