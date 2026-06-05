# Agent Rules — Fluxy Frontend

## 1. This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

---

## 2. Spec-Driven Development (strict)

Every system feature is governed by a spec file. Agents **must** follow this workflow for every task:

1. **Identify the relevant spec** — specs live under `spec/` at the project root (e.g., `spec/00-project-setup.md`, `spec/01-auth.md`).
2. **Read the spec in full** before creating or modifying any file.
3. **Only implement what the spec describes** — no extra features, abstractions, or side changes.
4. **If the spec is incomplete or contradictory**, stop immediately and ask the user for clarification. Do not make assumptions and proceed.
5. **Never modify a spec file** unless the user explicitly asks you to.

> There are no exceptions to rule 2. Reading the spec is not optional even for "small" changes.

---

## 3. Spec File Conventions

- All spec files are written in **English** and formatted as **Markdown**.
- File names follow the pattern `spec/NN-feature-name.md` where `NN` is a zero-padded index.
- Each spec defines: purpose, data models, UI behaviour, API interactions, and acceptance criteria.

---

## 4. Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js (read `node_modules/next/dist/docs/` for the exact version) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS only — no component libraries |
| Testing | Vitest (unit + integration) |
| Backend | External REST API running at `http://localhost:3333` |

---

## 5. External API

- The backend REST API is documented at **`http://localhost:3333/docs`**.
- Read the relevant endpoint docs before implementing any data fetching or mutation.
- Never hard-code base URLs in component files — use an environment variable (`NEXT_PUBLIC_API_URL`).
- All API calls must handle loading, error, and empty states explicitly.

---

## 6. Styling Rules

- Use **Tailwind CSS utility classes** exclusively — no inline `style` props, no CSS modules, no styled-components.
- Do not install UI component libraries (e.g., shadcn, Radix, MUI). Build components from scratch using Tailwind.
- Keep component files focused: one component per file, co-located with its test.

---

## 7. Testing Requirements

- Every new feature or bug fix **must** include Vitest unit or integration tests.
- Test files are co-located with the source file: `foo.ts` → `foo.test.ts`.
- Do not mock the external API at the unit level — use MSW or a test-scoped fetch mock at the integration boundary.
- Tests must pass before the task is considered complete.

---

## 8. Spec Gaps

If during implementation you discover that:
- A spec does not cover a case you've encountered, or
- Two spec requirements conflict with each other,

**Stop. Do not guess. Ask the user to clarify or update the spec.**

---

## 9. Git & Commits

- Use conventional commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:`.
- Commit scope should match the spec file name (e.g., `feat(auth): add login form`).
- Do not commit unless the user asks.

---

## 10. General Constraints

- Do not create files outside the scope of the active spec.
- Do not refactor unrelated code while implementing a feature.
- Do not add comments that explain *what* the code does — only comment *why* when the reason is non-obvious.
- Prefer editing existing files over creating new ones.
- Never introduce `any` types in TypeScript.
