import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TransactionList } from './TransactionList'
import type { Transaction } from '@/types'

const tx: Transaction = {
  id: 'tx-1',
  title: 'Gym membership',
  value: 89.9,
  type: 'outcome',
  category: 'Gym',
  created_at: '2024-03-15T12:00:00Z',
  updated_at: '2024-03-15T12:00:00Z',
}

describe('TransactionList', () => {
  it('renders at least 3 skeleton items when loading', () => {
    render(<TransactionList transactions={[]} loading={true} error={false} />)
    expect(screen.getAllByTestId('transaction-skeleton').length).toBeGreaterThanOrEqual(3)
  })

  it('renders error message when error is true', () => {
    render(<TransactionList transactions={[]} loading={false} error={true} />)
    expect(screen.getByText('Could not load transactions.')).toBeInTheDocument()
  })

  it('renders empty state when transactions array is empty', () => {
    render(<TransactionList transactions={[]} loading={false} error={false} />)
    expect(
      screen.getByText('No transactions yet. Your transactions will appear here.'),
    ).toBeInTheDocument()
  })

  it('renders one item per transaction', () => {
    render(
      <TransactionList
        transactions={[tx, { ...tx, id: 'tx-2', title: 'Coffee shop' }]}
        loading={false}
        error={false}
      />,
    )
    expect(screen.getByText('Gym membership')).toBeInTheDocument()
    expect(screen.getByText('Coffee shop')).toBeInTheDocument()
  })

  it('does not render skeleton when loading is false', () => {
    render(<TransactionList transactions={[tx]} loading={false} error={false} />)
    expect(screen.queryAllByTestId('transaction-skeleton')).toHaveLength(0)
  })
})
