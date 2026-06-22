/**
 * Contrato de tipos do Fluxy — DTOs reais trocados com a API.
 *
 * Fonte da verdade: front-specs/0002 (modelos) e 0006 (envelope de erro).
 * Não introduzir tipos que a API não retorna/aceita. Nomes em camelCase.
 */

// ── Enums ───────────────────────────────────────────────────────────────────

/** Tipo de categoria e de transação (0002 §1). */
export type Kind = "expense" | "income";

export type TokenType = "Bearer";

// ── Entidades (DTOs de resposta) ─────────────────────────────────────────────

/** Conta atual — `GET /me` (0002 §2). */
export interface Me {
  id: string; // UUID
  email: string; // sempre minúsculas (normalizado no backend)
  emailVerified: boolean;
  createdAt: string; // ISO 8601
}

/** Categoria (0002 §2). */
export interface Category {
  id: string; // UUID
  name: string; // 1..60 chars
  kind: Kind;
  archived: boolean; // true = arquivada (soft-delete); some da lista ativa
  createdAt: string; // ISO 8601
}

/** Transação (0002 §2). */
export interface Transaction {
  id: string; // UUID
  amountCents: number; // inteiro POSITIVO (magnitude); o sinal vem do kind
  kind: Kind;
  categoryId: string; // UUID — sempre presente
  description: string | null; // null quando ausente
  occurredAt: string; // data pura "YYYY-MM-DD"
  createdAt: string; // timestamp ISO 8601
}

/** Par de tokens — `POST /auth/login`, `POST /auth/refresh` (0002 §2). */
export interface TokenPair {
  accessToken: string; // JWT (HS256) — Authorization: Bearer <accessToken>
  refreshToken: string; // string opaca
  tokenType: TokenType;
  expiresIn: string; // TTL do access token, ex.: "15m"
}

/** Resposta genérica de mensagem (vários endpoints de auth). */
export interface MessageResponse {
  message: string;
}

/** Item do breakdown por categoria do relatório (0002 §2). */
export interface SummaryCategory {
  categoryId: string;
  name: string;
  kind: Kind;
  archived: boolean; // true = categoria arquivada com histórico no período
  totalCents: number;
  transactionCount: number;
}

/** Resumo de período — `GET /reports/summary` (0002 §2). */
export interface Summary {
  period: { from: string; to: string }; // datas "YYYY-MM-DD", inclusivas
  totals: {
    incomeCents: number;
    expenseCents: number;
    balanceCents: number; // incomeCents - expenseCents (pode ser negativo)
    transactionCount: number;
  };
  byCategory: SummaryCategory[];
}

/** Página de transações — `GET /transactions` (0002 §2). */
export interface TransactionPage {
  items: Transaction[];
  nextCursor: string | null; // token opaco; null = fim
}

// ── Envelope de erro (0006 §1) ───────────────────────────────────────────────

/** Todos os `code` estáveis do catálogo de erros (0006 §2). */
export type ApiErrorCode =
  // Genéricos / transversais
  | "VALIDATION_ERROR"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR"
  // Autenticação
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_VERIFIED"
  | "TOKEN_INVALID"
  | "TOKEN_EXPIRED"
  // Categorias
  | "CATEGORY_NOT_FOUND"
  | "CATEGORY_NAME_IN_USE"
  // Transações
  | "TRANSACTION_NOT_FOUND"
  | "INVALID_AMOUNT"
  | "CATEGORY_ARCHIVED"
  | "CATEGORY_KIND_MISMATCH";

/** Detalhe de validação do TypeBox (presente em alguns `VALIDATION_ERROR`). */
export interface ValidationDetail {
  path?: string;
  message?: string;
  [key: string]: unknown;
}

/** Corpo de erro padrão da API (0006 §1). */
export interface ApiErrorBody {
  error: {
    statusCode: number;
    code: string; // pode vir um code fora do catálogo conhecido
    message: string;
    details?: ValidationDetail[] | unknown;
  };
}

// ── Payloads de requisição ───────────────────────────────────────────────────

export interface CreateCategoryInput {
  name: string;
  kind: Kind;
}

export interface UpdateCategoryInput {
  name: string; // kind é imutável (RN-Cat-1)
}

export interface CreateTransactionInput {
  amountCents: number;
  kind: Kind;
  categoryId: string;
  occurredAt: string; // "YYYY-MM-DD"
  description?: string;
}

export interface UpdateTransactionInput {
  amountCents?: number;
  kind?: Kind;
  categoryId?: string;
  occurredAt?: string;
  description?: string | null; // null limpa a descrição
}

/** Filtros da listagem de transações (0003 §5). */
export interface TransactionListQuery {
  from?: string;
  to?: string;
  categoryId?: string;
  kind?: Kind;
  limit?: number; // 1..100, default 20
  cursor?: string;
}

export interface SummaryQuery {
  from?: string;
  to?: string;
}
