import "server-only";

import { getApiBaseUrl } from "@/lib/config";
import { getAccessToken, refreshSession } from "@/lib/auth/session";
import { apiErrorFromResponse, ApiError } from "./errors";

/**
 * Cliente HTTP server-only para a API Fluxy (Data Access Layer do BFF).
 *
 * - Anexa Authorization: Bearer <access> nas rotas autenticadas.
 * - Parseia o envelope de erro e lança ApiError (reaja pelo `code`).
 * - Interceptor 401: tenta UM refresh rotacionado (serializado) e repete a
 *   chamada uma vez (0004 §2 / 0006 §3.2). Falhou ⇒ propaga UNAUTHORIZED.
 */

type QueryValue = string | number | boolean | undefined | null;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** Corpo JSON (serializado automaticamente). */
  body?: unknown;
  /** Query string; chaves com valor null/undefined são omitidas. */
  query?: Record<string, QueryValue>;
  /** Envia Authorization (default true). Use false em rotas públicas de auth. */
  auth?: boolean;
  /** Tenta refresh+retry em 401 (default true). */
  retryOnAuth?: boolean;
  /** Estratégia de cache do fetch (default "no-store" — dados por usuário). */
  cache?: RequestCache;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${getApiBaseUrl()}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function doFetch(
  path: string,
  opts: RequestOptions,
  accessToken: string | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.auth !== false && accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return fetch(buildUrl(path, opts.query), {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: opts.cache ?? "no-store",
  });
}

/**
 * Executa uma chamada à API e devolve o JSON tipado.
 * Respostas 204 (sem corpo) retornam `undefined`.
 */
export async function apiFetch<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const useAuth = opts.auth !== false;
  let accessToken = useAuth ? await getAccessToken() : undefined;

  let res: Response;
  try {
    res = await doFetch(path, opts, accessToken);

    // Interceptor 401: uma tentativa de refresh rotacionado + retry.
    if (res.status === 401 && useAuth && opts.retryOnAuth !== false) {
      const tokens = await refreshSession();
      if (tokens) {
        accessToken = tokens.accessToken;
        res = await doFetch(path, { ...opts, retryOnAuth: false }, accessToken);
      }
    }
  } catch (cause) {
    // Falha de rede (ex.: API fora do ar / ECONNREFUSED). Transitória —
    // vira ApiError tratável, não um 500 (0006 §3.4).
    throw new ApiError(
      "NETWORK_ERROR",
      0,
      cause instanceof Error ? cause.message : "Network request failed",
    );
  }

  if (!res.ok) {
    throw await apiErrorFromResponse(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export { ApiError };
