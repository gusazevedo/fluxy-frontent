import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Fluxy</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Controle simples das suas finanças pessoais.
        </p>
      </div>
      <Link
        href="/login"
        className="rounded-full bg-foreground px-6 py-3 text-background transition-colors hover:opacity-90"
      >
        Entrar
      </Link>
    </main>
  );
}
