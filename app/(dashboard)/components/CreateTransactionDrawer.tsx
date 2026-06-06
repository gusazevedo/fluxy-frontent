'use client'

import { useEffect, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CreateTransactionInput, TransactionCategory } from '@/types'

const INCOME_CATEGORY = 'Salary' as const
const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'Bills',
  'Health',
  'Gym',
  'Subscriptions',
  'Food',
  'Entertainment',
  'Transport',
]

export const createTransactionSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required'),
    value: z.coerce.number('Value must be a number').gt(0, 'Value must be greater than 0'),
    type: z.enum(['income', 'outcome'], 'Type is required'),
    category: z.enum(
      ['Bills', 'Health', 'Gym', 'Subscriptions', 'Food', 'Entertainment', 'Transport', 'Salary'],
      'Category is required',
    ),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'income' && data.category !== INCOME_CATEGORY) {
      ctx.addIssue({
        code: 'custom',
        path: ['category'],
        message: 'Income must use the Salary category',
      })
    }
    if (data.type === 'outcome' && data.category === INCOME_CATEGORY) {
      ctx.addIssue({
        code: 'custom',
        path: ['category'],
        message: 'Salary can only be used with income',
      })
    }
  })

type CreateTransactionFormInput = z.input<typeof createTransactionSchema>
export type CreateTransactionFormValues = z.output<typeof createTransactionSchema>

interface CreateTransactionDrawerProps {
  open: boolean
  onClose: () => void
  onCreate: (input: CreateTransactionInput) => void
}

export function CreateTransactionDrawer({
  open,
  onClose,
  onCreate,
}: CreateTransactionDrawerProps) {
  const titleInputRef = useRef<HTMLInputElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<CreateTransactionFormInput, unknown, CreateTransactionFormValues>({
    resolver: zodResolver(createTransactionSchema),
  })

  const { ref: titleRhfRef, ...titleField } = register('title')

  const selectedType = useWatch({ control, name: 'type' })
  const categoryDisabled = isSubmitting || selectedType !== 'outcome'

  // Keep category consistent with the selected type (see spec 05).
  useEffect(() => {
    if (selectedType === 'income') {
      setValue('category', INCOME_CATEGORY, { shouldValidate: true })
    } else if (selectedType === 'outcome' && getValues('category') === INCOME_CATEGORY) {
      resetField('category')
    }
  }, [selectedType, setValue, getValues, resetField])

  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement | null
    titleInputRef.current?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      reset()
      previouslyFocused.current?.focus()
    }
  }, [open, onClose, reset])

  if (!open) return null

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  function onSubmit(data: CreateTransactionFormValues) {
    onCreate(data)
  }

  return (
    <div
      data-testid="create-transaction-backdrop"
      className="fixed inset-0 z-50 bg-black/50"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-transaction-title"
        className="fixed top-0 right-0 h-full w-full max-w-sm overflow-y-auto bg-white px-6 py-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2
            id="create-transaction-title"
            className="text-lg font-semibold text-gray-900"
          >
            New transaction
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ×
            </span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              id="title"
              type="text"
              placeholder="Gym membership"
              disabled={isSubmitting}
              ref={(el) => {
                titleRhfRef(el)
                titleInputRef.current = el
              }}
              {...titleField}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
              Value
            </label>
            <input
              id="value"
              type="number"
              step="0.01"
              min="0"
              placeholder="89.90"
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              {...register('value')}
            />
            {errors.value && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {errors.value.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="type"
              defaultValue=""
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              {...register('type')}
            >
              <option value="" disabled>
                Select a type
              </option>
              <option value="income">Income</option>
              <option value="outcome">Outcome</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {errors.type.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              defaultValue=""
              disabled={categoryDisabled}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70"
              {...register('category')}
            >
              {selectedType === 'income' ? (
                <option value={INCOME_CATEGORY}>{INCOME_CATEGORY}</option>
              ) : (
                <>
                  <option value="" disabled>
                    Select a category
                  </option>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </>
              )}
            </select>
            {errors.category && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {errors.category.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
