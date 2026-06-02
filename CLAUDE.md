@AGENTS.md

# Fluxy

## Stack

- **Framework**: Next.js 16.2.7
- **Runtime**: Node.js 20.19.6
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **React**: 19.x

## Router

Use **App Router** exclusively. All routes live under `src/app/`. Never use Pages Router (`src/pages/`).

Server Components are the default. Add `"use client"` only when the component requires browser APIs, state, or event handlers.

## Project Structure

Feature-based architecture — group files by domain, not by file type.

```
src/
├── app/                        # App Router — routes only
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home (/)
│   └── (features)/             # Route groups per feature
│       └── transactions/
│           └── page.tsx
├── features/                   # Feature modules (business logic)
│   └── transactions/
│       ├── components/         # Feature-specific components
│       ├── hooks/              # Feature-specific hooks
│       ├── types.ts            # Feature types/interfaces
│       └── utils.ts            # Feature utilities
├── components/
│   └── ui/                     # shadcn/ui generated components (do not edit manually)
├── lib/
│   └── utils.ts                # Shared utilities (cn(), etc.)
└── styles/
    └── globals.css             # Tailwind import + CSS variables
```

## shadcn/ui

Add components with:
```bash
npx shadcn@latest add <component-name>
```

Components are generated into `src/components/ui/`. Do not edit them manually — re-run the add command to update.

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
npm run typecheck # tsc --noEmit (add script if missing)
```

## Conventions

- **Exports**: named exports for all components and utilities; no default exports
- **Filenames**: kebab-case (`transaction-list.tsx`, not `TransactionList.tsx`)
- **Types**: no `any`; define explicit interfaces in `types.ts` per feature
- **Server/Client split**: keep data fetching in Server Components; push interactivity to leaf Client Components
- **Tailwind**: use `@import "tailwindcss"` in globals.css (v4 syntax) — not `@tailwind base/components/utilities`
- **Imports**: use the `@/` path alias (`@/features/transactions/types`)

## SDD (Spec-Driven Development)

Every feature starts with a spec before any code is written. The spec lives in `SPEC.md` at the project root. No implementation without a corresponding spec section.
