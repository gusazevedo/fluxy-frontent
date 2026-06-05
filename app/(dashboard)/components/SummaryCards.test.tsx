import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SummaryCards } from './SummaryCards'

describe('SummaryCards', () => {
  it('renders skeleton placeholders when loading', () => {
    render(<SummaryCards summary={null} loading={true} />)
    expect(screen.getAllByTestId('summary-skeleton')).toHaveLength(3)
  })

  it('renders placeholder cards with em-dash when summary is null and not loading', () => {
    render(<SummaryCards summary={null} loading={false} />)
    expect(screen.getAllByText('—')).toHaveLength(3)
    expect(screen.getByText('Total Income')).toBeInTheDocument()
    expect(screen.getByText('Total Outcome')).toBeInTheDocument()
    expect(screen.getByText('Balance')).toBeInTheDocument()
  })

  it('renders income, outcome, and balance formatted values', () => {
    render(
      <SummaryCards
        summary={{ income: 5000, outcome: 1320.5, balance: 3679.5 }}
        loading={false}
      />,
    )
    expect(screen.getByText('$5,000.00')).toBeInTheDocument()
    expect(screen.getByText('$1,320.50')).toBeInTheDocument()
    expect(screen.getByText('+$3,679.50')).toBeInTheDocument()
  })

  it('shows + prefix and green color for positive balance', () => {
    render(
      <SummaryCards
        summary={{ income: 5000, outcome: 1000, balance: 4000 }}
        loading={false}
      />,
    )
    const balance = screen.getByText('+$4,000.00')
    expect(balance.className).toContain('text-green-600')
  })

  it('shows − prefix and red color for negative balance', () => {
    render(
      <SummaryCards
        summary={{ income: 1000, outcome: 5000, balance: -4000 }}
        loading={false}
      />,
    )
    const balance = screen.getByText('−$4,000.00')
    expect(balance.className).toContain('text-red-600')
  })

  it('shows + prefix for zero balance', () => {
    render(
      <SummaryCards summary={{ income: 100, outcome: 100, balance: 0 }} loading={false} />,
    )
    expect(screen.getByText('+$0.00')).toBeInTheDocument()
  })
})
