import "server-only";

import { cookies } from "next/headers";
import { getApiBaseUrl } from "@/lib/config";
import type { TokenPair } from "@/lib/api/types";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  sessionCookieOptions,
} from "./constants";

export { decodeJwtExp, isAccessExpired } from "./jwt";

/**
 * Gestão de sessão via cookies httpOnly server-side (arquitetura BFF).
 *
 * O access (JWT) e o refresh (string opaca) chegam no TokenPair de
 * login/refresh (0004 §1). Aqui ficam guardados em cookies httpOnly — o
 * browser nunca os enxerga, mitigando XSS. A escrita de cookies só é
 * permitida em Server Actions / Route Handlers / proxy (não no render de
 * Server Components); por isso o refresh proativo vive no proxy.ts.
 */

export async function getAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_COOKIE)?.value;
}

export async function hasSession(): Promise<boolean> {
  return Boolean(await getRefreshToken());
}

/** Persiste um novo par de tokens nos cookies httpOnly. */
export async function setSession(tokens: TokenPair): Promise<void> {
  const store = await cookies();
  const opts = sessionCookieOptions();
  store.set(ACCESS_COOKIE, tokens.accessToken, opts);
  store.set(REFRESH_COOKIE, tokens.refreshToken, opts);
}

/** Limpa a sessão local (logout / sessão revogada). */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

// Serializa o refresh: várias chamadas 401 concorrentes reusam um único
// refresh em voo (rotação invalida pares emitidos em paralelo — 0004 §2.3).
let inflightRefresh: Promise<TokenPair | null> | null = null;

/**
 * Rotaciona o par de tokens chamando POST /auth/refresh e persiste o novo par.
 * Retorna o novo TokenPair, ou null se a sessão acabou (deve-se deslogar).
 *
 * Usa fetch direto (não o apiClient) para evitar recursão no interceptor 401.
 */
export async function refreshSession(): Promise<TokenPair | null> {
  if (inflightRefresh) return inflightRefresh;

  inflightRefresh = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    let res: Response;
    try {
      res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });
    } catch {
      // Erro de rede: trate como transitório, NÃO desloga (0006 §3.4).
      return null;
    }

    if (!res.ok) {
      // TOKEN_INVALID / TOKEN_EXPIRED ⇒ sessão acabou (pode ser reuso
      // detectado: backend revoga todas as sessões — 0004 §2.4). Deslogar.
      await clearSession();
      return null;
    }

    const tokens = (await res.json()) as TokenPair;
    await setSession(tokens);
    return tokens;
  })();

  try {
    return await inflightRefresh;
  } finally {
    inflightRefresh = null;
  }
}
