import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from './useAuth'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

beforeEach(() => {
  localStorage.clear()
  mockPush.mockReset()
  document.cookie = 'fluxy_access_token=; max-age=0'
})

describe('useAuth', () => {
  it('returns isAuthenticated false and null token when localStorage is empty', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.accessToken).toBeNull()
  })

  it('login stores tokens in localStorage and sets isAuthenticated true', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => {
      result.current.login({ access_token: 'acc', refresh_token: 'ref' })
    })
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.accessToken).toBe('acc')
    expect(localStorage.getItem('fluxy_access_token')).toBe('acc')
    expect(localStorage.getItem('fluxy_refresh_token')).toBe('ref')
  })

  it('login sets the access token cookie', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => {
      result.current.login({ access_token: 'acc', refresh_token: 'ref' })
    })
    expect(document.cookie).toContain('fluxy_access_token=acc')
  })

  it('logout clears localStorage tokens', async () => {
    localStorage.setItem('fluxy_access_token', 'acc')
    localStorage.setItem('fluxy_refresh_token', 'ref')
    const { result } = renderHook(() => useAuth())
    await act(async () => {
      result.current.logout()
    })
    expect(localStorage.getItem('fluxy_access_token')).toBeNull()
    expect(localStorage.getItem('fluxy_refresh_token')).toBeNull()
  })

  it('logout sets isAuthenticated to false', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => {
      result.current.login({ access_token: 'acc', refresh_token: 'ref' })
    })
    await act(async () => {
      result.current.logout()
    })
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('logout redirects to /login', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => {
      result.current.logout()
    })
    expect(mockPush).toHaveBeenCalledWith('/login')
  })
})
