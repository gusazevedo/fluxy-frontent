import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 block text-center text-2xl font-semibold">
          Fluxy
        </Link>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          {children}
        </div>
      </div>
    </main>
  );
}
