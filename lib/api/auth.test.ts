import { describe, it, expect, vi, afterEach } from 'vitest'
import { registerUser, loginUser } from './auth'
import { ApiError } from './client'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('registerUser', () => {
  it('returns the message on 201', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ message: 'Account created.' }),
    }))
    const result = await registerUser({ email: 'a@b.com', password: 'secret123' })
    expect(result.message).toBe('Account created.')
  })

  it('throws ApiError with EMAIL_IN_USE code on 409', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      statusText: 'Conflict',
      json: async () => ({ code: 'EMAIL_IN_USE', message: 'Email in use' }),
    }))
    await expect(registerUser({ email: 'a@b.com', password: 'secret123' }))
      .rejects.toMatchObject({ status: 409, code: 'EMAIL_IN_USE' })
  })

  it('throws ApiError with VALIDATION_ERROR code on 422', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      json: async () => ({ code: 'VALIDATION_ERROR', message: 'Invalid fields' }),
    }))
    await expect(registerUser({ email: 'bad', password: '' }))
      .rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })
  })

  it('throws ApiError with UNKNOWN_ERROR when body has no code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({}),
    }))
    await expect(registerUser({ email: 'a@b.com', password: 'secret123' }))
      .rejects.toBeInstanceOf(ApiError)
  })
})

describe('loginUser', () => {
  it('returns tokens on 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access_token: 'access', refresh_token: 'refresh' }),
    }))
    const result = await loginUser({ email: 'a@b.com', password: 'secret123' })
    expect(result.access_token).toBe('access')
    expect(result.refresh_token).toBe('refresh')
  })

  it('throws ApiError with INVALID_CREDENTIALS on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ code: 'INVALID_CREDENTIALS', message: 'Bad credentials' }),
    }))
    await expect(loginUser({ email: 'a@b.com', password: 'wrong' }))
      .rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' })
  })

  it('throws ApiError with EMAIL_NOT_VERIFIED on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ code: 'EMAIL_NOT_VERIFIED', message: 'Verify email' }),
    }))
    await expect(loginUser({ email: 'a@b.com', password: 'secret123' }))
      .rejects.toMatchObject({ status: 401, code: 'EMAIL_NOT_VERIFIED' })
  })
})
