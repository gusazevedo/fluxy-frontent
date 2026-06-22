import Link from "next/link";
import type { Category, TransactionListQuery } from "@/lib/api/types";

/**
 * Filtros da listagem (form GET nativo — funciona sem JS). Submeter recarrega
 * a página com os searchParams; o servidor refaz a query (RN-Tx-8: filtros
 * fixos dentro de uma sequência de páginas).
 */
export function TransactionFilters({
  categories,
  query,
}: {
  categories: Category[];
  query: TransactionListQuery;
}) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <label className="text-sm">
        <span className="mb-1 block font-medium">De</span>
        <input
          type="date"
          name="from"
          defaultValue={query.from}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium">Até</span>
        <input
          type="date"
          name="to"
          defaultValue={query.to}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium">Tipo</span>
        <select
          name="kind"
          defaultValue={query.kind ?? ""}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">Todos</option>
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium">Categoria</span>
        <select
          name="categoryId"
          defaultValue={query.categoryId ?? ""}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:opacity-90"
        >
          Filtrar
        </button>
        <Link
          href="/transactions"
          className="rounded-md border border-zinc-300 px-4 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Limpar
        </Link>
      </div>
    </form>
  );
}
