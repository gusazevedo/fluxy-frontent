import Link from "next/link";
import { getMe } from "@/lib/auth/dal";

export default async function DashboardPage() {
  const me = await getMe();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Olá!</h1>
        <p className="text-zinc-600 dark:text-zinc-400">{me.email}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/transactions"
          className="rounded-lg border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          <div className="font-medium">Transações</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Registre despesas e receitas
          </div>
        </Link>
        <Link
          href="/categories"
          className="rounded-lg border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          <div className="font-medium">Categorias</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Organize seus lançamentos
          </div>
        </Link>
        <Link
          href="/reports"
          className="rounded-lg border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          <div className="font-medium">Relatórios</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Veja para onde o dinheiro vai
          </div>
        </Link>
      </div>
    </div>
  );
}
