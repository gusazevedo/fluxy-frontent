import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Navbar } from './Navbar'

const mockLogout = vi.fn()

vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    accessToken: 'test-token',
    isAuthenticated: true,
    login: vi.fn(),
    logout: mockLogout,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Navbar', () => {
  it('renders the app name as a link to /', () => {
    render(<Navbar />)
    const link = screen.getByRole('link', { name: 'Fluxy' })
    expect(link).toHaveAttribute('href', '/')
  })

  it('renders a Log out button', () => {
    render(<Navbar />)
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
  })

  it('does not show the dialog initially', () => {
    render(<Navbar />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the dialog when the navbar Log out button is clicked', async () => {
    const user = userEvent.setup()
    render(<Navbar />)
    await user.click(screen.getByRole('button', { name: /log out/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes the dialog when Cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<Navbar />)
    await user.click(screen.getByRole('button', { name: /log out/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('calls logout when the dialog Log out button is confirmed', async () => {
    const user = userEvent.setup()
    render(<Navbar />)
    await user.click(screen.getByRole('button', { name: /log out/i }))
    const dialog = screen.getByRole('dialog')
    const confirmButton = within(dialog).getByRole('button', { name: /log out/i })
    await user.click(confirmButton)
    expect(mockLogout).toHaveBeenCalled()
  })

  it('does not call logout when the user cancels', async () => {
    const user = userEvent.setup()
    render(<Navbar />)
    await user.click(screen.getByRole('button', { name: /log out/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockLogout).not.toHaveBeenCalled()
  })
})
