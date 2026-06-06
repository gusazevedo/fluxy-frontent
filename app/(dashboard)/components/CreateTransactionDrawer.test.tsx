import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateTransactionDrawer } from './CreateTransactionDrawer'

function setup(open = true) {
  const onClose = vi.fn()
  const onCreate = vi.fn()
  render(<CreateTransactionDrawer open={open} onClose={onClose} onCreate={onCreate} />)
  return { onClose, onCreate }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CreateTransactionDrawer', () => {
  it('renders nothing when closed', () => {
    setup(false)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders a labelled modal dialog when open', () => {
    setup()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'create-transaction-title')
    expect(screen.getByRole('heading', { name: 'New transaction' })).toBeInTheDocument()
  })

  it('moves focus to the title field on open', async () => {
    setup()
    await waitFor(() => {
      expect(screen.getByLabelText('Title')).toHaveFocus()
    })
  })

  it('closes on the close button, Cancel, Escape, and backdrop click', async () => {
    const user = userEvent.setup()

    const { onClose: onClose1 } = setup()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose1).toHaveBeenCalledTimes(1)
    cleanup()

    const { onClose: onClose2 } = setup()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose2).toHaveBeenCalledTimes(1)
    cleanup()

    const { onClose: onClose3 } = setup()
    await user.keyboard('{Escape}')
    expect(onClose3).toHaveBeenCalledTimes(1)
    cleanup()

    const { onClose: onClose4 } = setup()
    await user.click(screen.getByTestId('create-transaction-backdrop'))
    expect(onClose4).toHaveBeenCalledTimes(1)
  })

  it('shows validation errors and does not call onCreate when empty', async () => {
    const user = userEvent.setup()
    const { onCreate } = setup()
    await user.click(screen.getByRole('button', { name: 'Create' }))
    expect(await screen.findByText('Title is required')).toBeInTheDocument()
    expect(screen.getByText('Value must be greater than 0')).toBeInTheDocument()
    expect(screen.getByText('Type is required')).toBeInTheDocument()
    expect(screen.getByText('Category is required')).toBeInTheDocument()
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('rejects a value of zero or below', async () => {
    const user = userEvent.setup()
    const { onCreate } = setup()
    await user.type(screen.getByLabelText('Title'), 'Salary')
    await user.type(screen.getByLabelText('Value'), '0')
    await user.selectOptions(screen.getByLabelText('Type'), 'income')
    await user.selectOptions(screen.getByLabelText('Category'), 'Bills')
    await user.click(screen.getByRole('button', { name: 'Create' }))
    expect(await screen.findByText('Value must be greater than 0')).toBeInTheDocument()
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('calls onCreate with a coerced numeric value on valid submit', async () => {
    const user = userEvent.setup()
    const { onCreate } = setup()
    await user.type(screen.getByLabelText('Title'), 'Gym membership')
    await user.type(screen.getByLabelText('Value'), '89.90')
    await user.selectOptions(screen.getByLabelText('Type'), 'outcome')
    await user.selectOptions(screen.getByLabelText('Category'), 'Gym')
    await user.click(screen.getByRole('button', { name: 'Create' }))
    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({
        title: 'Gym membership',
        value: 89.9,
        type: 'outcome',
        category: 'Gym',
      })
    })
  })
})
