import type { Transaction } from '@/types'
import { TransactionItem } from './TransactionItem'

interface TransactionListProps {
  transactions: Transaction[]
  loading: boolean
  error: boolean
}

export function TransactionList({ transactions, loading, error }: TransactionListProps) {
  if (loading) {
    return (
      <ul className="space-y-2">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-4 animate-pulse"
            data-testid="transaction-skeleton"
          >
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
          </li>
        ))}
      </ul>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">Could not load transactions.</p>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">No transactions yet. Your transactions will appear here.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {transactions.map((t) => (
        <TransactionItem key={t.id} transaction={t} />
      ))}
    </ul>
  )
}
