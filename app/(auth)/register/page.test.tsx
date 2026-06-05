import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/lib/api/auth', () => ({
  registerUser: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

import { registerUser } from '@/lib/api/auth'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api/client'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('RegisterPage', () => {
  it('renders email input, password input, and submit button', () => {
    render(<RegisterPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('renders link to /login', () => {
    render(<RegisterPage />)
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login')
  })

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)
    await user.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText('Email is required.')).toBeInTheDocument()
    expect(await screen.findByText('Password is required.')).toBeInTheDocument()
  })

  it('shows password length error for short password', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)
    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/password/i), 'abc')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText('Password must be at least 6 characters.')).toBeInTheDocument()
  })

  it('shows success toast on 201', async () => {
    vi.mocked(registerUser).mockResolvedValue({ message: 'Account created.' })
    const user = userEvent.setup()
    render(<RegisterPage />)
    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Account created. Please check your email to verify your account.',
      )
    })
  })

  it('shows error toast on EMAIL_IN_USE', async () => {
    vi.mocked(registerUser).mockRejectedValue(new ApiError(409, 'EMAIL_IN_USE', 'Email in use'))
    const user = userEvent.setup()
    render(<RegisterPage />)
    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('This email is already registered.')
    })
  })

  it('shows generic error toast on network failure', async () => {
    vi.mocked(registerUser).mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<RegisterPage />)
    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Something went wrong. Please try again.')
    })
  })
})
