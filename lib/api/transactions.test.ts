import { describe, it, expect, vi, afterEach } from 'vitest'
import type { CreateTransactionInput, Transaction } from '@/types'
import { createTransaction, getTransactions } from './transactions'

// Domain shape used across the app.
const sample: Transaction = {
  id: 'tx-1',
  title: 'Gym membership',
  value: 89.9,
  type: 'outcome',
  category: 'Gym',
  created_at: '2024-03-15T12:00:00Z',
  updated_at: '2024-03-15T12:00:00Z',
}

// Exactly what the backend returns: camelCase keys, value as a string,
// plus an extra userId field.
const sampleDTO = {
  id: 'tx-1',
  userId: 'user-1',
  title: 'Gym membership',
  value: '89.90',
  type: 'outcome',
  category: 'Gym',
  createdAt: '2024-03-15T12:00:00Z',
  updatedAt: '2024-03-15T12:00:00Z',
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getTransactions', () => {
  it('maps the backend DTO (camelCase, string value) to the domain shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [sampleDTO],
      }),
    )
    const result = await getTransactions('token-123')
    expect(result).toEqual([sample])
    expect(result[0].value).toBe(89.9)
    expect(result[0].created_at).toBe('2024-03-15T12:00:00Z')
  })

  it('returns an empty array when user has no transactions', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      }),
    )
    expect(await getTransactions('token-123')).toEqual([])
  })

  it('sends Authorization header with Bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    })
    vi.stubGlobal('fetch', fetchMock)
    await getTransactions('token-123')
    const [, options] = fetchMock.mock.calls[0]
    expect(options.headers.Authorization).toBe('Bearer token-123')
  })

  it('calls the /transactions endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    })
    vi.stubGlobal('fetch', fetchMock)
    await getTransactions('t')
    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain('/transactions')
  })

  it('throws ApiError on 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ code: 'UNAUTHORIZED', message: 'Bad token' }),
      }),
    )
    await expect(getTransactions('bad')).rejects.toMatchObject({ status: 401 })
  })
})

const createInput: CreateTransactionInput = {
  title: 'Gym membership',
  value: 89.9,
  type: 'outcome',
  category: 'Gym',
}

describe('createTransaction', () => {
  it('maps the created DTO to the domain shape on 201', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => sampleDTO,
      }),
    )
    const result = await createTransaction('token-123', createInput)
    expect(result).toEqual(sample)
    expect(result.value).toBe(89.9)
    expect(result.created_at).toBe('2024-03-15T12:00:00Z')
  })

  it('POSTs to /transactions with the input as JSON body and Bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => sampleDTO,
    })
    vi.stubGlobal('fetch', fetchMock)
    await createTransaction('token-123', createInput)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toContain('/transactions')
    expect(options.method).toBe('POST')
    expect(options.headers.Authorization).toBe('Bearer token-123')
    expect(JSON.parse(options.body)).toEqual(createInput)
  })

  it('throws ApiError on 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ code: 'UNAUTHORIZED', message: 'Bad token' }),
      }),
    )
    await expect(createTransaction('bad', createInput)).rejects.toMatchObject({ status: 401 })
  })

  it('throws ApiError on 422', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => ({ code: 'VALIDATION_ERROR', message: 'Invalid' }),
      }),
    )
    await expect(createTransaction('t', createInput)).rejects.toMatchObject({ status: 422 })
  })
})
