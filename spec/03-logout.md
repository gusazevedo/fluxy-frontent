# 03 — Logout

## Purpose

Give authenticated users a way to log out. A persistent top navbar is added to every page inside the `(dashboard)` route group. It contains the app name on the left and a "Log out" button on the right. Clicking the button opens a confirmation dialog; the user must explicitly confirm before tokens are cleared and they are redirected to `/login`.

The navbar must **not** appear on `/login` or `/register` (the `(auth)` group has its own layout).

---

## Behaviour

### Logging out

1. User clicks the **Log out** button in the navbar.
2. A confirmation dialog appears with the message: **"Are you sure you want to log out?"**
3. The dialog has two buttons:
   - **Cancel** — closes the dialog, no state change.
   - **Log out** — calls `logout()` from `useAuth`, which clears tokens, clears the cookie, and redirects to `/login`.
4. While the dialog is open, the rest of the page is dimmed by a semi-transparent backdrop and is non-interactive.

### Closing the dialog

The dialog must close on **any** of these actions:

| Action | Result |
|---|---|
| Click the **Cancel** button | Dialog closes, no logout |
| Press the **Escape** key | Dialog closes, no logout |
| Click the backdrop (outside the dialog box) | Dialog closes, no logout |
| Click the **Log out** button | `logout()` is called (page navigates away) |

---

## Accessibility

The dialog must:

- Use `role="dialog"` and `aria-modal="true"` on the dialog container.
- Be labelled by its heading via `aria-labelledby`.
- Trap focus inside the dialog while open (Tab and Shift+Tab cycle within the dialog).
- Move focus to the **Cancel** button when the dialog opens.
- Return focus to the triggering "Log out" navbar button when the dialog closes (when cancelled or escaped).

The navbar logout button must have an accessible label (visible text "Log out" is enough).

---

## UI

### Navbar

A sticky top bar on every dashboard page.

| Side | Element |
|---|---|
| Left | App name **"Fluxy"** — bold, links to `/` |
| Right | **Log out** button |

Visual:
- Background: white with a thin bottom border.
- Sticky at the top of the viewport (`sticky top-0`).
- Horizontal padding matches the page container (consistent with the dashboard's max-width).
- Mobile: same layout (flex row, space-between). No hamburger menu needed.

### Confirmation Dialog

- Centred vertically and horizontally in the viewport.
- Semi-transparent dark backdrop covers the rest of the page.
- Dialog box: white background, rounded corners, soft shadow, max-width approx. `28rem`.
- Heading: "Log out?" (used for `aria-labelledby`).
- Body text: "Are you sure you want to log out?"
- Two buttons at the bottom, right-aligned:
  - **Cancel** — neutral style (light background, dark text).
  - **Log out** — primary destructive style (red background, white text).

All styling is built from scratch with Tailwind utility classes. No component library may be installed.

---

## Components

### `Navbar.tsx`

**Location:** `app/(dashboard)/components/Navbar.tsx`

Client component. Manages the local `open` state for the logout dialog.

```ts
// no props — self-contained
function Navbar(): JSX.Element
```

- Renders the app name as a `next/link` to `/`.
- Renders a "Log out" button that sets `open = true` when clicked.
- Renders `<LogoutDialog open={open} onClose={...} onConfirm={...} />`.
- `onConfirm` calls `logout()` from `useAuth` (does not need to also close the dialog — navigation away will unmount it).

### `LogoutDialog.tsx`

**Location:** `app/(dashboard)/components/LogoutDialog.tsx`

Client component. A self-contained confirmation modal.

```ts
interface LogoutDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}
```

- Returns `null` when `open === false`.
- When `open === true`:
  - Renders a fixed-position backdrop overlay.
  - Renders a centred dialog container with `role="dialog"` and `aria-modal="true"`.
  - The heading element has `id="logout-dialog-title"` and the container has `aria-labelledby="logout-dialog-title"`.
  - Adds an Escape key listener on `window` that calls `onClose()`.
  - Adds a backdrop click handler that calls `onClose()`.
  - Moves focus to the Cancel button on open.

---

## Layout Wiring

**Location:** `app/(dashboard)/layout.tsx`

A new layout file for the `(dashboard)` route group. Includes the navbar so every dashboard page shows it.

```tsx
export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
```

The existing dashboard `page.tsx` should keep its own internal `<div className="min-h-screen bg-gray-50 px-4 py-8">` wrapper, but the outer height/flex now comes from the layout. Adjust the page's outer wrapper so its background and padding still apply, but it does not redundantly enforce `min-h-screen` (the layout's `flex-1` handles vertical fill).

---

## File Structure

```
app/
  (dashboard)/
    layout.tsx                       ← NEW
    page.tsx                         ← adjust outer wrapper (min-h-screen removed)
    components/
      Navbar.tsx                     ← NEW
      Navbar.test.tsx                ← NEW
      LogoutDialog.tsx               ← NEW
      LogoutDialog.test.tsx          ← NEW
```

---

## Acceptance Criteria

- [ ] The navbar appears at the top of `/` (dashboard) and any future page inside `(dashboard)`.
- [ ] The navbar does **not** appear on `/login` or `/register`.
- [ ] The navbar shows the text "Fluxy" on the left as a link to `/`.
- [ ] The navbar shows a "Log out" button on the right.
- [ ] Clicking the navbar "Log out" button opens the confirmation dialog.
- [ ] The dialog displays the message "Are you sure you want to log out?".
- [ ] Clicking the dialog's **Cancel** button closes the dialog without logging the user out.
- [ ] Pressing **Escape** closes the dialog without logging the user out.
- [ ] Clicking the backdrop closes the dialog without logging the user out.
- [ ] Clicking the dialog's **Log out** button calls `logout()`, which clears the tokens and cookie and redirects to `/login`.
- [ ] The dialog has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing at its heading.
- [ ] Focus moves to the **Cancel** button when the dialog opens.
- [ ] No component library is installed; all styling is Tailwind utility classes.
- [ ] All new files have co-located passing Vitest tests.
