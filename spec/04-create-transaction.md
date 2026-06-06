# 04 — Create Transaction

## Purpose

Let an authenticated user create a new transaction from the dashboard. A **"New transaction"** button is added next to the "Transactions" list title. Clicking it opens a **right-side drawer** containing a form. The form is validated client-side with **React Hook Form + Zod** and submits to `POST /transactions`.

Creation uses **optimistic updates**: the new transaction appears in the list (and is reflected in the balance summary) immediately on submit, and the drawer closes right away. If the request fails, the optimistic transaction is removed and the summary is rolled back to its previous values, and an error toast is shown.

This feature builds directly on the dashboard (`spec/02-dashboard.md`). It must not change the existing fetch-on-mount behaviour, only add creation.

---

## API Endpoint

### POST /transactions

Creates a transaction for the authenticated user.

**Auth:** `Authorization: Bearer <access_token>` required.

**Request body** (`CreateTransactionInput`):

```ts
{
  title: string             // required, non-empty (minLength 1)
  value: number             // required, strictly > 0 (exclusiveMinimum 0)
  type: 'income' | 'outcome'
  category: TransactionCategory
}
```

`TransactionCategory` is one of: `Bills`, `Health`, `Gym`, `Subscriptions`, `Food`, `Entertainment`, `Transport` (defined in `spec/02-dashboard.md`).

**Response 201** — the created `Transaction`:

```ts
{
  id: string         // UUID
  title: string
  value: number
  type: 'income' | 'outcome'
  category: TransactionCategory
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
}
```

**Response 401:** token missing or expired → call `logout()` (clears tokens, redirects to `/login`).

**Response 422:** validation rejected by the server → treat as a creation failure (roll back the optimistic update, show an error toast).

---

## Shared Types

Add to `types/index.ts`:

```ts
export interface CreateTransactionInput {
  title: string
  value: number
  type: TransactionType
  category: TransactionCategory
}
```

`TransactionType` and `TransactionCategory` already exist from `spec/02-dashboard.md`.

---

## API Helper

### `lib/api/transactions.ts`

Add a `createTransaction` function alongside the existing `getTransactions`:

```ts
createTransaction(
  token: string,
  input: CreateTransactionInput,
): Promise<Transaction>
```

Calls `POST /transactions` via `apiRequest` with:
- `method: 'POST'`
- `body: input`
- `headers: { Authorization: \`Bearer ${token}\` }`

Returns the created `Transaction` from the 201 response. Errors propagate as `ApiError` (handled by the caller).

---

## Validation Schema

Defined with Zod, co-located with the drawer component. It mirrors the API contract exactly:

| Field | Rule | Message |
|---|---|---|
| `title` | non-empty string (trimmed) | "Title is required" |
| `value` | number, strictly greater than `0` | "Value must be greater than 0" |
| `type` | one of `income`, `outcome` | "Type is required" |
| `category` | one of the seven categories | "Category is required" |

Notes:
- The `value` input is a text/number field; coerce the string to a number for validation (e.g. `z.coerce.number()`), and reject `0`, negative, and non-numeric input.
- The inferred Zod type must be assignable to `CreateTransactionInput`. Do not use `any`.

---

## UI

### Trigger button (next to the list title)

The dashboard's Transactions section currently renders the title as a bare heading:

```tsx
<h2 className="text-lg font-semibold text-gray-900 mb-3">Transactions</h2>
```

Wrap the title and a new button in a single flex container (`flex items-center justify-between`) so the button sits on the right of the **same div** as the title:

- Left: the existing "Transactions" heading.
- Right: a **"New transaction"** button (primary style — built from Tailwind utilities only).

The button opens the drawer (`open = true`). It must have an accessible label (visible text "New transaction" is enough).

### Drawer

A right-side panel ("drawer") that slides in from the right edge of the viewport.

- A fixed, semi-transparent dark backdrop covers the rest of the page while the drawer is open; the page behind is non-interactive.
- The drawer panel is anchored to the right (`fixed top-0 right-0 h-full`), full height, with a fixed width (approx. `24rem` / `w-96`, full width on small screens).
- White background, soft shadow on the left edge, vertical padding.
- Header row: a title **"New transaction"** and a close (✕) button.
- Body: the form (fields below), then the action buttons.

Accessibility (consistent with `LogoutDialog` in `spec/03-logout.md`):
- The panel uses `role="dialog"` and `aria-modal="true"`.
- The panel is labelled by its heading via `aria-labelledby`.
- Focus moves to the first field (Title) when the drawer opens.
- An Escape key listener on `window` closes the drawer.
- A backdrop click closes the drawer.

The drawer closes on **any** of: the close (✕) button, the Escape key, a backdrop click, a successful (optimistic) submit. Closing via ✕ / Escape / backdrop discards the form (no transaction created).

### Form fields

| Field | Control | Notes |
|---|---|---|
| Title | text input | placeholder e.g. "Gym membership" |
| Value | number input | `min`/`step` appropriate for currency; must be > 0 |
| Type | select (or two-option control) | options: Income, Outcome |
| Category | select | the seven categories listed above |

- Each field shows its validation error message inline when invalid (after submit attempt / on blur, per React Hook Form defaults).
- Action buttons at the bottom:
  - **Cancel** — closes the drawer without creating (neutral style).
  - **Create** — submits the form (primary style). Disabled while a submit is in flight.

All styling is built from scratch with Tailwind utility classes. No component library may be installed.

---

## Optimistic Update Behaviour

State for both `transactions` and `summary` lives in the dashboard page (`app/(dashboard)/page.tsx`). The create flow owns the optimistic mutation of both.

On **submit** (after Zod validation passes):

1. Build an **optimistic transaction** from the form input:
   - `id`: a temporary client-generated id (`crypto.randomUUID()`).
   - `title`, `value`, `type`, `category`: from the form.
   - `created_at` / `updated_at`: current time as ISO 8601 (`new Date().toISOString()`).
2. Snapshot the current `transactions` and `summary` (for rollback).
3. **Prepend** the optimistic transaction to the list (newest first).
4. **Adjust the summary optimistically:**
   - if `type === 'income'`: `income += value`
   - if `type === 'outcome'`: `outcome += value`
   - `balance += (type === 'income' ? value : -value)`
   - (If `summary` is currently `null` because the summary failed to load, skip the summary adjustment — only the list is updated.)
5. **Close the drawer** and reset the form immediately.
6. Call `createTransaction(token, input)`.

On **success (201):**
- Replace the optimistic transaction (matched by its temporary `id`) with the real `Transaction` returned by the API. The summary stays as already adjusted (the optimistic delta equals the real delta).

On **failure:**
- **401:** call `logout()` (clears tokens, redirects to `/login`). No toast needed.
- **Any other error (incl. 422):**
  - Remove the optimistic transaction from the list (restore the snapshot list).
  - Restore the summary to its snapshot values.
  - Show `toast.error("Failed to create transaction. Please try again.")`.
  - The drawer stays closed; the form is not re-opened.

The optimistic row must be visually indistinguishable from a normal row (no special "pending" styling is required by this spec).

---

## Components

### `CreateTransactionDrawer.tsx`

**Location:** `app/(dashboard)/components/CreateTransactionDrawer.tsx`

Client component. Renders the drawer shell and the React Hook Form + Zod form. It is presentational with respect to persistence — it does **not** call the API or own the transaction list. It delegates the actual creation to its parent via `onCreate`.

```ts
interface CreateTransactionDrawerProps {
  open: boolean
  onClose: () => void
  onCreate: (input: CreateTransactionInput) => void
}
```

- Returns `null` when `open === false`.
- Uses `useForm` with `zodResolver(schema)`.
- On valid submit: calls `onCreate(input)` (the parent performs the optimistic update, closes the drawer, and fires the request).
- Resets the form whenever it closes.
- Implements the drawer accessibility/close behaviour described in **UI → Drawer**.

### Dashboard page wiring

**Location:** `app/(dashboard)/page.tsx`

- Add local `drawerOpen` state.
- Wrap the "Transactions" heading and the new "New transaction" button in a flex container (the **same div**).
- Define a `handleCreate(input: CreateTransactionInput)` callback implementing the **Optimistic Update Behaviour** above (mutating both `transactions` and `summary`, closing the drawer, calling `createTransaction`, and handling success/401/error).
- Render `<CreateTransactionDrawer open={drawerOpen} onClose={...} onCreate={handleCreate} />`.

The existing fetch-on-mount logic, error toasts, and 401 handling for `getBalance` / `getTransactions` are unchanged.

---

## File Structure

```
app/
  (dashboard)/
    page.tsx                              ← add button + drawer state + handleCreate
    page.test.tsx                         ← add optimistic-create tests
    components/
      CreateTransactionDrawer.tsx         ← NEW
      CreateTransactionDrawer.test.tsx    ← NEW
lib/
  api/
    transactions.ts                       ← add createTransaction
    transactions.test.ts                  ← add createTransaction tests
types/
  index.ts                               ← add CreateTransactionInput
```

---

## Acceptance Criteria

- [ ] A "New transaction" button appears in the same flex container as the "Transactions" list title, aligned to the right.
- [ ] Clicking the button opens a right-side drawer with the creation form.
- [ ] The drawer closes on the ✕ button, Escape key, backdrop click, and on a successful submit.
- [ ] The drawer has `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at its heading, and moves focus to the Title field on open.
- [ ] The form has Title, Value, Type, and Category fields matching the API's `CreateTransactionInput`.
- [ ] Validation is done with React Hook Form + Zod: empty title, value ≤ 0, and missing type/category are rejected with inline messages, and no request is sent.
- [ ] On valid submit, the transaction is prepended to the list and the summary cards update optimistically, and the drawer closes immediately.
- [ ] On a successful 201, the optimistic row is replaced by the server's transaction (real `id`, timestamps).
- [ ] On a non-401 error (including 422), the optimistic row is removed, the summary is rolled back, and `toast.error("Failed to create transaction. Please try again.")` is shown.
- [ ] On a 401 error, `logout()` is called (tokens cleared, redirect to `/login`).
- [ ] `createTransaction` calls `POST /transactions` with the bearer token and JSON body and returns the created transaction.
- [ ] No component library is installed; all styling is Tailwind utility classes; no `any` types are introduced.
- [ ] All new/changed files have co-located passing Vitest tests.
</content>
</invoke>
