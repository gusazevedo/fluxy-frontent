import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { hasSession } from "./session";
import type { Me } from "@/lib/api/types";

/**
 * Data Access Layer de autenticação. Centraliza a checagem de sessão e o
 * acesso à conta atual. `cache` memoiza dentro de um mesmo render para evitar
 * múltiplos GET /me (Next: Data Access Layer / authentication guide).
 */

/** Garante que há sessão; caso contrário, manda para o login. */
export async function requireSession(): Promise<void> {
  if (!(await hasSession())) {
    redirect("/login");
  }
}

/** Conta atual (GET /me 🔒), memoizada por render. */
export const getMe = cache(async (): Promise<Me> => {
  return apiFetch<Me>("/me");
});
