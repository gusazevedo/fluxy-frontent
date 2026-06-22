# Fluxy — Frontend

Cliente web (Next.js, App Router) do **Fluxy**, app de controle de finanças
pessoais. Consome a API REST do backend e segue **Spec-Driven Development**: as
regras de negócio vivem no servidor; este frontend as respeita, nunca as
reimplementa. A fonte da verdade são as specs em [`front-specs/`](./front-specs)
e, acima delas, o código/specs do backend.

> Roteiro completo de desenvolvimento (8 fases): abra
> [`plano-desenvolvimento-frontend.html`](./plano-desenvolvimento-frontend.html)
> no navegador.

## Stack

- **Next.js 16** (App Router, React 19, Turbopack) · TypeScript · Tailwind v4.
- **Arquitetura BFF**: o browser nunca fala direto com a API. Server Components
  (leitura) e Server Actions (mutação) chamam a API no servidor; os tokens
  ficam em **cookies httpOnly**, fora do alcance de JavaScript do cliente.

## Pré-requisitos

- Node 20+.
- Backend Fluxy rodando localmente (default `http://localhost:3333`).

## Configuração

1. Copie o exemplo de ambiente e ajuste se necessário:

   ```bash
   cp .env.example .env.local
   ```

   ```bash
   # .env.local — server-only (sem NEXT_PUBLIC_)
   API_BASE_URL=http://localhost:3333
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

## Rodando

```bash
npm run dev     # http://localhost:3000
```

> **CORS.** O backend libera CORS apenas para a origem em `APP_URL` (default
> `http://localhost:3000`) com `credentials: true`. **Rode o frontend nessa
> origem**, senão as requisições serão bloqueadas. Os e-mails de verificação e
> de redefinição de senha apontam para `APP_URL/verify-email` e
> `APP_URL/reset-password` — rotas que este app expõe.

Outros scripts:

```bash
npm run build   # build de produção
npm run start   # serve o build
npm run lint    # ESLint
```

## Como navegar (fluxo ponta a ponta)

1. **Cadastro** em `/register` → e-mail de verificação → `/verify-email?token=…`.
2. **Login** em `/login` (exige e-mail verificado).
3. **Categorias** (`/categories`): criar, renomear, excluir/arquivar.
4. **Transações** (`/transactions`): criar despesas/receitas, filtrar, paginar
   ("carregar mais"), editar e excluir.
5. **Relatórios** (`/reports`): totais e breakdown por categoria do período.
6. **Conta** (`/account`): dados da conta e troca de senha.

## Estrutura

```
app/
  (auth)/         # login, register, forgot-password, verify-email, reset-password
  (app)/          # área autenticada: dashboard, categories, transactions, reports, account
lib/
  api/            # tipos do contrato, cliente HTTP, erros e mensagens (server-only)
  auth/           # sessão (cookies httpOnly), refresh, actions, validação
  categories/     # data layer + server actions
  transactions/   # data layer + server actions
  reports/        # data layer
  money.ts date.ts forms.ts
components/        # UI (formulários, navegação, listas)
proxy.ts          # proteção de rotas + refresh proativo de token
```

## Princípios respeitados

- **API é a fonte da verdade** — o frontend valida por UX, mas o servidor decide.
- **Dinheiro em centavos inteiros** (BRL); conversão só nas bordas.
- **Reação a erros pelo `code`** (estável), com mensagens próprias em PT-BR.
- **Isolamento por usuário** — o frontend nunca envia `userId`.
- **Fora de escopo** (não implementado, por decisão de produto): recorrência,
  orçamentos/metas, multi-carteira, importação, multi-moeda, anexos, OAuth/MFA,
  exclusão de conta, subcategorias, export e timeline. Ver
  [`front-specs/0001`](./front-specs/0001-visao-geral-e-stack.md) §4.
