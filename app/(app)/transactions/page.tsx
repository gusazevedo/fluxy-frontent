import Link from "next/link";
import { listTransactions } from "@/lib/transactions/data";
import { listCategories } from "@/lib/categories/data";
import { TransactionFilters } from "@/components/transactions/filters";
import {
  TransactionList,
  type CategoryRef,
} from "@/components/transactions/transaction-list";
import type { Kind, TransactionListQuery } from "@/lib/api/types";

function buildQuery(sp: {
  from?: string;
  to?: string;
  categoryId?: string;
  kind?: string;
}): TransactionListQuery {
  const kind: Kind | undefined =
    sp.kind === "expense" || sp.kind === "income" ? sp.kind : undefined;
  return {
    from: sp.from || undefined,
    to: sp.to || undefined,
    categoryId: sp.categoryId || undefined,
    kind,
  };
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    categoryId?: string;
    kind?: string;
  }>;
}) {
  const sp = await searchParams;
  const query = buildQuery(sp);

  // Inclui arquivadas para resolver nomes no histórico (RN-Rep-3 / RN-Tx-3).
  const [page, allCategories] = await Promise.all([
    listTransactions(query),
    listCategories({ includeArchived: true }),
  ]);

  const categoriesById: Record<string, CategoryRef> = Object.fromEntries(
    allCategories.map((c) => [c.id, { name: c.name, archived: c.archived }]),
  );
  const activeCategories = allCategories.filter((c) => !c.archived);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transações</h1>
        <Link
          href="/transactions/new"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Nova transação
        </Link>
      </div>

      <TransactionFilters categories={activeCategories} query={query} />

      <TransactionList
        initialItems={page.items}
        initialCursor={page.nextCursor}
        query={query}
        categoriesById={categoriesById}
      />
    </div>
  );
}
