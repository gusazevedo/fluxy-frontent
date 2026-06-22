import Link from "next/link";
import { getMe } from "@/lib/auth/dal";
import { formatTimestamp } from "@/lib/date";

export default async function AccountPage() {
  const me = await getMe();

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Conta</h1>

      <dl className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        <div className="flex justify-between px-4 py-3">
          <dt className="text-zinc-600 dark:text-zinc-400">E-mail</dt>
          <dd className="font-medium">{me.email}</dd>
        </div>
        <div className="flex justify-between px-4 py-3">
          <dt className="text-zinc-600 dark:text-zinc-400">E-mail verificado</dt>
          <dd className="font-medium">{me.emailVerified ? "Sim" : "Não"}</dd>
        </div>
        <div className="flex justify-between px-4 py-3">
          <dt className="text-zinc-600 dark:text-zinc-400">Conta criada em</dt>
          <dd className="font-medium">{formatTimestamp(me.createdAt)}</dd>
        </div>
      </dl>

      <Link
        href="/account/change-password"
        className="inline-block rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
      >
        Trocar senha
      </Link>
    </div>
  );
}
