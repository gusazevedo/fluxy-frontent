import Link from "next/link";
import { listCategories } from "@/lib/categories/data";
import { CreateCategoryForm } from "@/components/categories/create-category-form";
import { CategoryRow } from "@/components/categories/category-row";
import type { Category } from "@/lib/api/types";

function Section({
  title,
  items,
}: {
  title: string;
  items: Category[];
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhuma categoria.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {items.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const { archived } = await searchParams;
  const includeArchived = archived === "1";
  const categories = await listCategories({ includeArchived });

  const expenses = categories.filter((c) => c.kind === "expense");
  const incomes = categories.filter((c) => c.kind === "income");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categorias</h1>
        <Link
          href={includeArchived ? "/categories" : "/categories?archived=1"}
          className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          {includeArchived ? "Ocultar arquivadas" : "Mostrar arquivadas"}
        </Link>
      </div>

      <CreateCategoryForm />

      <Section title="Despesas" items={expenses} />
      <Section title="Receitas" items={incomes} />
    </div>
  );
}
