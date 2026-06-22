import { logoutAction } from "@/lib/auth/actions";

/** Botão de logout — submete uma Server Action (POST). */
export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Sair
      </button>
    </form>
  );
}
