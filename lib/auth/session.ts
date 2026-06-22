import "server-only";

import { cookies } from "next/headers";
import { getApiBaseUrl } from "@/lib/config";
import type { TokenPair } from "@/lib/api/types";

/**
 * Gestão de sessão via cookies httpOnly server-side (arquitetura BFF).
 *
 * O access (JWT) e o refresh (string opaca) chegam no TokenPair de
 * login/refresh (0004 §1). Aqui ficam guardados em cookies httpOnly — o
 * browser nunca os enxerga, mitigando XSS. A escrita de cookies só é
 * permitida em Server Actions / Route Handlers / proxy (não no render de
 * Server Components); por isso o refresh proativo vive no proxy.ts.
 */

const ACCESS_COOKIE = "fluxy_access";
const REFRESH_COOKIE = "fluxy_refresh";

// Refresh token TTL no backend é 30 dias (0004 §1).
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

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
  store.set(ACCESS_COOKIE, tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_MAX_AGE, // a validade real do access é o exp do JWT
  });
  store.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_MAX_AGE,
  });
}

/** Limpa a sessão local (logout / sessão revogada). */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

/** Decodifica o `exp` (epoch s) de um JWT sem verificar a assinatura. */
export function decodeJwtExp(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/** True se o access token está expirado (ou prestes a, com folga de skew). */
export function isAccessExpired(token: string, skewSeconds = 30): boolean {
  const exp = decodeJwtExp(token);
  if (exp === null) return true;
  return Date.now() / 1000 >= exp - skewSeconds;
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
