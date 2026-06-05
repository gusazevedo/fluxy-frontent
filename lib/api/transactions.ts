import type { CreateTransactionInput, Transaction } from '@/types'
import { apiRequest } from './client'

export function getTransactions(token: string): Promise<Transaction[]> {
  return apiRequest('/transactions', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function createTransaction(
  token: string,
  input: CreateTransactionInput,
): Promise<Transaction> {
  return apiRequest('/transactions', {
    method: 'POST',
    body: input,
    headers: { Authorization: `Bearer ${token}` },
  })
}
