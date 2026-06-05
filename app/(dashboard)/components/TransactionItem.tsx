import type { Transaction } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils/format'

interface TransactionItemProps {
  transaction: Transaction
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const isIncome = transaction.type === 'income'
  const prefix = isIncome ? '+' : '−'
  const valueColor = isIncome ? 'text-green-600' : 'text-red-600'

  return (
    <li className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{transaction.title}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
            {transaction.category}
          </span>
          <span className="text-xs text-gray-500">{formatDate(transaction.created_at)}</span>
        </div>
      </div>
      <p className={`text-sm font-semibold shrink-0 ml-4 ${valueColor}`}>
        {`${prefix} ${formatCurrency(transaction.value)}`}
      </p>
    </li>
  )
}
