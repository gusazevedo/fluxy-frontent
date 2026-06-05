export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface RegisterInput {
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export type TransactionType = 'income' | 'outcome'

export type TransactionCategory =
  | 'Bills'
  | 'Health'
  | 'Gym'
  | 'Subscriptions'
  | 'Food'
  | 'Entertainment'
  | 'Transport'

export interface Transaction {
  id: string
  title: string
  value: number
  type: TransactionType
  category: TransactionCategory
  created_at: string
  updated_at: string
}

export interface BalanceSummary {
  income: number
  outcome: number
  balance: number
}

export interface CreateTransactionInput {
  title: string
  value: number
  type: TransactionType
  category: TransactionCategory
}
