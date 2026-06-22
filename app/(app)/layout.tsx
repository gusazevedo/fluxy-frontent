import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { Nav } from "@/components/app/nav";
import { LogoutButton } from "@/components/app/logout-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defesa em profundidade: o proxy já protege, mas reverificamos aqui.
  await requireSession();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/dashboard" className="text-lg font-semibold">
            Fluxy
          </Link>
          <Nav />
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
