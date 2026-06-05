import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TransactionItem } from './TransactionItem'
import type { Transaction } from '@/types'

const baseTransaction: Transaction = {
  id: 'tx-1',
  title: 'Gym membership',
  value: 89.9,
  type: 'outcome',
  category: 'Gym',
  created_at: '2024-03-15T12:00:00Z',
  updated_at: '2024-03-15T12:00:00Z',
}

describe('TransactionItem', () => {
  it('renders title, category, and formatted date', () => {
    render(<TransactionItem transaction={baseTransaction} />)
    expect(screen.getByText('Gym membership')).toBeInTheDocument()
    expect(screen.getByText('Gym')).toBeInTheDocument()
    expect(screen.getByText(/Mar/)).toBeInTheDocument()
  })

  it('shows − prefix and red color for outcome', () => {
    render(<TransactionItem transaction={baseTransaction} />)
    const value = screen.getByText('− $89.90')
    expect(value.className).toContain('text-red-600')
  })

  it('shows + prefix and green color for income', () => {
    render(<TransactionItem transaction={{ ...baseTransaction, type: 'income' }} />)
    const value = screen.getByText('+ $89.90')
    expect(value.className).toContain('text-green-600')
  })
})
