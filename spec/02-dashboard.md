# 02 — Dashboard (Home Screen)

## Purpose

The home screen (`/`) is the main authenticated view. It displays a financial summary (total income, total outcome, and net balance) followed by a complete list of the user's transactions. Both sections are fetched in parallel on mount.

---

## API Endpoints

### GET /summary/balance

Returns the user's aggregate financial data.

**Auth:** `Authorization: Bearer <access_token>` required.

**Response 200**

```ts
{
  income: number   // total income (≥ 0)
  outcome: number  // total outcome (≥ 0)
  balance: number  // net balance (may be negative)
}
```

**Response 401:** token missing or expired → clear tokens and redirect to `/login`.

---

### GET /transactions

Returns all transactions for the authenticated user. Returns an empty array `[]` when the user has no transactions.

**Auth:** `Authorization: Bearer <access_token>` required.

**Query params (not used on this page):** `type`, `category`.

**Response 200**

```ts
Array<{
  id: string         // UUID
  title: string
  value: number      // always > 0
  type: 'income' | 'outcome'
  category: TransactionCategory
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
}>
```

**Response 401:** token missing or expired → clear tokens and redirect to `/login`.

---

## Shared Types

Add to `types/index.ts`:

```ts
export type TransactionType = 'income' | 'outcome'

export type TransactionCategory =
  | 'Bills'
  | 'Health'
  | 'Gym'
  | 'Subscriptions'
  | 'Food'
  | 'Entertainment'
  | 'Transport'

export interface Transaction {
  id: string
  title: string
  value: number
  type: TransactionType
  category: TransactionCategory
  created_at: string
  updated_at: string
}

export interface BalanceSummary {
  income: number
  outcome: number
  balance: number
}
```

---

## API Helpers

### `lib/api/summary.ts`

```ts
getBalance(token: string): Promise<BalanceSummary>
```

Calls `GET /summary/balance` with `Authorization: Bearer <token>`.

### `lib/api/transactions.ts`

```ts
getTransactions(token: string): Promise<Transaction[]>
```

Calls `GET /transactions` with `Authorization: Bearer <token>`.

Both use `apiRequest` from `lib/api/client.ts` passing `headers: { Authorization: \`Bearer ${token}\` }`.

---

## Formatting Utilities

Create `lib/utils/format.ts` with two functions:

### `formatCurrency(value: number): string`

Formats a number as a monetary value with two decimal places.

- Uses `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`.
- Always formats the raw `value` (which is always positive from the API). The sign prefix (`+` / `−`) is added by the UI layer, not this function.

### `formatDate(isoString: string): string`

Formats an ISO 8601 date string to a human-readable short date.

- Uses `Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })`.
- Example: `"2024-03-15T10:00:00Z"` → `"Mar 15, 2024"`.

---

## Page — `/`

**File:** `app/(dashboard)/page.tsx`

This is a **Client Component** (`'use client'`). It uses `useAuth()` to obtain the `accessToken` and fetches both endpoints in parallel on mount via `useEffect`.

### On mount behaviour

1. Call `getBalance(token)` and `getTransactions(token)` in parallel (`Promise.all`).
2. Show a loading skeleton for both sections while fetching.
3. On **401** from either call: call `logout()` from `useAuth` (clears tokens, redirects to `/login`).
4. On any other error: show `toast.error("Failed to load data. Please try again.")` and render an error state in the affected section.
5. On success: render the summary cards and transaction list.

---

## Summary Section

Displays three cards in a row (stacks vertically on mobile):

| Card | Value | Colour |
|---|---|---|
| Total Income | `formatCurrency(balance.income)` | Green (`text-green-600`) |
| Total Outcome | `formatCurrency(balance.outcome)` | Red (`text-red-600`) |
| Balance | `formatCurrency(Math.abs(balance.balance))` with sign prefix | Green if ≥ 0, red if < 0 |

- Balance card prefix: `+` if `balance.balance ≥ 0`, `−` if negative.
- **Loading state:** render three placeholder skeleton cards.
- **Error state:** render three cards with `—` as the value.

**Component:** `app/(dashboard)/components/SummaryCards.tsx`

Props:
```ts
interface SummaryCardsProps {
  summary: BalanceSummary | null
  loading: boolean
}
```

---

## Transaction List Section

Displayed below the summary section.

### Non-empty state

Renders a list where each item shows:

| Field | Display |
|---|---|
| Title | Bold, primary text |
| Category | Small muted badge/tag |
| Date | `formatDate(transaction.created_at)`, muted |
| Value | `+ formatCurrency(value)` in green for `income`; `− formatCurrency(value)` in red for `outcome` |

Transactions are displayed in the order returned by the API (no client-side sorting).

### Empty state

When `transactions` is an empty array, display a centred message:

> "No transactions yet. Your transactions will appear here."

### Loading state

Show a list of skeleton placeholder rows (minimum 3).

### Error state

Show a centred message: "Could not load transactions."

**Component:** `app/(dashboard)/components/TransactionList.tsx`

Props:
```ts
interface TransactionListProps {
  transactions: Transaction[]
  loading: boolean
  error: boolean
}
```

**Sub-component:** `app/(dashboard)/components/TransactionItem.tsx`

Props:
```ts
interface TransactionItemProps {
  transaction: Transaction
}
```

---

## File Structure

```
app/
  (dashboard)/
    page.tsx
    page.test.tsx
    components/
      SummaryCards.tsx
      SummaryCards.test.tsx
      TransactionList.tsx
      TransactionList.test.tsx
      TransactionItem.tsx
      TransactionItem.test.tsx
lib/
  api/
    summary.ts
    summary.test.ts
    transactions.ts
    transactions.test.ts
  utils/
    format.ts
    format.test.ts
types/
  index.ts   ← add Transaction, BalanceSummary, TransactionType, TransactionCategory
```

---

## Acceptance Criteria

- [ ] Balance summary and transaction list are fetched in parallel on mount.
- [ ] A loading skeleton is shown while data is being fetched.
- [ ] Summary cards display the correct income, outcome, and balance values.
- [ ] Balance card is green when ≥ 0 and red when negative.
- [ ] Each transaction row shows title, category badge, formatted date, and signed formatted value.
- [ ] Income values are green with `+` prefix; outcome values are red with `−` prefix.
- [ ] An empty state message is shown when the transaction list is empty.
- [ ] A 401 response from either endpoint triggers logout and redirect to `/login`.
- [ ] A non-401 error shows a toast and renders the error state in the affected section.
- [ ] `formatCurrency` correctly formats positive and zero values.
- [ ] `formatDate` correctly converts ISO 8601 strings to readable dates.
- [ ] All files in the file structure have co-located passing Vitest tests.
