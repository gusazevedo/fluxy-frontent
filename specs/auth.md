# Fluxy — Feature Specs

## Auth — Register & Login

### Overview

Two-page auth flow: `/register` and `/login`. On successful login the user lands on a protected `/dashboard` route that displays a welcome message. All API calls go to `http://localhost:3000`.

---

### Routes

| Path | Access | Description |
|---|---|---|
| `/login` | public | Login form |
| `/register` | public | Register form |
| `/dashboard` | protected | Hello World after login |

Unauthenticated requests to `/dashboard` redirect to `/login`.
Authenticated users visiting `/login` or `/register` redirect to `/dashboard`.

---

### Token Storage

- On successful login the API returns `{ access_token, refresh_token }`.
- Store both tokens in `localStorage` (`fluxy_access_token`, `fluxy_refresh_token`).
- "Authenticated" is defined as having a non-empty `fluxy_access_token` in `localStorage`.
- On logout (future) clear both keys.

---

### Register Form (`/register`)

#### Fields

| Field | Type | Validation |
|---|---|---|
| `email` | email input | required · valid email format |
| `password` | password input | required · min 6 characters |
| `confirmPassword` | password input | required · must match `password` |

#### Behaviour

1. Validate with **Zod** schema, driven by **React Hook Form**.
2. Inline field errors appear below each input on blur or submit attempt.
3. On submit, `POST /auth/register` with `{ email, password }`.
4. **Success (201):** show a success toast — _"Account created! Please verify your email before logging in."_ — then redirect to `/login`.
5. **Conflict (409 `EMAIL_IN_USE`):** show an error toast — _"This email is already registered."_
6. **Validation error (422):** show an error toast with the API `message` field.
7. **Network / unknown error:** show a generic error toast — _"Something went wrong. Please try again."_
8. The submit button is disabled and shows a loading state while the request is in flight.

---

### Login Form (`/login`)

#### Fields

| Field | Type | Validation |
|---|---|---|
| `email` | email input | required · valid email format |
| `password` | password input | required |

#### Behaviour

1. Validate with **Zod** schema, driven by **React Hook Form**.
2. Inline field errors appear below each input on blur or submit attempt.
3. On submit, `POST /auth/login` with `{ email, password }`.
4. **Success (200):** store `access_token` and `refresh_token` in `localStorage`, then redirect to `/dashboard`.
5. **Invalid credentials (401 `INVALID_CREDENTIALS`):** show an error toast — _"Invalid email or password."_
6. **Email not verified (401 `EMAIL_NOT_VERIFIED`):** show an error toast — _"Please verify your email before logging in."_
7. **Validation error (422):** show an error toast with the API `message` field.
8. **Network / unknown error:** show a generic error toast — _"Something went wrong. Please try again."_
9. The submit button is disabled and shows a loading state while the request is in flight.

---

### Protected Route — Dashboard (`/dashboard`)

- A Server Component at `src/app/(features)/dashboard/page.tsx`.
- Auth guard is a Next.js middleware (`src/middleware.ts`) that reads `fluxy_access_token` from cookies.
  - Because `localStorage` is browser-only, the login action must also set the token as an **httpOnly-free cookie** (client-writable) so middleware can read it: `document.cookie = "fluxy_access_token=<token>; path=/"`.
- If the cookie is missing the middleware redirects to `/login`.
- Page content: display _"Hello, World!"_ (styled headline) with a short welcome sub-text.

---

### Toast Library

Use **Sonner** (`sonner` npm package). It integrates directly with shadcn/ui via:

```bash
npx shadcn@latest add sonner
```

Place `<Toaster />` in the root layout (`src/app/layout.tsx`). Call toasts with `toast.success(...)` and `toast.error(...)`.

---

### Tech Decisions

| Concern | Choice | Reason |
|---|---|---|
| Form state | React Hook Form | minimal re-renders, easy Zod integration |
| Schema validation | Zod + `@hookform/resolvers` | type-safe, colocated with field definitions |
| Toasts | Sonner | ships with shadcn/ui, zero config, accessible |
| Auth check | Next.js middleware + cookie | only mechanism readable server-side before render |

---

### File Layout (planned)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   └── (features)/
│       └── dashboard/
│           └── page.tsx
├── features/
│   └── auth/
│       ├── components/
│       │   ├── login-form.tsx
│       │   └── register-form.tsx
│       ├── hooks/
│       │   └── use-auth.ts
│       ├── schemas.ts       # Zod schemas for login + register
│       ├── actions.ts       # API call functions (register, login)
│       └── types.ts
└── middleware.ts
```

---

### API Reference (Auth)

#### `POST /auth/register`

```
Body:    { email: string, password: string }
201:     { message: string }
409:     { code: "EMAIL_IN_USE", message: string }
422:     { code: "VALIDATION_ERROR", message: string }
```

#### `POST /auth/login`

```
Body:    { email: string, password: string }
200:     { access_token: string, refresh_token: string }
401:     { code: "INVALID_CREDENTIALS" | "EMAIL_NOT_VERIFIED", message: string }
422:     { code: "VALIDATION_ERROR", message: string }
```
