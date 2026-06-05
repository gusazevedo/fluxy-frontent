import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from './proxy'

function makeRequest(path: string, cookie?: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: cookie ? { cookie } : undefined,
  })
}

describe('proxy', () => {
  it('redirects unauthenticated users from a protected route to /login', () => {
    const req = makeRequest('/dashboard')
    const res = proxy(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
  })

  it('redirects unauthenticated users from / to /login', () => {
    const req = makeRequest('/')
    const res = proxy(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
  })

  it('allows unauthenticated users to access /login', () => {
    const req = makeRequest('/login')
    const res = proxy(req)
    expect(res.status).toBe(200)
  })

  it('allows unauthenticated users to access /register', () => {
    const req = makeRequest('/register')
    const res = proxy(req)
    expect(res.status).toBe(200)
  })

  it('allows authenticated users to access a protected route', () => {
    const req = makeRequest('/dashboard', 'fluxy_access_token=valid-token')
    const res = proxy(req)
    expect(res.status).toBe(200)
  })

  it('redirects authenticated users from /login to /', () => {
    const req = makeRequest('/login', 'fluxy_access_token=valid-token')
    const res = proxy(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toMatch(/\/$/)
  })

  it('redirects authenticated users from /register to /', () => {
    const req = makeRequest('/register', 'fluxy_access_token=valid-token')
    const res = proxy(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toMatch(/\/$/)
  })
})
