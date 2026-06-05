# 01 — Authentication

## Purpose

Allow users to create an account and log in to access the app. All routes outside the `(auth)` group are protected — unauthenticated users are redirected to `/login`.

---

## API Endpoints

### POST /auth/register

Creates a new Supabase account. Supabase sends a verification email; the user must confirm before they can log in.

**Request body**

| Field | Type | Rules |
|---|---|---|
| `email` | string | Required, valid email format |
| `password` | string | Required, minimum 6 characters |

**Responses**

| Status | Body | Meaning |
|---|---|---|
| 201 | `{ message: string }` | Account created, verification email sent |
| 409 | `{ code: "EMAIL_IN_USE", message: string }` | Email already registered |
| 422 | `{ code: "VALIDATION_ERROR", message: string }` | Invalid field values |

---

### POST /auth/login

Authenticates the user and returns JWT tokens issued by Supabase Auth.

**Request body**

| Field | Type | Rules |
|---|---|---|
| `email` | string | Required, valid email format |
| `password` | string | Required |

**Responses**

| Status | Body | Meaning |
|---|---|---|
| 200 | `{ access_token: string, refresh_token: string }` | Authenticated |
| 401 `INVALID_CREDENTIALS` | `{ code: string, message: string }` | Wrong email or password |
| 401 `EMAIL_NOT_VERIFIED` | `{ code: string, message: string }` | Email not confirmed yet |
| 422 | `{ code: "VALIDATION_ERROR", message: string }` | Invalid field values |

---

## Token Storage

- On login, store both tokens in `localStorage`:
  - Key `fluxy_access_token` → `access_token`
  - Key `fluxy_refresh_token` → `refresh_token`
- Also write `access_token` to a cookie named `fluxy_access_token` (non-httpOnly, path `/`) so Next.js Middleware can read it for route protection.
- On logout, remove both `localStorage` keys and delete the cookie.
- Attach `access_token` to every protected API request as `Authorization: Bearer <token>`.

---

## Route Protection

Protection is enforced by `proxy.ts` at the project root (Next.js 16 renamed Middleware to Proxy — same API, new filename).

- **Protected routes:** everything **except** `/login` and `/register`.
- If the `fluxy_access_token` cookie is absent, redirect to `/login`.
- If the cookie is present and the user visits `/login` or `/register`, redirect to `/`.

**Matcher config** (excludes API routes, Next.js internals, and static assets):

```ts
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
```

---

## Form Management

- All forms use **React Hook Form** for state and submission handling.
- All validation schemas are defined with **Zod** and connected to React Hook Form via `@hookform/resolvers/zod`.
- Zod schemas live in a `schemas.ts` file co-located with each page.
- Field-level validation errors are displayed inline, below the relevant input.
- API errors (non-validation) are displayed as **toasts** using **Sonner**.

### Dependencies to install

```
react-hook-form
zod
@hookform/resolvers
sonner
```

### Sonner setup

Add `<Toaster />` from `sonner` to `app/layout.tsx`. No other global configuration is needed.

---

## Shared Types

Add to `types/index.ts`:

```ts
export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface RegisterInput {
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}
```

---

## API Helpers

Create `lib/api/auth.ts` with:

```ts
registerUser(input: RegisterInput): Promise<{ message: string }>
loginUser(input: LoginInput): Promise<AuthTokens>
```

Both must use `apiRequest` from `lib/api/client.ts`.

> **Note:** `apiRequest` must be updated so that `ApiError` carries the API `code` field from the response body, not just the HTTP status. This allows pages to distinguish between e.g. `INVALID_CREDENTIALS` and `EMAIL_NOT_VERIFIED` (both 401). Update `lib/api/client.ts`:
>
> - `ApiError` gains a `code: string` constructor parameter.
> - Before throwing, parse the JSON body: `const data = await res.json().catch(() => ({}))`
> - Throw: `new ApiError(res.status, data.code ?? 'UNKNOWN_ERROR', data.message ?? res.statusText)`

---

## Custom Hook — `useAuth`

**Location:** `lib/hooks/useAuth.ts`

Must be a Client Component hook (`'use client'` is not needed in the hook file itself, but any component that uses it must be a Client Component). The hook guards against SSR by checking `typeof window !== 'undefined'` before reading `localStorage`.

Reads and manages token state. Exposes:

| Member | Type | Description |
|---|---|---|
| `isAuthenticated` | `boolean` | `true` when `fluxy_access_token` exists in localStorage |
| `accessToken` | `string \| null` | Current access token |
| `login` | `(tokens: AuthTokens) => void` | Persists tokens to localStorage and cookie |
| `logout` | `() => void` | Clears tokens and cookie, then calls `router.push('/login')` |

---

## Pages

### `/login` — Login page

**Files:**
- `app/(auth)/login/page.tsx`
- `app/(auth)/login/schemas.ts` — Zod schema
- `app/(auth)/login/page.test.tsx`

**Zod schema (`loginSchema`)**

| Field | Rule | Error message |
|---|---|---|
| `email` | Required | `"Email is required."` |
| `email` | Valid email format | `"Enter a valid email address."` |
| `password` | Required | `"Password is required."` |

**UI elements:**
- Email input (`type="email"`) with inline field error
- Password input (`type="password"`) with inline field error
- Submit button labelled "Log in"
- Link to `/register` — "Don't have an account? Register"

**Behaviour:**

| Step | Action |
|---|---|
| Submit | Call `POST /auth/login` via `loginUser` |
| In-flight | Disable the form; show a loading state on the button |
| 200 | Call `login(tokens)` from `useAuth`, then redirect to `/` |
| 401 `INVALID_CREDENTIALS` | `toast.error("Invalid email or password.")` |
| 401 `EMAIL_NOT_VERIFIED` | `toast.error("Please verify your email before logging in.")` |
| 422 | `toast.error("Please check the information entered.")` |
| Network / unknown error | `toast.error("Something went wrong. Please try again.")` |

React Hook Form prevents submission when Zod validation fails; API calls are only made on valid form data.

---

### `/register` — Register page

**Files:**
- `app/(auth)/register/page.tsx`
- `app/(auth)/register/schemas.ts` — Zod schema
- `app/(auth)/register/page.test.tsx`

**Zod schema (`registerSchema`)**

| Field | Rule | Error message |
|---|---|---|
| `email` | Required | `"Email is required."` |
| `email` | Valid email format | `"Enter a valid email address."` |
| `password` | Required | `"Password is required."` |
| `password` | Min 6 characters | `"Password must be at least 6 characters."` |

**UI elements:**
- Email input (`type="email"`) with inline field error
- Password input (`type="password"`) with inline field error
- Submit button labelled "Create account"
- Link to `/login` — "Already have an account? Log in"

**Behaviour:**

| Step | Action |
|---|---|
| Submit | Call `POST /auth/register` via `registerUser` |
| In-flight | Disable the form; show a loading state on the button |
| 201 | `toast.success("Account created. Please check your email to verify your account.")` |
| 409 | `toast.error("This email is already registered.")` |
| 422 | `toast.error("Please check the information entered.")` |
| Network / unknown error | `toast.error("Something went wrong. Please try again.")` |

React Hook Form prevents submission when Zod validation fails.

---

## File Structure

```
app/
  (auth)/
    login/
      page.tsx
      page.test.tsx
      schemas.ts
    register/
      page.tsx
      page.test.tsx
      schemas.ts
  layout.tsx        ← add <Toaster /> here
lib/
  api/
    client.ts       ← update ApiError to include code field
    auth.ts
    auth.test.ts
  hooks/
    useAuth.ts
    useAuth.test.ts
types/
  index.ts          ← add AuthTokens, RegisterInput, LoginInput
proxy.ts            ← route protection (project root, Next.js 16)
proxy.test.ts
```

---

## Acceptance Criteria

- [ ] Visiting any protected route without a token cookie redirects to `/login`.
- [ ] Visiting `/login` or `/register` with a valid token cookie redirects to `/`.
- [ ] Register form: valid data → success toast displayed, form stays on page.
- [ ] Register form: duplicate email → error toast "This email is already registered."
- [ ] Register form: empty/invalid fields → inline Zod errors shown, form not submitted.
- [ ] Login form: valid credentials → tokens stored, redirected to `/`.
- [ ] Login form: wrong credentials → error toast "Invalid email or password."
- [ ] Login form: unverified email → error toast "Please verify your email before logging in."
- [ ] Login form: empty fields → inline Zod errors shown, form not submitted.
- [ ] Form is disabled and shows loading state while a request is in-flight.
- [ ] `logout()` clears localStorage and cookie and redirects to `/login`.
- [ ] `<Toaster />` is mounted in the root layout.
- [ ] `ApiError` exposes `code`, `status`, and `message` fields.
- [ ] `proxy.ts` uses the correct matcher pattern and does not run on static assets.
- [ ] `useAuth` safely returns `null` tokens when `localStorage` is unavailable (SSR).
- [ ] All files listed in the file structure have co-located passing Vitest tests.
