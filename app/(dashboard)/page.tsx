'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/hooks/useAuth'
import { ApiError } from '@/lib/api/client'
import { getBalance } from '@/lib/api/summary'
import { getTransactions } from '@/lib/api/transactions'
import { SummaryCards } from './components/SummaryCards'
import { TransactionList } from './components/TransactionList'
import type { BalanceSummary, Transaction } from '@/types'

function is401(reason: unknown) {
  return reason instanceof ApiError && reason.status === 401
}

export default function DashboardPage() {
  const { accessToken, logout } = useAuth()
  const [summary, setSummary] = useState<BalanceSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [summaryError, setSummaryError] = useState(false)
  const [transactionsError, setTransactionsError] = useState(false)

  useEffect(() => {
    if (accessToken === null) return

    let cancelled = false

    Promise.allSettled([getBalance(accessToken), getTransactions(accessToken)]).then(
      ([balanceResult, transactionsResult]) => {
        if (cancelled) return

        const has401 =
          (balanceResult.status === 'rejected' && is401(balanceResult.reason)) ||
          (transactionsResult.status === 'rejected' && is401(transactionsResult.reason))

        if (has401) {
          logout()
          return
        }

        if (balanceResult.status === 'fulfilled') {
          setSummary(balanceResult.value)
        } else {
          setSummaryError(true)
        }

        if (transactionsResult.status === 'fulfilled') {
          setTransactions(transactionsResult.value)
        } else {
          setTransactionsError(true)
        }

        if (
          balanceResult.status === 'rejected' ||
          transactionsResult.status === 'rejected'
        ) {
          toast.error('Failed to load data. Please try again.')
        }

        setLoading(false)
      },
    )

    return () => {
      cancelled = true
    }
  }, [accessToken, logout])

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </header>
        <section aria-label="Summary">
          <SummaryCards summary={summaryError ? null : summary} loading={loading} />
        </section>
        <section aria-label="Transactions">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Transactions</h2>
          <TransactionList
            transactions={transactions}
            loading={loading}
            error={transactionsError}
          />
        </section>
      </div>
    </div>
  )
}
