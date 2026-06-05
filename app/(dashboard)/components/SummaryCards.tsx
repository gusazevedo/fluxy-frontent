import type { BalanceSummary } from '@/types'
import { formatCurrency } from '@/lib/utils/format'

interface SummaryCardsProps {
  summary: BalanceSummary | null
  loading: boolean
}

export function SummaryCards({ summary, loading }: SummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-6 animate-pulse"
            data-testid="summary-skeleton"
          >
            <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
            <div className="h-7 bg-gray-200 rounded w-32" />
          </div>
        ))}
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {['Total Income', 'Total Outcome', 'Balance'].map((label) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-semibold text-gray-400">—</p>
          </div>
        ))}
      </div>
    )
  }

  const isPositive = summary.balance >= 0
  const balancePrefix = isPositive ? '+' : '−'
  const balanceColor = isPositive ? 'text-green-600' : 'text-red-600'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">Total Income</p>
        <p className="text-2xl font-semibold text-green-600">{formatCurrency(summary.income)}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">Total Outcome</p>
        <p className="text-2xl font-semibold text-red-600">{formatCurrency(summary.outcome)}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">Balance</p>
        <p className={`text-2xl font-semibold ${balanceColor}`}>
          {`${balancePrefix}${formatCurrency(Math.abs(summary.balance))}`}
        </p>
      </div>
    </div>
  )
}
