import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import DashboardPage from './page'
import type { BalanceSummary, Transaction } from '@/types'

const mockLogout = vi.fn()
const mockLogin = vi.fn()

vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    accessToken: 'test-token',
    isAuthenticated: true,
    login: mockLogin,
    logout: mockLogout,
  }),
}))

vi.mock('@/lib/api/summary', () => ({
  getBalance: vi.fn(),
}))

vi.mock('@/lib/api/transactions', () => ({
  getTransactions: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

import { getBalance } from '@/lib/api/summary'
import { getTransactions } from '@/lib/api/transactions'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api/client'

const sampleSummary: BalanceSummary = { income: 5000, outcome: 1320.5, balance: 3679.5 }
const sampleTransaction: Transaction = {
  id: 'tx-1',
  title: 'Gym membership',
  value: 89.9,
  type: 'outcome',
  category: 'Gym',
  created_at: '2024-03-15T12:00:00Z',
  updated_at: '2024-03-15T12:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DashboardPage', () => {
  it('renders summary cards with fetched balance values', async () => {
    vi.mocked(getBalance).mockResolvedValue(sampleSummary)
    vi.mocked(getTransactions).mockResolvedValue([])
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('$5,000.00')).toBeInTheDocument()
      expect(screen.getByText('$1,320.50')).toBeInTheDocument()
      expect(screen.getByText('+$3,679.50')).toBeInTheDocument()
    })
  })

  it('renders transaction list with fetched transactions', async () => {
    vi.mocked(getBalance).mockResolvedValue(sampleSummary)
    vi.mocked(getTransactions).mockResolvedValue([sampleTransaction])
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('Gym membership')).toBeInTheDocument()
    })
  })

  it('renders empty state when transactions list is empty', async () => {
    vi.mocked(getBalance).mockResolvedValue(sampleSummary)
    vi.mocked(getTransactions).mockResolvedValue([])
    render(<DashboardPage />)
    await waitFor(() => {
      expect(
        screen.getByText('No transactions yet. Your transactions will appear here.'),
      ).toBeInTheDocument()
    })
  })

  it('calls logout on 401 from balance endpoint', async () => {
    vi.mocked(getBalance).mockRejectedValue(new ApiError(401, 'UNAUTHORIZED', 'Bad token'))
    vi.mocked(getTransactions).mockResolvedValue([])
    render(<DashboardPage />)
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled()
    })
  })

  it('calls logout on 401 from transactions endpoint', async () => {
    vi.mocked(getBalance).mockResolvedValue(sampleSummary)
    vi.mocked(getTransactions).mockRejectedValue(
      new ApiError(401, 'UNAUTHORIZED', 'Bad token'),
    )
    render(<DashboardPage />)
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled()
    })
  })

  it('shows error toast on non-401 error', async () => {
    vi.mocked(getBalance).mockRejectedValue(new ApiError(500, 'SERVER_ERROR', 'Boom'))
    vi.mocked(getTransactions).mockResolvedValue([])
    render(<DashboardPage />)
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load data. Please try again.')
    })
  })

  it('renders error state in transactions section when transactions fetch fails (non-401)', async () => {
    vi.mocked(getBalance).mockResolvedValue(sampleSummary)
    vi.mocked(getTransactions).mockRejectedValue(new ApiError(500, 'SERVER_ERROR', 'Boom'))
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('Could not load transactions.')).toBeInTheDocument()
    })
  })

  it('does not call logout when both fetches succeed', async () => {
    vi.mocked(getBalance).mockResolvedValue(sampleSummary)
    vi.mocked(getTransactions).mockResolvedValue([])
    render(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('$5,000.00')).toBeInTheDocument()
    })
    expect(mockLogout).not.toHaveBeenCalled()
  })
})
