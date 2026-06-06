const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

export function formatDate(isoString: string): string {
  const date = parseDate(isoString)
  return date === null ? '' : dateFormatter.format(date)
}

function parseDate(value: string): Date | null {
  if (typeof value !== 'string' || value.length === 0) return null

  const direct = new Date(value)
  if (!Number.isNaN(direct.getTime())) return direct

  // Some backends return the timestamp as a numeric epoch (seconds or ms).
  if (/^\d+$/.test(value)) {
    const epoch = new Date(value.length <= 10 ? Number(value) * 1000 : Number(value))
    if (!Number.isNaN(epoch.getTime())) return epoch
  }

  return null
}
