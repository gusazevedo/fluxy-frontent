import type {
  CreateTransactionInput,
  Transaction,
  TransactionCategory,
  TransactionType,
} from '@/types'
import { apiRequest } from './client'

// The backend returns camelCase keys and the monetary value as a string,
// which differs from our domain `Transaction`. Map it at the boundary.
interface TransactionDTO {
  id: string
  title: string
  value: string | number
  type: TransactionType
  category: TransactionCategory
  createdAt: string
  updatedAt: string
}

function toTransaction(dto: TransactionDTO): Transaction {
  return {
    id: dto.id,
    title: dto.title,
    value: typeof dto.value === 'number' ? dto.value : Number(dto.value),
    type: dto.type,
    category: dto.category,
    created_at: dto.createdAt,
    updated_at: dto.updatedAt,
  }
}

export async function getTransactions(token: string): Promise<Transaction[]> {
  const data = await apiRequest<TransactionDTO[]>('/transactions', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data.map(toTransaction)
}

export async function createTransaction(
  token: string,
  input: CreateTransactionInput,
): Promise<Transaction> {
  const data = await apiRequest<TransactionDTO>('/transactions', {
    method: 'POST',
    body: input,
    headers: { Authorization: `Bearer ${token}` },
  })
  return toTransaction(data)
}
