"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  loadMoreTransactionsAction,
  deleteTransactionAction,
} from "@/lib/transactions/actions";
import { formatBRL } from "@/lib/money";
import { formatDateOnly } from "@/lib/date";
import type {
  Transaction,
  TransactionListQuery,
} from "@/lib/api/types";

export interface CategoryRef {
  name: string;
  archived: boolean;
}

export function TransactionList({
  initialItems,
  initialCursor,
  query,
  categoriesById,
}: {
  initialItems: Transaction[];
  initialCursor: string | null;
  query: TransactionListQuery;
  categoriesById: Record<string, CategoryRef>;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function loadMore() {
    if (!cursor) return;
    startTransition(async () => {
      try {
        const page = await loadMoreTransactionsAction(query, cursor);
        setItems((prev) => [...prev, ...page.items]);
        setCursor(page.nextCursor);
        setError(undefined);
      } catch {
        setError("Não foi possível carregar mais. Tente novamente.");
      }
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Nenhuma transação no período/filtros selecionados.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {items.map((t) => {
          const cat = categoriesById[t.categoryId];
          const isExpense = t.kind === "expense";
          return (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {cat?.name ?? "Categoria removida"}
                  </span>
                  {cat?.archived ? (
                    <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                      arquivada
                    </span>
                  ) : null}
                </div>
                <div className="text-sm text-zinc-500">
                  {formatDateOnly(t.occurredAt)}
                  {t.description ? ` · ${t.description}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={
                    isExpense
                      ? "font-semibold text-red-600 dark:text-red-400"
                      : "font-semibold text-green-600 dark:text-green-400"
                  }
                >
                  {isExpense ? "−" : "+"}
                  {formatBRL(t.amountCents)}
                </span>
                <Link
                  href={`/transactions/${t.id}/edit`}
                  className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  Editar
                </Link>
                <form
                  action={deleteTransactionAction}
                  onSubmit={(e) => {
                    if (!confirm("Excluir esta transação? Não há como desfazer.")) {
                      e.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="id" value={t.id} />
                  <button
                    type="submit"
                    className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                  >
                    Excluir
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {cursor ? (
        <button
          type="button"
          onClick={loadMore}
          disabled={isPending}
          className="w-full rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          {isPending ? "Carregando…" : "Carregar mais"}
        </button>
      ) : null}
    </div>
  );
}
