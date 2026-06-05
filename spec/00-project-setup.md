# 00 — Project Setup

## Vision

Fluxy is a personal budget and expense tracker. Users can record income and expenses, organise transactions by category, and monitor their budgets over time through a clean, responsive web interface.

---

## Tech Stack

| Concern | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.x |
| Runtime | React | 19.x |
| Language | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS | 4.x |
| Testing | Vitest | latest |
| Backend | External REST API | — |

> Before writing any Next.js code, read `node_modules/next/dist/docs/` for the exact APIs available in this version.

---

## Directory Structure

```
fluxy-frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── page.tsx
│   │   ├── components/
│   │   └── hooks/
│   ├── layout.tsx
│   ├── globals.css
│   └── favicon.ico
├── lib/
│   ├── api/          # API client and endpoint helpers
│   └── utils/        # Pure utility functions
├── types/            # Shared TypeScript interfaces and types
├── spec/             # Spec files (this folder)
├── public/
├── .env.local        # Local environment variables (not committed)
├── .env.example      # Template for required env vars (committed)
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
└── package.json
```

### Rules

- Each feature lives inside its own route group folder under `app/`.
- Feature-specific components and hooks live **inside** the feature folder, not at the root level.
- Only code shared across two or more features belongs in `lib/` or `types/`.
- One component per file; test file co-located (`foo.tsx` → `foo.test.tsx`).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL of the backend REST API |

- Define variables in `.env.local` for local development.
- Commit `.env.example` with all required keys and empty values as a template.
- Never hard-code the API base URL anywhere in the source code.

### `.env.example`

```
NEXT_PUBLIC_API_URL=
```

---

## External API

- The REST API is documented at `${NEXT_PUBLIC_API_URL}/docs` (Swagger UI).
- All HTTP calls must originate from `lib/api/`.
- Every call must handle three states: loading, error, and success.
- Authentication tokens (if any) must be stored and sent as defined in `spec/01-auth.md`.

---

## TypeScript Conventions

- `strict: true` is enforced — never use `any`.
- Use the path alias `@/` to import from the project root (e.g., `@/lib/api/client`).
- Shared types go in `types/`. Never define a reusable type inside a component file.
- Prefer `interface` for object shapes; use `type` for unions and aliases.

---

## Styling Conventions

- Tailwind CSS utility classes only — no inline `style` props, no CSS modules, no third-party component libraries.
- Mobile-first responsive design: write base styles for mobile, override for larger breakpoints.
- Do not extend the Tailwind config unless a design token genuinely needs it.

---

## Testing

- Framework: **Vitest** (unit and integration tests).
- Test files are co-located with the source file: `foo.ts` → `foo.test.ts`.
- Run all tests with `npm test`.
- Tests must pass before a feature is considered done.
- Do not mock the external API at the unit level — use a fetch mock at the integration boundary.

### Required devDependencies

```
vitest
@vitejs/plugin-react
@testing-library/react
@testing-library/user-event
jsdom
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest test suite |

---

## Setup Checklist

The following must be true before any feature spec is implemented:

- [ ] `NEXT_PUBLIC_API_URL` is set in `.env.local`
- [ ] `.env.example` is committed with all required keys
- [ ] Vitest and testing dependencies are installed and `npm test` runs successfully
- [ ] `vitest.config.ts` is present and configured for jsdom + React
- [ ] `lib/api/` folder exists with a base HTTP client
- [ ] `types/` folder exists
- [ ] `spec/` folder exists and contains at least this file
- [ ] `npm run dev` starts without errors
- [ ] `npm run lint` passes with no errors

---

## Acceptance Criteria

- The project boots with `npm run dev` and renders the default root page without errors.
- `npm test` exits with code 0 (even if there are no tests yet).
- `npm run lint` exits with code 0.
- `npm run build` completes without type errors or build failures.
