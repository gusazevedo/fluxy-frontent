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
  return dateFormatter.format(new Date(isoString))
}
