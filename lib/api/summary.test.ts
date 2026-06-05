import { describe, it, expect, vi, afterEach } from 'vitest'
import { getBalance } from './summary'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getBalance', () => {
  it('returns the balance summary on 200', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ income: 5000, outcome: 1320.5, balance: 3679.5 }),
      }),
    )
    const result = await getBalance('token-123')
    expect(result).toEqual({ income: 5000, outcome: 1320.5, balance: 3679.5 })
  })

  it('sends Authorization header with Bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ income: 0, outcome: 0, balance: 0 }),
    })
    vi.stubGlobal('fetch', fetchMock)
    await getBalance('token-123')
    const [, options] = fetchMock.mock.calls[0]
    expect(options.headers.Authorization).toBe('Bearer token-123')
  })

  it('calls the /summary/balance endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ income: 0, outcome: 0, balance: 0 }),
    })
    vi.stubGlobal('fetch', fetchMock)
    await getBalance('t')
    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain('/summary/balance')
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
    await expect(getBalance('bad')).rejects.toMatchObject({ status: 401 })
  })
})
