# 05 — Salary Category & Type/Category Coupling

## Purpose

A transaction's `category` must be consistent with its `type`. It makes no
sense to record an **income** under an expense category (e.g. `Bills`), so a
dedicated `Salary` category is introduced for income.

This spec makes the **create transaction** form (see `spec/04-create-transaction.md`)
enforce the coupling by filtering the category options to match the selected
type, so an invalid combination can never be submitted.

This spec only changes form behaviour, the shared category type, and the Zod
validation. It does **not** change the optimistic-update flow, the drawer
shell, or the dashboard list rendering.

---

## Coupling Rule

The backend (`TransactionCategory` in `http://localhost:3333/docs`) now
includes `Salary` and documents the rule:

> The `Salary` category is reserved for `income` transactions: every `income`
> must use `Salary`, and `Salary` may not be used with `outcome` transactions.

This is a strict partition of the categories by type:

| `type` | Allowed `category` values |
|---|---|
| `income` | `Salary` (only) |
| `outcome` | `Bills`, `Health`, `Gym`, `Subscriptions`, `Food`, `Entertainment`, `Transport` |

- Every `income` transaction **must** use `Salary`.
- `Salary` **must not** be used with an `outcome` transaction.

The backend rejects violations with `422`; the frontend must prevent them in
the first place.

---

## Shared Types

`types/index.ts` — add `Salary` to the existing union:

```ts
export type TransactionCategory =
  | 'Bills'
  | 'Health'
  | 'Gym'
  | 'Subscriptions'
  | 'Food'
  | 'Entertainment'
  | 'Transport'
  | 'Salary'
```

Introduce two explicit groupings (co-located with the drawer, exported for
reuse and tests):

```ts
const INCOME_CATEGORY = 'Salary' as const
const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'Bills', 'Health', 'Gym', 'Subscriptions', 'Food', 'Entertainment', 'Transport',
]
```

These replace the single flat `CATEGORIES` list currently in
`CreateTransactionDrawer.tsx`.

---

## Validation Schema

Extend the Zod schema in `CreateTransactionDrawer.tsx` so the enum includes
`Salary` and a cross-field rule enforces the coupling:

- `category` enum includes all eight categories.
- A schema-level `.refine` (or `.superRefine`) enforces:
  - `type === 'income'` ⇒ `category === 'Salary'`
  - `type === 'outcome'` ⇒ `category !== 'Salary'`
- On violation, attach the error to the `category` field with the message:
  - income + non-Salary → **"Income must use the Salary category"**
  - outcome + Salary → **"Salary can only be used with income"**

The refine is a safety net that mirrors the backend. With the filtered UI
below, a user should not be able to trigger it through normal interaction.

---

## Form Behaviour

The form watches the selected `type` (React Hook Form `watch('type')`) and
drives the category field from it.

### No type selected yet (initial state)

- The category field is **disabled** and shows the placeholder
  (`"Select a category"`); its value is empty.
- Submitting in this state surfaces the existing required-field errors for
  both `type` and `category`.

### Type = `outcome`

- The category `<select>` is **enabled** and lists the seven
  `EXPENSE_CATEGORIES` (plus the disabled placeholder option).
- The user picks one of the seven.

### Type = `income`

- The category is **automatically set to `Salary`** and the field is
  **disabled (locked)** so it is visible but not editable.
- Only `Salary` is shown as the selected value.

### Switching type after a category was chosen

When `type` changes, the category must be reconciled so a stale/invalid value
is never submitted:

| Transition | Category result |
|---|---|
| → `income` | force `category = 'Salary'` |
| → `outcome` | if current category is `Salary` (or empty), reset to empty so the user re-picks a valid expense category |

This reconciliation runs as an effect on the watched `type` value (e.g.
`setValue('category', …)` with validation revalidated).

---

## UI

No new layout. The existing Type and Category controls from
`spec/04-create-transaction.md` are reused, with these adjustments:

- **Type** select: unchanged (Income / Outcome options + placeholder).
- **Category** select:
  - `disabled` when no type is selected or when type is `income`.
  - When `income`, it displays `Salary` (the locked value).
  - When `outcome`, it lists the seven expense categories.
- A disabled control must still be visually legible (e.g. muted background)
  and keep its label; use Tailwind utilities only.

The dashboard transaction list renders `Salary` like any other category badge
— no list/summary changes are required (`income` rows already render green
with a `+` prefix).

---

## Components

### `CreateTransactionDrawer.tsx`

- Replace the flat `CATEGORIES` constant with `INCOME_CATEGORY` and
  `EXPENSE_CATEGORIES`.
- Add the coupling `.refine` to `createTransactionSchema`.
- `watch('type')` and:
  - compute the category options shown,
  - disable the category field for `income` / no-type,
  - reconcile the category value via an effect when `type` changes.
- All other behaviour (focus management, close handlers, optimistic submit via
  `onCreate`) is unchanged.

No changes to `lib/api/transactions.ts`, the optimistic flow in
`app/(dashboard)/page.tsx`, or `TransactionItem.tsx`.

---

## File Structure

```
app/
  (dashboard)/
    components/
      CreateTransactionDrawer.tsx        ← coupling logic + Salary
      CreateTransactionDrawer.test.tsx   ← add coupling tests
types/
  index.ts                               ← add 'Salary' to TransactionCategory
```

---

## Acceptance Criteria

- [ ] `TransactionCategory` includes `Salary`.
- [ ] With no type selected, the category field is disabled and empty.
- [ ] Selecting **Outcome** enables the category field and offers exactly the seven expense categories (no `Salary`).
- [ ] Selecting **Income** auto-selects `Salary` and locks (disables) the category field.
- [ ] Switching from Income to Outcome clears the `Salary` value so the user must pick a valid expense category.
- [ ] Switching from Outcome to Income sets the category to `Salary`.
- [ ] The Zod schema rejects `income` + non-`Salary` and `outcome` + `Salary`, with the category-field error messages above.
- [ ] A valid income submit calls `onCreate` with `{ type: 'income', category: 'Salary', … }`.
- [ ] A valid outcome submit calls `onCreate` with `{ type: 'outcome', category: <expense>, … }`.
- [ ] No changes to the optimistic-update flow, drawer shell, or list/summary rendering.
- [ ] All changed files have co-located passing Vitest tests.
