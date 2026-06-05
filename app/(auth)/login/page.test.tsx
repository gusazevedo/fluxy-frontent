import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from './page'

const mockPush = vi.fn()
const mockLogin = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({ login: mockLogin, isAuthenticated: false, accessToken: null, logout: vi.fn() }),
}))

vi.mock('@/lib/api/auth', () => ({
  loginUser: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

import { loginUser } from '@/lib/api/auth'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api/client'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LoginPage', () => {
  it('renders email input, password input, and submit button', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('renders link to /register', () => {
    render(<LoginPage />)
    expect(screen.getByRole('link', { name: /register/i })).toHaveAttribute('href', '/register')
  })

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.click(screen.getByRole('button', { name: /log in/i }))
    expect(await screen.findByText('Email is required.')).toBeInTheDocument()
    expect(await screen.findByText('Password is required.')).toBeInTheDocument()
  })

  it('shows email format error for invalid email', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.type(screen.getByLabelText(/email/i), 'notanemail')
    await user.click(screen.getByRole('button', { name: /log in/i }))
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
  })

  it('calls loginUser and redirects on success', async () => {
    vi.mocked(loginUser).mockResolvedValue({ access_token: 'acc', refresh_token: 'ref' })
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /log in/i }))
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ access_token: 'acc', refresh_token: 'ref' })
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  it('shows error toast on INVALID_CREDENTIALS', async () => {
    vi.mocked(loginUser).mockRejectedValue(new ApiError(401, 'INVALID_CREDENTIALS', 'Bad creds'))
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /log in/i }))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid email or password.')
    })
  })

  it('shows error toast on EMAIL_NOT_VERIFIED', async () => {
    vi.mocked(loginUser).mockRejectedValue(new ApiError(401, 'EMAIL_NOT_VERIFIED', 'Not verified'))
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /log in/i }))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please verify your email before logging in.')
    })
  })

  it('shows generic error toast on network failure', async () => {
    vi.mocked(loginUser).mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /log in/i }))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Something went wrong. Please try again.')
    })
  })
})
