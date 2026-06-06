import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate } from './format'

describe('formatCurrency', () => {
  it('formats positive value with two decimals', () => {
    expect(formatCurrency(150.75)).toBe('$150.75')
  })

  it('formats zero as $0.00', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats large value with thousands separator', () => {
    expect(formatCurrency(5000)).toBe('$5,000.00')
  })

  it('rounds to two decimal places', () => {
    expect(formatCurrency(99.999)).toBe('$100.00')
  })

  it('formats fractional values correctly', () => {
    expect(formatCurrency(1320.5)).toBe('$1,320.50')
  })
})

describe('formatDate', () => {
  it('formats a midday UTC date in medium en-US style', () => {
    const result = formatDate('2024-03-15T12:00:00Z')
    expect(result).toContain('Mar')
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })

  it('returns a non-empty string for a valid ISO string', () => {
    expect(formatDate('2024-01-01T12:00:00Z')).toBeTruthy()
  })

  it('returns an empty string instead of throwing for missing/invalid input', () => {
    expect(formatDate(undefined as unknown as string)).toBe('')
    expect(formatDate('')).toBe('')
    expect(formatDate('not-a-date')).toBe('')
  })

  it('parses a numeric epoch (seconds) string', () => {
    expect(formatDate('1710504000')).toContain('2024')
  })
})
