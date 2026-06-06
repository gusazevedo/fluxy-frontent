'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/hooks/useAuth'
import { ApiError } from '@/lib/api/client'
import { getBalance } from '@/lib/api/summary'
import { createTransaction, getTransactions } from '@/lib/api/transactions'
import { SummaryCards } from './components/SummaryCards'
import { TransactionList } from './components/TransactionList'
import { CreateTransactionDrawer } from './components/CreateTransactionDrawer'
import type { BalanceSummary, CreateTransactionInput, Transaction } from '@/types'

function is401(reason: unknown) {
  return reason instanceof ApiError && reason.status === 401
}

function isValidIso(value: string | undefined): value is string {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime())
}

function adjustSummary(
  summary: BalanceSummary,
  input: CreateTransactionInput,
  sign: 1 | -1,
): BalanceSummary {
  const value = input.value * sign
  if (input.type === 'income') {
    return {
      income: summary.income + value,
      outcome: summary.outcome,
      balance: summary.balance + value,
    }
  }
  return {
    income: summary.income,
    outcome: summary.outcome + value,
    balance: summary.balance - value,
  }
}

export default function DashboardPage() {
  const { accessToken, logout } = useAuth()
  const [summary, setSummary] = useState<BalanceSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [summaryError, setSummaryError] = useState(false)
  const [transactionsError, setTransactionsError] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

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

  async function handleCreate(input: CreateTransactionInput) {
    if (accessToken === null) return

    const now = new Date().toISOString()
    const optimistic: Transaction = {
      id: crypto.randomUUID(),
      title: input.title,
      value: input.value,
      type: input.type,
      category: input.category,
      created_at: now,
      updated_at: now,
    }

    setTransactions((prev) => [optimistic, ...prev])
    setSummary((prev) => (prev ? adjustSummary(prev, input, 1) : prev))
    setDrawerOpen(false)

    try {
      const created = await createTransaction(accessToken, input)
      const merged: Transaction = {
        ...optimistic,
        ...created,
        created_at: isValidIso(created.created_at) ? created.created_at : optimistic.created_at,
        updated_at: isValidIso(created.updated_at) ? created.updated_at : optimistic.updated_at,
      }
      setTransactions((prev) => prev.map((t) => (t.id === optimistic.id ? merged : t)))
    } catch (err) {
      if (is401(err)) {
        logout()
        return
      }
      setTransactions((prev) => prev.filter((t) => t.id !== optimistic.id))
      setSummary((prev) => (prev ? adjustSummary(prev, input, -1) : prev))
      toast.error('Failed to create transaction. Please try again.')
    }
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </header>
        <section aria-label="Summary">
          <SummaryCards summary={summaryError ? null : summary} loading={loading} />
        </section>
        <section aria-label="Transactions">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Transactions</h2>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              New transaction
            </button>
          </div>
          <TransactionList
            transactions={transactions}
            loading={loading}
            error={transactionsError}
          />
        </section>
      </div>
      <CreateTransactionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}
