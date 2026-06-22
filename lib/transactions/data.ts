import "server-only";

import { apiFetch } from "@/lib/api/client";
import type {
  Transaction,
  TransactionPage,
  TransactionListQuery,
} from "@/lib/api/types";

/**
 * Data Access Layer de transações (todas 🔒 — front-specs/0003 §5).
 * Paginação por cursor (keyset): NÃO há offset nem total (RN-Tx-8).
 */

export async function listTransactions(
  query: TransactionListQuery = {},
): Promise<TransactionPage> {
  return apiFetch<TransactionPage>("/transactions", {
    query: {
      from: query.from,
      to: query.to,
      categoryId: query.categoryId,
      kind: query.kind,
      limit: query.limit,
      cursor: query.cursor,
    },
  });
}

export async function getTransaction(id: string): Promise<Transaction> {
  return apiFetch<Transaction>(`/transactions/${id}`);
}
