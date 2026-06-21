# 0003 — Contrato da API (Frontend)

| Campo | Valor |
|-------|-------|
| **Status** | Aprovada |
| **Origem** | `src/**/*.routes.ts`, `src/**/*.schema.ts`, `src/**/*.service.ts`, `src/app.ts` |
| **Atualizada em** | 2026-06-21 |

Contrato **completo e literal** dos endpoints. Modelos em [0002](./0002-modelos-e-conceitos.md);
erros em [0006](./0006-tratamento-de-erros.md). Todos os corpos são JSON
(`Content-Type: application/json`).

## 1. Base, headers e convenções

- **Base URL:** vinda de env (ex.: `NEXT_PUBLIC_API_URL`). Dev local: `http://localhost:3333`.
  Sem prefixo de versão — as rotas são na raiz (`/auth/...`, `/categories`, etc.).
- **Autenticação:** header `Authorization: Bearer <accessToken>` nas rotas marcadas
  🔒 (ver [0004](./0004-autenticacao-e-sessao.md)).
- **Envelope de erro (sempre):** `{ "error": { "statusCode": number, "code": string,
  "message": string, "details"?: unknown } }`. Reaja pelo `code` (0006).
- **Rate limit:** 100 requisições/min (resposta 429 ao exceder —
  `src/shared/plugins/security.ts`). O frontend deve tratar 429 com backoff/feedback.
- **Docs interativas:** Swagger UI em `GET /docs` (útil para conferência manual).

### Tabela-resumo

| Método | Rota | 🔒 | Sucesso |
|--------|------|----|---------|
| GET | `/health` | — | 200 |
| POST | `/auth/register` | — | 201 |
| POST | `/auth/verify-email` | — | 200 |
| POST | `/auth/verify-email/resend` | — | 200 |
| POST | `/auth/login` | — | 200 |
| POST | `/auth/refresh` | — | 200 |
| POST | `/auth/logout` | — | 200 |
| POST | `/auth/forgot-password` | — | 200 |
| POST | `/auth/reset-password` | — | 200 |
| POST | `/auth/change-password` | 🔒 | 200 |
| GET | `/me` | 🔒 | 200 |
| GET | `/categories` | 🔒 | 200 |
| POST | `/categories` | 🔒 | 201 |
| GET | `/categories/:id` | 🔒 | 200 |
| PATCH | `/categories/:id` | 🔒 | 200 |
| DELETE | `/categories/:id` | 🔒 | 204 |
| GET | `/transactions` | 🔒 | 200 |
| POST | `/transactions` | 🔒 | 201 |
| GET | `/transactions/:id` | 🔒 | 200 |
| PATCH | `/transactions/:id` | 🔒 | 200 |
| DELETE | `/transactions/:id` | 🔒 | 204 |
| GET | `/reports/summary` | 🔒 | 200 |

---

## 2. Infra

### `GET /health`
Liveness probe (público). → `200 { status, stage, timestamp }`.

---

## 3. Autenticação (`/auth`) — ver fluxos em [0004](./0004-autenticacao-e-sessao.md)

### `POST /auth/register` (público)
Cria conta e dispara e-mail de verificação. **Resposta genérica** (não revela se o
e-mail já existe — 0003 RNF-3).
- **Body:** `{ "email": string, "password": string }`
- **201:** `{ "message": string }`
- **Erros:** `VALIDATION_ERROR` (400).

### `POST /auth/verify-email` (público)
Confirma o e-mail pelo token recebido por e-mail.
- **Body:** `{ "token": string }`
- **200:** `{ "message": string }`
- **Erros:** `TOKEN_INVALID` (400), `TOKEN_EXPIRED` (400), `VALIDATION_ERROR` (400).

### `POST /auth/verify-email/resend` (público)
Reenvia o e-mail de verificação. Resposta genérica.
- **Body:** `{ "email": string }`
- **200:** `{ "message": string }`

### `POST /auth/login` (público)
Autentica e emite tokens. **Exige e-mail verificado.**
- **Body:** `{ "email": string, "password": string }`
- **200:** `TokenPair` (`{ accessToken, refreshToken, tokenType: "Bearer", expiresIn }`)
- **Erros:** `INVALID_CREDENTIALS` (401), `EMAIL_NOT_VERIFIED` (403),
  `VALIDATION_ERROR` (400).

### `POST /auth/refresh` (público — usa refresh token no corpo)
Rotaciona o par de tokens. O refresh enviado é **revogado** e um novo par é emitido.
- **Body:** `{ "refreshToken": string }`
- **200:** `TokenPair`
- **Erros:** `TOKEN_INVALID` (401), `TOKEN_EXPIRED` (401).
- ⚠️ **Reuso de refresh já rotacionado** ⇒ `TOKEN_INVALID` **e o backend revoga TODAS
  as sessões** do usuário (tratado como comprometimento). Ver 0004.

### `POST /auth/logout` (público — usa refresh token no corpo)
Revoga a sessão atual. **Sempre 200** (idempotente, mesmo com token já inválido).
- **Body:** `{ "refreshToken": string }`
- **200:** `{ "message": string }`

### `POST /auth/forgot-password` (público)
Inicia o reset. **Sempre 200 genérico** (não revela existência do e-mail).
- **Body:** `{ "email": string }`
- **200:** `{ "message": string }`

### `POST /auth/reset-password` (público)
Define nova senha via token de e-mail. **Revoga todas as sessões** do usuário.
- **Body:** `{ "token": string, "password": string }`
- **200:** `{ "message": string }`
- **Erros:** `TOKEN_INVALID` (400), `TOKEN_EXPIRED` (400), `VALIDATION_ERROR` (400).

### `POST /auth/change-password` 🔒
Troca a senha informando a atual. **Revoga todas as sessões** (o usuário refaz login).
- **Body:** `{ "currentPassword": string, "newPassword": string }`
- **200:** `{ "message": string }`
- **Erros:** `INVALID_CREDENTIALS` (401, senha atual errada), `UNAUTHORIZED` (401),
  `VALIDATION_ERROR` (400).

### `GET /me` 🔒
Dados da conta atual.
- **200:** `Me` (`{ id, email, emailVerified, createdAt }`)
- **Erros:** `UNAUTHORIZED` (401).

---

## 4. Categorias (`/categories`) — todas 🔒

### `GET /categories`
Lista categorias do usuário. Por padrão **só ativas** (não arquivadas).
- **Query:**
  - `kind` (opcional): `expense` | `income` — filtra por tipo.
  - `includeArchived` (opcional, boolean): `true` inclui arquivadas.
- **200:** `Category[]`

### `POST /categories`
Cria categoria.
- **Body:** `{ "name": string, "kind": "expense" | "income" }`
- **201:** `Category`
- **Erros:** `CATEGORY_NAME_IN_USE` (409, nome+tipo já existe entre ativas),
  `VALIDATION_ERROR` (400).

### `GET /categories/:id`
- **200:** `Category`
- **Erros:** `CATEGORY_NOT_FOUND` (404).

### `PATCH /categories/:id`
Renomeia (apenas `name`; o `kind` é **imutável**).
- **Body:** `{ "name": string }`
- **200:** `Category`
- **Erros:** `CATEGORY_NOT_FOUND` (404), `CATEGORY_NAME_IN_USE` (409).

### `DELETE /categories/:id`
Remove. **Sem corpo na resposta.**
- **204:** (vazio)
- **Comportamento (0004 §7):** se a categoria **tem transações**, é **arquivada**
  (`archived: true`, some da lista ativa, mas o histórico mantém o vínculo). Se **não
  tem**, é **excluída de fato**. O frontend recebe 204 nos dois casos.
- **Erros:** `CATEGORY_NOT_FOUND` (404).

---

## 5. Transações (`/transactions`) — todas 🔒

### `GET /transactions`
Lista com filtros e **paginação por cursor** (keyset). Ordenação: `occurredAt` desc,
`id` desc como desempate.
- **Query (todas opcionais):**
  - `from`, `to` — `YYYY-MM-DD`, intervalo sobre `occurredAt`.
  - `categoryId` — UUID.
  - `kind` — `expense` | `income`.
  - `limit` — inteiro 1..100, **default 20**.
  - `cursor` — token opaco da página anterior; **ausente = primeira página**.
- **200:** `{ "items": Transaction[], "nextCursor": string | null }`
- **Paginação:** para a próxima página, reenviar a **mesma query** + `cursor=<nextCursor>`.
  `nextCursor: null` ⇒ não há mais resultados. **Não há `total`** — para contagem use o
  resumo (0006).
- **Erros:** `VALIDATION_ERROR` (400, inclui cursor malformado).

### `POST /transactions`
Cria transação.
- **Body:**
  ```json
  {
    "amountCents": 1250,
    "kind": "expense",
    "categoryId": "<uuid>",
    "occurredAt": "2026-06-21",
    "description": "Almoço"
  }
  ```
  `description` é **opcional** (≤ 280 chars).
- **201:** `Transaction`
- **Regras (0005 §7):** `categoryId` deve referenciar categoria **do usuário**, **ativa**
  (não arquivada) e de `kind` **igual** ao da transação.
- **Erros:** `INVALID_AMOUNT` (400, `amountCents` ≤ 0), `CATEGORY_NOT_FOUND` (404),
  `CATEGORY_ARCHIVED` (409), `CATEGORY_KIND_MISMATCH` (409), `VALIDATION_ERROR` (400).

### `GET /transactions/:id`
- **200:** `Transaction`
- **Erros:** `TRANSACTION_NOT_FOUND` (404).

### `PATCH /transactions/:id`
Edita campos (parcial — envie só o que muda).
- **Body (todos opcionais):** `{ amountCents?, kind?, categoryId?, occurredAt?, description? }`
  - `description` pode ser `null` para **limpar** a descrição.
- **200:** `Transaction`
- **Regras:** alterar `kind` é permitido **desde que a categoria corresponda ao novo
  tipo** (0005 D2). Trocar para uma categoria **arquivada** é bloqueado; mas se a
  transação já estava ligada a uma categoria que **depois foi arquivada**, manter esse
  vínculo (sem trocar `categoryId`) continua válido (0005 §7).
- **Erros:** `TRANSACTION_NOT_FOUND` (404), `INVALID_AMOUNT` (400),
  `CATEGORY_NOT_FOUND` (404), `CATEGORY_ARCHIVED` (409),
  `CATEGORY_KIND_MISMATCH` (409), `VALIDATION_ERROR` (400).

### `DELETE /transactions/:id`
Exclui de fato (sem soft-delete). **Sem corpo.**
- **204:** (vazio)
- **Erros:** `TRANSACTION_NOT_FOUND` (404).

---

## 6. Relatórios (`/reports`) — 🔒

### `GET /reports/summary`
Totais + breakdown por categoria de um período (read-only).
- **Query (opcionais):** `from`, `to` (`YYYY-MM-DD`). **Omitidos ⇒ mês corrente.**
- **200:** `Summary` (ver [0002](./0002-modelos-e-conceitos.md) §2). Exemplo:
  ```json
  {
    "period": { "from": "2026-06-01", "to": "2026-06-30" },
    "totals": {
      "incomeCents": 500000,
      "expenseCents": 320000,
      "balanceCents": 180000,
      "transactionCount": 42
    },
    "byCategory": [
      { "categoryId": "…", "name": "Alimentação", "kind": "expense", "archived": false, "totalCents": 120000, "transactionCount": 18 },
      { "categoryId": "…", "name": "Salário", "kind": "income", "archived": false, "totalCents": 500000, "transactionCount": 1 }
    ]
  }
  ```
- **Notas:** `byCategory` é uma lista única com `kind` por item (o frontend separa
  despesa/receita ao exibir) e **inclui categorias arquivadas** que tiveram transações
  no período (marcadas `archived: true`). **Sem percentual** — calcule a partir dos
  totais se precisar.
- **Erros:** `VALIDATION_ERROR` (400, ex.: `from` > `to`).

## 7. Referências

- Rotas: `src/modules/{auth,categories,transactions,reports}/*.routes.ts`
- Schemas: `src/modules/**/**.schema.ts` · App/health/CORS: `src/app.ts`,
  `src/shared/plugins/security.ts`
</content>
