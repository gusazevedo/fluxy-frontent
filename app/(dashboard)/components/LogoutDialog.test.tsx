import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogoutDialog } from './LogoutDialog'

const noop = () => {}

describe('LogoutDialog', () => {
  it('renders nothing when open is false', () => {
    render(<LogoutDialog open={false} onClose={noop} onConfirm={noop} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the dialog with heading and body when open is true', () => {
    render(<LogoutDialog open={true} onClose={noop} onConfirm={noop} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Log out?')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument()
  })

  it('has aria-modal=true and aria-labelledby pointing at the heading', () => {
    render(<LogoutDialog open={true} onClose={noop} onConfirm={noop} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'logout-dialog-title')
    expect(screen.getByText('Log out?').id).toBe('logout-dialog-title')
  })

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<LogoutDialog open={true} onClose={onClose} onConfirm={noop} />)
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onConfirm when Log out is clicked', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()
    render(<LogoutDialog open={true} onClose={noop} onConfirm={onConfirm} />)
    await user.click(screen.getByRole('button', { name: /log out/i }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(<LogoutDialog open={true} onClose={onClose} onConfirm={noop} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<LogoutDialog open={true} onClose={onClose} onConfirm={noop} />)
    fireEvent.click(screen.getByTestId('logout-dialog-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })

  it('does not call onClose when the dialog content is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<LogoutDialog open={true} onClose={onClose} onConfirm={noop} />)
    await user.click(screen.getByText('Are you sure you want to log out?'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('moves focus to the Cancel button when opened', () => {
    render(<LogoutDialog open={true} onClose={noop} onConfirm={noop} />)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /cancel/i }))
  })

  it('restores focus to the previously focused element when closed', () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'Trigger'
    document.body.appendChild(trigger)
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    const { rerender } = render(
      <LogoutDialog open={true} onClose={noop} onConfirm={noop} />,
    )
    rerender(<LogoutDialog open={false} onClose={noop} onConfirm={noop} />)

    expect(document.activeElement).toBe(trigger)
    document.body.removeChild(trigger)
  })

  it('does not call onClose on Escape when not open', () => {
    const onClose = vi.fn()
    render(<LogoutDialog open={false} onClose={onClose} onConfirm={noop} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })
})
