# 0002 — Modelos & Conceitos (Frontend)

| Campo | Valor |
|-------|-------|
| **Status** | Aprovada |
| **Origem** | `src/modules/*/*.schema.ts`, `src/modules/*/*.service.ts`, [../specs/0004](../specs/0004-categorias.md), [../specs/0005](../specs/0005-transacoes.md) |
| **Atualizada em** | 2026-06-21 |

Define os **tipos que o frontend troca com a API**. Estes são os **DTOs reais**
retornados/aceitos pela API (não o schema interno do banco). Nomes em `camelCase`.

## 1. Enums

```ts
type Kind = 'expense' | 'income'   // tipo de categoria e de transação
type TokenType = 'Bearer'
```

- `expense` = **despesa** (saída, subtrai do saldo).
- `income` = **receita** (entrada, soma ao saldo).

## 2. Entidades (DTOs de resposta)

### User / Conta atual — `GET /me`
```ts
interface Me {
  id: string            // UUID
  email: string         // sempre minúsculas (normalizado no backend)
  emailVerified: boolean
  createdAt: string     // ISO 8601, ex.: "2026-06-21T13:00:00.000Z"
}
```
> Não há outros campos de perfil no MVP (sem nome, avatar, etc. — 0003 §3).

### Category
```ts
interface Category {
  id: string            // UUID
  name: string          // 1..60 chars
  kind: Kind
  archived: boolean     // true = arquivada (soft-delete); some da lista ativa
  createdAt: string     // ISO 8601
}
```

### Transaction
```ts
interface Transaction {
  id: string            // UUID
  amountCents: number   // inteiro POSITIVO (magnitude); o sinal vem do kind
  kind: Kind
  categoryId: string    // UUID — sempre presente (categoria é obrigatória)
  description: string | null   // null quando ausente
  occurredAt: string    // data "YYYY-MM-DD" (sem horário)
  createdAt: string     // ISO 8601 (com horário)
}
```
> ⚠️ `occurredAt` é **data pura** (`YYYY-MM-DD`); `createdAt` é **timestamp ISO**. Não
> confundir os formatos ao exibir/parsear.

### Tokens — `POST /auth/login`, `POST /auth/refresh`
```ts
interface TokenPair {
  accessToken: string   // JWT (HS256). Use em Authorization: Bearer <accessToken>
  refreshToken: string  // string opaca; trocar por novo par via /auth/refresh
  tokenType: 'Bearer'
  expiresIn: string     // TTL do access token, ex.: "15m"
}
```

### Mensagem genérica — vários endpoints de auth
```ts
interface MessageResponse { message: string }
```

### Summary (relatório) — `GET /reports/summary`
```ts
interface Summary {
  period: { from: string; to: string }   // datas "YYYY-MM-DD", inclusivas
  totals: {
    incomeCents: number
    expenseCents: number
    balanceCents: number        // incomeCents - expenseCents (pode ser negativo)
    transactionCount: number
  }
  byCategory: Array<{
    categoryId: string
    name: string
    kind: Kind
    archived: boolean           // true = categoria arquivada com histórico no período
    totalCents: number
    transactionCount: number
  }>
}
```

### Página de transações — `GET /transactions`
```ts
interface TransactionPage {
  items: Transaction[]
  nextCursor: string | null   // token opaco p/ próxima página; null = fim
}
```

## 3. Representação monetária

- A API usa **centavos inteiros** em todos os campos `*Cents` (`amountCents`,
  `incomeCents`, etc.). Ex.: `1250` = **R$ 12,50** (0005 §5, PD-1).
- `amountCents` de transação é **sempre positivo**; o efeito no saldo vem do `kind`
  (`income` soma, `expense` subtrai). **Não** enviar valores negativos.
- **Frontend deve:**
  - Exibir dividindo por 100 e formatando em **BRL** (`Intl.NumberFormat('pt-BR',
    { style: 'currency', currency: 'BRL' })`).
  - Converter input do usuário (ex.: "12,50") → `1250` antes de enviar.
  - Somar/agregar **sempre em centavos inteiros** (nunca floats).
  - Tratar `balanceCents` negativo (saldo no vermelho) como caso válido.

## 4. Datas

- **`occurredAt`, `from`, `to`** → formato `YYYY-MM-DD` (data pura, sem fuso). Datas
  **futuras são permitidas** em `occurredAt` (0005 §7/D7).
- **`createdAt`** → timestamp ISO 8601 com fuso (UTC).
- O período de relatórios é **inclusivo** nas duas pontas (0006 §5).

## 5. Identificadores

- Todos os `id` são **UUID v4** (string). O frontend só os repassa; nunca os gera.
- O frontend **nunca** envia `userId` — o backend o deriva do token (P2 / isolamento).

## 6. Referências

- `src/modules/auth/auth.schema.ts`, `src/modules/categories/category.schema.ts`,
  `src/modules/transactions/transaction.schema.ts`, `src/modules/reports/report.schema.ts`
- [../specs/0004](../specs/0004-categorias.md), [../specs/0005](../specs/0005-transacoes.md),
  [../specs/0006](../specs/0006-relatorios.md)
</content>
