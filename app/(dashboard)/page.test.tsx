import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  createTransaction: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

import { getBalance } from '@/lib/api/summary'
import { createTransaction, getTransactions } from '@/lib/api/transactions'
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

const serverTransaction: Transaction = {
  id: 'tx-server',
  title: 'Freelance',
  value: 100,
  type: 'income',
  category: 'Salary',
  created_at: '2024-04-01T09:00:00Z',
  updated_at: '2024-04-01T09:00:00Z',
}

// Income locks the category to Salary, so the helper never touches it.
async function openAndFillDrawer(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'New transaction' }))
  await user.type(screen.getByLabelText('Title'), 'Freelance')
  await user.type(screen.getByLabelText('Value'), '100')
  await user.selectOptions(screen.getByLabelText('Type'), 'income')
  await user.click(screen.getByRole('button', { name: 'Create' }))
}

describe('DashboardPage — create transaction', () => {
  beforeEach(() => {
    vi.mocked(getBalance).mockResolvedValue(sampleSummary)
    vi.mocked(getTransactions).mockResolvedValue([])
  })

  it('optimistically shows the transaction and closes the drawer before the request resolves', async () => {
    let resolveCreate: (t: Transaction) => void = () => {}
    vi.mocked(createTransaction).mockReturnValue(
      new Promise<Transaction>((resolve) => {
        resolveCreate = resolve
      }),
    )
    const user = userEvent.setup()
    render(<DashboardPage />)
    await waitFor(() => expect(screen.getByText('$5,000.00')).toBeInTheDocument())

    await openAndFillDrawer(user)

    // optimistic row is shown and the drawer has closed, before the server responds
    await waitFor(() => {
      expect(screen.getByText('Freelance')).toBeInTheDocument()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    resolveCreate(serverTransaction)
  })

  it('updates the balance summary optimistically', async () => {
    vi.mocked(createTransaction).mockResolvedValue(serverTransaction)
    const user = userEvent.setup()
    render(<DashboardPage />)
    await waitFor(() => expect(screen.getByText('+$3,679.50')).toBeInTheDocument())

    await openAndFillDrawer(user)

    await waitFor(() => {
      // income 5000 + 100, balance 3679.5 + 100
      expect(screen.getByText('$5,100.00')).toBeInTheDocument()
      expect(screen.getByText('+$3,779.50')).toBeInTheDocument()
    })
  })

  it('sends the typed input to createTransaction', async () => {
    vi.mocked(createTransaction).mockResolvedValue(serverTransaction)
    const user = userEvent.setup()
    render(<DashboardPage />)
    await waitFor(() => expect(screen.getByText('$5,000.00')).toBeInTheDocument())

    await openAndFillDrawer(user)

    await waitFor(() => {
      expect(createTransaction).toHaveBeenCalledWith('test-token', {
        title: 'Freelance',
        value: 100,
        type: 'income',
        category: 'Salary',
      })
    })
  })

  it('removes the optimistic transaction and rolls back the summary on a non-401 error', async () => {
    vi.mocked(createTransaction).mockRejectedValue(new ApiError(500, 'SERVER_ERROR', 'Boom'))
    const user = userEvent.setup()
    render(<DashboardPage />)
    await waitFor(() => expect(screen.getByText('+$3,679.50')).toBeInTheDocument())

    await openAndFillDrawer(user)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to create transaction. Please try again.',
      )
    })
    expect(screen.queryByText('Freelance')).not.toBeInTheDocument()
    // summary restored to original values
    expect(screen.getByText('$5,000.00')).toBeInTheDocument()
    expect(screen.getByText('+$3,679.50')).toBeInTheDocument()
  })

  it('keeps a valid date when the server response omits created_at', async () => {
    // Real POST /transactions can return a transaction without a usable
    // created_at; formatDate must never receive an invalid date.
    const serverWithoutDate = {
      id: 'tx-server',
      title: 'Freelance',
      value: 100,
      type: 'income',
      category: 'Salary',
    } as unknown as Transaction
    vi.mocked(createTransaction).mockResolvedValue(serverWithoutDate)
    const user = userEvent.setup()
    render(<DashboardPage />)
    await waitFor(() => expect(screen.getByText('$5,000.00')).toBeInTheDocument())

    await openAndFillDrawer(user)

    await waitFor(() => {
      expect(createTransaction).toHaveBeenCalled()
      expect(screen.getByText('Freelance')).toBeInTheDocument()
    })
    // No DateTimeFormat crash, and a real date is shown (today's date label).
    const today = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date())
    expect(screen.getByText(today)).toBeInTheDocument()
  })

  it('calls logout on a 401 error from createTransaction', async () => {
    vi.mocked(createTransaction).mockRejectedValue(
      new ApiError(401, 'UNAUTHORIZED', 'Bad token'),
    )
    const user = userEvent.setup()
    render(<DashboardPage />)
    await waitFor(() => expect(screen.getByText('$5,000.00')).toBeInTheDocument())

    await openAndFillDrawer(user)

    await waitFor(() => expect(mockLogout).toHaveBeenCalled())
  })
})
